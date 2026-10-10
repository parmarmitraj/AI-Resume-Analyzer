import os
import json
from fastapi import FastAPI, UploadFile, Form, File
from extractor import extract_text_from_pdf
from matcher import calculate_match
from feedback import generate_feedback

# Initialize the API server
app = FastAPI(title="AI Resume Analyzer API")

# Define the endpoint that the frontend will call
@app.post("/api/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    # 1. Save the incoming network file temporarily to the local disk
    temp_file_path = f"temp_{resume.filename}"
    with open(temp_file_path, "wb") as buffer:
        # Read the file bytes asynchronously so the server doesn't freeze
        buffer.write(await resume.read())

    try:
        # 2. Feed the file into your Phase 2 and Phase 3 logic
        raw_text = extract_text_from_pdf(temp_file_path)
        match_results = calculate_match(raw_text, job_description)
        
        # 3. Generate the human-readable summary and context-aware score (Phase 4)
        ai_response_string = generate_feedback(match_results, raw_text, job_description)
        
        # Parse the string into an actual JSON object to ensure clean data transfer
        feedback_json = json.loads(ai_response_string)
        
        # Override the rigid mathematical score with the LLM's genuine contextual score
        if "genuine_score" in feedback_json:
            match_results["final_match_pct"] = feedback_json["genuine_score"]

    finally:
        # 4. Clean up the disk regardless of success or failure
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

    # 5. Return the complete package back to the Node.js/React frontend
    return {
        "status": "success",
        "data": {
            "metrics": match_results,
            "evaluation": feedback_json
        }
    }