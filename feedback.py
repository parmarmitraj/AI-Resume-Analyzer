import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from extractor import extract_text_from_pdf
from matcher import calculate_match

# Load the variables from the .env file into the system
load_dotenv()

# 1. Initialize the Gemini Client
# The SDK automatically detects the GEMINI_API_KEY you set in your terminal
client = genai.Client()

def generate_feedback(match_results, job_role="Software Engineer"):
    # 2. Construct the Prompt
    # We dynamically inject the variables calculated from Phase 3
    prompt = f"""
    You are an expert technical recruiter evaluating a candidate for a {job_role} position.
    
    Here is the analysis data:
    - Match Score: {match_results['final_match_pct']}%
    - Matched Skills: {', '.join(match_results['matched_skills'])}
    - Missing Skills: {', '.join(match_results['missing_skills'])}
    
    Based on this data, provide a brief, encouraging summary of their fit, and suggest exactly 
    how they can improve their resume based on the missing skills.
    
    Return the response STRICTLY as a JSON object containing exactly two keys:
    1. "summary": A string containing a 2-3 sentence overview of their candidacy.
    2. "improvement_tips": An array of strings, where each string is a bullet point of advice.
    """
    
    print("Connecting to Gemini API...")
    
    # 3. Call the API and enforce JSON output
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    
    # The API returns the raw JSON string
    return response.text

# --- Test the Pipeline ---
if __name__ == "__main__":
    resume_path = "resumes/sample.pdf"
    
    # Example Job Description
    sample_jd = """
    Technical Skills: ● Programming: Basic working knowledge of Python. ● Backend: Basic understanding of APIs and backend development (REST APIs, server logic). ● Frontend: Basic knowledge of HTML, CSS, JavaScript, and frontend development. ● Databases: Understanding of databases and CRUD operations. ● AI/LLM APIs: Interest in integrating LLM APIs (OpenAI, Claude, Gemini, or similar) into applications. ● AI Tooling: Comfort using AI tools (ChatGPT, Claude, Cursor, Replit, Lovable, etc.) to build faster. Soft Skills & Mindset: ● Ownership mindset, not just a task-completion mindset, with eagerness to build quickly. ● Clear communicator who can document work and ask the right questions when blocked. ● Collaboration: Ability to work in fast-moving teams and follow project guidelines. ● Problem-Solving: Ability to search, learn, debug, and implement independently. Bonus Skills (Not Mandatory, but Nice to Have): ● Experience with FastAPI, Flask, or Node.js. ● Experience with React, Next.js, Streamlit, or similar frontend tools. ● Exposure to LangChain, LangGraph, RAG, embeddings, vector databases, or AI agents. ● Knowledge of Supabase, Firebase, PostgreSQL, or similar databases. ● Basic Git / GitHub knowledge and understanding of prompt engineering or structured AI outputs. ● Any prior project experience, even a university capstone, chatbot, dashboard, or personal AI app.3. What You'll Work On ● Build AI-powered micro apps for internal teams and clients. ● Create custom dashboards and internal productivity tools. ● Develop AI-native applications using LLM APIs. ● Work on document automation, proposal generation, report generation, resume/JD matching, and meeting summary tools. ● Assist in building AI agents, RAG flows, vector search, and document-based AI assistants. ● Build simple full-stack AI applications across frontend, backend, APIs, databases, and AI models.● Convert business requirements into working prototypes and MVPs quickly using modern AI tools. ● Test AI outputs, debug flows, and improve accuracy, formatting, and edge-case handling.    
    """
    
    # Step A: Extract
    raw_resume = extract_text_from_pdf(resume_path)
    
    # Step B: Match
    print("Calculating Match Metrics...")
    results = calculate_match(raw_resume, sample_jd)
    
    # Step C: Generate AI Feedback
    json_feedback = generate_feedback(results)
    
    print("\n--- Final API Response (Ready for Frontend) ---\n")
    print(json_feedback)