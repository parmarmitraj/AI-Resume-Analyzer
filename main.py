import json
import logging
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from matcher import process_resume
from feedback import generate_feedback

logger = logging.getLogger("uvicorn.error")

# Initialize FastAPI application
app = FastAPI(
    title="AI Resume Analyzer API",
    description="Dual-role (Student & Recruiter) AI-powered Resume Analyzer using Custom BiLSTM NER, TF-IDF Scorer, and Gemini LLM Feedback",
    version="1.0.0"
)

# Configure CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development; can be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "AI Resume Analyzer API",
        "version": "1.0.0"
    }


# ─────────────────────────────────────────────────────────────────────────────
# Endpoint A: Student Portal (Single Resume In-Depth Analysis + AI Feedback)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/student/analyze", status_code=status.HTTP_200_OK)
async def analyze_student_resume(
    resume: UploadFile = File(..., description="Single resume file in PDF format"),
    job_description: str = Form(..., description="Target Job Description text"),
    job_role: Optional[str] = Form("Software Engineer", description="Target job role (optional, defaults to Software Engineer)")
):
    """
    Analyzes a single student resume against a target job description.
    1. Runs the custom BiLSTM NER skill extraction pipeline and TF-IDF contextual scorer.
    2. Calls Gemini API to generate tailored coaching feedback (candidacy summary, 
       actionable improvement bullet points, and a genuine semantic fit score).
    """
    if not job_description or not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty."
        )

    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format for '{resume.filename}'. Only PDF files (.pdf) are supported."
        )

    try:
        # Read the raw byte stream directly into memory
        pdf_bytes = await resume.read()
        if not pdf_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Uploaded file '{resume.filename}' is empty."
            )

        # 1. Execute ML pipeline (BiLSTM NER + TF-IDF)
        result = process_resume(pdf_bytes, job_description.strip(), return_raw_text=True)
        raw_resume_text = result.pop("raw_text", "")

        # 2. Generate contextual LLM feedback via Gemini API
        ai_feedback = None
        try:
            feedback_raw = generate_feedback(
                match_results=result,
                resume_text=raw_resume_text,
                jd_text=job_description.strip(),
                job_role=job_role
            )
            ai_feedback = json.loads(feedback_raw)
        except Exception as gemini_err:
            logger.warning(f"Gemini feedback generation skipped or failed: {gemini_err}")
            ai_feedback = {
                "summary": "AI feedback generation is temporarily unavailable.",
                "improvement_tips": [
                    f"Consider adding missing skills: {', '.join(result['missing_skills'][:5])}" if result["missing_skills"] else "Highlight more project experience relevant to the job requirements."
                ],
                "genuine_score": int(result["final_match_pct"]),
                "note": "Fallback evaluation generated from local ML scoring."
            }

        return {
            "status": "success",
            "filename": resume.filename,
            "data": {
                "final_match_pct": result["final_match_pct"],
                "skill_score_pct": result["skill_score_pct"],
                "context_score_pct": result["context_score_pct"],
                "matched_skills": result["matched_skills"],
                "missing_skills": result["missing_skills"],
                "feedback": ai_feedback
            }
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing '{resume.filename}': {str(exc)}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Endpoint B: Recruiter Portal (Bulk Candidate Screening & Leaderboard)
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/recruiter/bulk-rank", status_code=status.HTTP_200_OK)
async def bulk_rank_resumes(
    resumes: List[UploadFile] = File(..., description="List of PDF resumes to analyze"),
    job_description: str = Form(..., description="Target Job Description text")
):
    """
    Evaluates multiple resumes simultaneously against a single job description.
    Processes each candidate through the ML pipeline and returns a sorted leaderboard
    ranked from highest Final Match % to lowest.
    """
    if not job_description or not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty."
        )

    if not resumes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least one resume PDF."
        )

    candidates = []
    skipped_files = []

    for file in resumes:
        if not file.filename.lower().endswith(".pdf"):
            skipped_files.append({
                "filename": file.filename,
                "reason": "Unsupported format (must be .pdf)"
            })
            continue

        try:
            pdf_bytes = await file.read()
            if not pdf_bytes:
                skipped_files.append({
                    "filename": file.filename,
                    "reason": "File is empty"
                })
                continue

            result = process_resume(pdf_bytes, job_description.strip())

            candidates.append({
                "filename": file.filename,
                "final_match_pct": result["final_match_pct"],
                "skill_score_pct": result["skill_score_pct"],
                "context_score_pct": result["context_score_pct"],
                "matched_skills": result["matched_skills"],
                "missing_skills": result["missing_skills"],
                "matched_skills_count": len(result["matched_skills"]),
                "missing_skills_count": len(result["missing_skills"])
            })
        except Exception as exc:
            skipped_files.append({
                "filename": file.filename,
                "reason": f"Failed to extract/process: {str(exc)}"
            })

    # Sort leaderboard from highest Final Match % to lowest
    candidates.sort(key=lambda c: c["final_match_pct"], reverse=True)

    # Assign 1-indexed ranks
    leaderboard = []
    for rank_idx, candidate in enumerate(candidates, start=1):
        leaderboard.append({
            "rank": rank_idx,
            **candidate
        })

    return {
        "status": "success",
        "total_resumes_received": len(resumes),
        "total_ranked": len(leaderboard),
        "total_skipped": len(skipped_files),
        "leaderboard": leaderboard,
        "skipped_files": skipped_files
    }