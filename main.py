"""
main.py - FastAPI Application Entry Point
==========================================
AI Resume Analyzer - Dual-Role API (Student + Recruiter)

Phase 1 Fixes:
  * Student endpoint now calls generate_feedback() and bundles Gemini AI
    feedback into the same flat response envelope (no nested 'data' key).
  * Recruiter endpoint exposed at BOTH /api/recruiter/rank (spec) and
    /api/recruiter/bulk-rank (legacy) - scores only, no Gemini call (fast).
  * BiLSTM model loaded once at startup via lifespan context manager.
  * Model load failures are caught - server stays up, endpoints return 503.
"""

import json
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from matcher import process_resume, normalize_and_infer
from cleaner import clean_resume_text
from feedback import generate_feedback
from skill_extractor import load_model_artifacts, extract_skills

logger = logging.getLogger("uvicorn.error")

_model_ready = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: load model artifacts into memory.
    Shutdown: nothing to do (Keras models release memory automatically).
    """
    global _model_ready
    try:
        load_model_artifacts(
            model_path="custom_ner_bilstm.keras",
            vocab_path="vocab.json"
        )
        _model_ready = True
        logger.info("BiLSTM NER model loaded and ready.")
    except FileNotFoundError as exc:
        logger.error(
            f"Model not found at startup: {exc}\n"
            "    Run 'python train_kaggle.py' to train the model, "
            "then restart the server."
        )
        _model_ready = False
    except Exception as exc:
        logger.error(f"Unexpected error loading NER model: {exc}")
        _model_ready = False

    yield                   

    logger.info("Server shutting down. Model resources released.")

app = FastAPI(
    title="AI Resume Analyzer API",
    description=(
        "Dual-role (Student & Recruiter) AI-powered Resume Analyzer "
        "using a custom BiLSTM NER model + TF-IDF cosine similarity."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _require_model():
    if not _model_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "NER model is not loaded. "
                "Ensure 'custom_ner_bilstm.keras' and 'vocab.json' exist "
                "in the project root and restart the server."
            ),
        )

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "model_ready": _model_ready,
        "version": "2.0.0",
    }

@app.post("/api/student/analyze", status_code=status.HTTP_200_OK)
async def analyze_student_resume(
    resume: UploadFile = File(..., description="Candidate resume PDF"),
    job_description: str = Form(..., description="Target Job Description text"),
    job_role: str = Form(default="Software Engineer", description="Target job role title"),
):
    """
    Evaluates a single resume against a job description.

    Returns:
      - final_match_pct  : Weighted ATS match score (skill + context, curved)
      - skill_score_pct  : Dictionary-based exact skill match %
      - context_score_pct: TF-IDF cosine similarity %
      - matched_skills   : Skills found in both resume and JD
      - missing_skills   : Skills in JD but absent from resume
      - feedback         : Gemini AI qualitative feedback object:
            { summary, improvement_tips, genuine_score }
    """
    _require_model()

    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )
    if not job_description or not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty.",
        )

    pdf_bytes = await resume.read()
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
                                                                 
        match_result = process_resume(
            pdf_bytes,
            job_description.strip(),
            return_raw_text=True,                                       
        )
        raw_resume_text = match_result.pop("raw_text", "")

        ai_feedback_obj = {}
        try:
            feedback_json_str = generate_feedback(
                match_results=match_result,
                resume_text=raw_resume_text,
                jd_text=job_description.strip(),
                job_role=job_role.strip() or "Software Engineer",
            )
            ai_feedback_obj = json.loads(feedback_json_str)
        except Exception as feedback_exc:
            logger.warning(f"Gemini feedback failed (non-fatal): {feedback_exc}")
            ai_feedback_obj = {
                "summary": "AI feedback temporarily unavailable.",
                "improvement_tips": [],
                "genuine_score": match_result.get("final_match_pct", 0),
            }

        return {
            "status": "success",
            "final_match_pct": match_result["final_match_pct"],
            "skill_score_pct": match_result["skill_score_pct"],
            "context_score_pct": match_result["context_score_pct"],
            "matched_skills": match_result["matched_skills"],
            "missing_skills": match_result["missing_skills"],
            "feedback": ai_feedback_obj,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Student analyze error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume analysis failed: {str(exc)}",
        )

async def _do_bulk_rank(resumes: List[UploadFile], job_description: str):
    """
    Shared implementation for both /rank and /bulk-rank route aliases.
    Evaluates multiple resumes, returns sorted leaderboard.
    No Gemini call per candidate — fast O(n) processing.
    """
    _require_model()

    if not job_description or not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty.",
        )
    if not resumes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least one resume PDF.",
        )

    candidates = []
    skipped_files = []

    jd_raw_skills = extract_skills(job_description.strip())
    jd_skills = normalize_and_infer(jd_raw_skills)
    clean_jd = clean_resume_text(job_description.strip())

    for file in resumes:
        if not file.filename.lower().endswith(".pdf"):
            skipped_files.append({
                "filename": file.filename,
                "reason": "Unsupported format (must be .pdf)",
            })
            continue

        try:
            pdf_bytes = await file.read()
            if not pdf_bytes:
                skipped_files.append({
                    "filename": file.filename,
                    "reason": "File is empty",
                })
                continue

            result = process_resume(
                pdf_bytes,
                job_description.strip(),
                jd_skills=jd_skills,
                clean_jd=clean_jd
            )
            clean_name = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
            candidates.append({
                "candidateName": clean_name,
                "fileName": file.filename,
                "filename": file.filename,
                "matchScore": result["final_match_pct"],
                "final_match_pct": result["final_match_pct"],
                "skillScore": result["skill_score_pct"],
                "skill_score_pct": result["skill_score_pct"],
                "contextScore": result["context_score_pct"],
                "context_score_pct": result["context_score_pct"],
                "extractedSkills": result["matched_skills"],
                "matched_skills": result["matched_skills"],
                "missingSkills": result["missing_skills"],
                "missing_skills": result["missing_skills"],
                "matched_skills_count": len(result["matched_skills"]),
                "missing_skills_count": len(result["missing_skills"]),
            })
        except Exception as exc:
            skipped_files.append({
                "filename": file.filename,
                "reason": f"Processing failed: {str(exc)}",
            })

    candidates.sort(key=lambda c: c["final_match_pct"], reverse=True)
    leaderboard = [{"id": f"cand-{i + 1}", "rank": i + 1, **c} for i, c in enumerate(candidates)]

    return {
        "status": "success",
        "total_resumes_received": len(resumes),
        "total_ranked": len(leaderboard),
        "total_skipped": len(skipped_files),
        "leaderboard": leaderboard,
        "skipped_files": skipped_files,
    }

@app.post("/api/recruiter/rank", status_code=status.HTTP_200_OK)
async def rank_resumes(
    resumes: List[UploadFile] = File(..., description="Multiple candidate resume PDFs"),
    job_description: str = Form(..., description="Target Job Description text"),
):
    """
    Evaluates multiple resumes against one job description.
    Returns a ranked leaderboard sorted by Final Match % (descending).
    No Gemini API call — scores only for fast bulk processing.
    """
    return await _do_bulk_rank(resumes, job_description)

@app.post("/api/recruiter/bulk-rank", status_code=status.HTTP_200_OK)
async def bulk_rank_resumes(
    resumes: List[UploadFile] = File(..., description="Multiple candidate resume PDFs"),
    job_description: str = Form(..., description="Target Job Description text"),
):
    """Legacy alias for /api/recruiter/rank — kept for backward compatibility."""
    return await _do_bulk_rank(resumes, job_description)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
