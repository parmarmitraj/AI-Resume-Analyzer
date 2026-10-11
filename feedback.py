import os
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

from dotenv import load_dotenv
from google import genai
from google.genai import types
from extractor import extract_text_from_pdf
from matcher import calculate_match

# Load the variables from the .env file into the system
load_dotenv()

# 1. Initialize the Gemini Client
# The SDK automatically detects the GEMINI_API_KEY from environment or .env
client = None

def get_gemini_client():
    global client
    if client is None:
        client = genai.Client()
    return client

def generate_feedback(match_results, resume_text, jd_text, job_role="Software Engineer"):
    # 2. Construct the Prompt
    # We dynamically inject the variables calculated from Phase 3, PLUS the raw text
    prompt = f"""
    You are an expert technical recruiter evaluating a candidate for a {job_role} position.
    
    Here is the exact Job Description:
    {jd_text}
    
    Here is the candidate's Resume Text:
    {resume_text}
    
    Here is the keyword-based analysis data:
    - Base Math Score: {match_results['final_match_pct']}%
    - Matched Skills: {', '.join(match_results['matched_skills'])}
    - Missing Skills: {', '.join(match_results['missing_skills'])}
    
    Based on all of this data, provide a brief, encouraging summary of their fit, and suggest exactly 
    how they can improve their resume. 
    
    Crucially, evaluate the resume semantically against the job description and assign a "genuine_score" 
    out of 100. This score should reflect how well the candidate actually fits the role (distinguishing 
    between mandatory and bonus requirements), ignoring the strict keyword math.

    Return the response STRICTLY as a JSON object containing exactly three keys:
    1. "summary": A string containing a 2-3 sentence overview of their candidacy. (Use common sense, e.g. if they know React, don't tell them they are missing HTML/JS).
    2. "improvement_tips": An array of strings, where each string is a bullet point of advice.
    3. "genuine_score": An integer between 0 and 100 representing the true contextual match.
    """
    
    ai_client = get_gemini_client()
    
    # 3. Call the API and enforce JSON output
    response = ai_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    
    # The API returns the raw JSON string
    return response.text
