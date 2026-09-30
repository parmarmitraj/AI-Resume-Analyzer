from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from extractor import extract_text_from_pdf
from cleaner import clean_resume_text
from skill_extractor import extract_skills

# This dictionary maps specific aliases and tools to their standard names and broader categories.
# You can expand this database over time to make the AI smarter.
SKILL_KNOWLEDGE_BASE = {
    # Alias Resolution (Standardizing syntax variations)
    "nodejs": ["node.js"],
    "react.js": ["react"],
    "reactjs": ["react"],
    "express.js": ["express", "api", "backend development"],
    
    # Skill Inference (Inferring implicit knowledge based on tools)
    "mern": ["react", "node.js", "express", "mongodb", "frontend development", "backend development", "api"],
    "react": ["react", "frontend development", "html", "css", "javascript"],
    "node.js": ["node.js", "backend development", "api", "javascript"],
    "python": ["python", "backend development"],
    "machine learning": ["ai", "machine learning"],
    "scikit-learn": ["machine learning", "python", "ai"],
    "pandas": ["python", "data analysis"],
    "xgboost": ["machine learning", "ai"]
}

def normalize_and_infer(extracted_skills):
    """
    Takes a list of extracted skills and returns a set containing the original 
    skills plus any standard aliases and inferred broader categories.
    """
    final_skills = set()
    for skill in extracted_skills:
        skill_lower = skill.lower()
        
        # 1. Always add the original skill found by the extractor
        final_skills.add(skill_lower)
        
        # 2. If the skill exists in our knowledge base, add all its mapped aliases and inferred skills
        if skill_lower in SKILL_KNOWLEDGE_BASE:
            for inferred_skill in SKILL_KNOWLEDGE_BASE[skill_lower]:
                final_skills.add(inferred_skill)
                
    return final_skills

def calculate_match(resume_text, jd_text):
    # 1. Clean both documents to remove noise
    clean_resume = clean_resume_text(resume_text)
    clean_jd = clean_resume_text(jd_text)

    # 2. Extract specific technical skills (Hard Matching)
    raw_resume_skills = extract_skills(clean_resume)
    raw_jd_skills = extract_skills(clean_jd)

    # We pass the raw extracted lists through our logic to expand them with synonyms
    resume_skills = normalize_and_infer(raw_resume_skills)
    jd_skills = normalize_and_infer(raw_jd_skills)

    if not jd_skills:
        print("Warning: No skills found in the Job Description.")
        skill_score = 0
        matched_skills = set()
        missing_skills = set()
    else:
        # Intersection: Skills present in BOTH sets
        matched_skills = resume_skills.intersection(jd_skills)
        # Difference: Skills in JD but NOT in Resume
        missing_skills = jd_skills - resume_skills
        # Calculate percentage of required skills met
        skill_score = (len(matched_skills) / len(jd_skills)) * 100

    # 3. TF-IDF Vectorization & Contextual Similarity (Soft Matching)
    vectorizer = TfidfVectorizer()
    # Fit the vectorizer on both documents to build the vocabulary, then transform them to vectors
    vectors = vectorizer.fit_transform([clean_jd, clean_resume])
    
    # Calculate the angle between Vector 0 (JD) and Vector 1 (Resume)
    cosine_sim = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
    cosine_score = cosine_sim * 100

    # 4. Final Weighted Score
    # We prioritize exact skill matches (60% weight) but still value overall contextual similarity (40% weight)
    final_score = (skill_score * 0.60) + (cosine_score * 0.40)

    return {
        "matched_skills": list(matched_skills),
        "missing_skills": list(missing_skills),
        "skill_score_pct": round(skill_score, 2),
        "context_score_pct": round(cosine_score, 2),
        "final_match_pct": round(final_score, 2)
    }

# --- Test the Pipeline ---
if __name__ == "__main__":
    resume_path = "resumes/sample.pdf"
    
    # Example Job Description
    sample_jd = """
    Technical Skills: ● Programming: Basic working knowledge of Python. ● Backend: Basic understanding of APIs and backend development (REST APIs, server logic). ● Frontend: Basic knowledge of HTML, CSS, JavaScript, and frontend development. ● Databases: Understanding of databases and CRUD operations. ● AI/LLM APIs: Interest in integrating LLM APIs (OpenAI, Claude, Gemini, or similar) into applications. ● AI Tooling: Comfort using AI tools (ChatGPT, Claude, Cursor, Replit, Lovable, etc.) to build faster. Soft Skills & Mindset: ● Ownership mindset, not just a task-completion mindset, with eagerness to build quickly. ● Clear communicator who can document work and ask the right questions when blocked. ● Collaboration: Ability to work in fast-moving teams and follow project guidelines. ● Problem-Solving: Ability to search, learn, debug, and implement independently. Bonus Skills (Not Mandatory, but Nice to Have): ● Experience with FastAPI, Flask, or Node.js. ● Experience with React, Next.js, Streamlit, or similar frontend tools. ● Exposure to LangChain, LangGraph, RAG, embeddings, vector databases, or AI agents. ● Knowledge of Supabase, Firebase, PostgreSQL, or similar databases. ● Basic Git / GitHub knowledge and understanding of prompt engineering or structured AI outputs. ● Any prior project experience, even a university capstone, chatbot, dashboard, or personal AI app.3. What You'll Work On ● Build AI-powered micro apps for internal teams and clients. ● Create custom dashboards and internal productivity tools. ● Develop AI-native applications using LLM APIs. ● Work on document automation, proposal generation, report generation, resume/JD matching, and meeting summary tools. ● Assist in building AI agents, RAG flows, vector search, and document-based AI assistants. ● Build simple full-stack AI applications across frontend, backend, APIs, databases, and AI models.● Convert business requirements into working prototypes and MVPs quickly using modern AI tools. ● Test AI outputs, debug flows, and improve accuracy, formatting, and edge-case handling.    
"""
    
    # Extract text from the resume
    raw_resume = extract_text_from_pdf(resume_path)
    
    # Run the matching algorithm
    print("\n--- Running AI Resume Analysis ---")
    results = calculate_match(raw_resume, sample_jd)
    
    print(f"\nOverall Match Score: {results['final_match_pct']}%")
    print(f"Context Similarity (TF-IDF): {results['context_score_pct']}%")
    print(f"Exact Skill Match: {results['skill_score_pct']}%\n")
    
    print("Matched Skills:")
    for skill in results['matched_skills']:
        print(f"  [✓] {skill.title()}")
        
    print("\nMissing Skills (To Improve):")
    for skill in results['missing_skills']:
        print(f"  [X] {skill.title()}")