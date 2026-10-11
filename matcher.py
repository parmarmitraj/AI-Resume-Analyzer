import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from extractor import extract_text_from_pdf
from cleaner import clean_resume_text
from skill_extractor import extract_skills

# ──────────────────────────────────────────────────────────────────────
# 1. Skill Knowledge Base
# ──────────────────────────────────────────────────────────────────────
# This dictionary maps specific aliases/tools to their standard names and
# broader categories. Lookups are performed in LOWERCASE.
# You can expand this database over time to make the AI smarter.
SKILL_KNOWLEDGE_BASE = {
    # --- Alias Resolution (Standardizing syntax variations) ---
    "nodejs":       ["node.js"],
    "node":         ["node.js"],
    "react.js":     ["react"],
    "reactjs":      ["react"],
    "vue.js":       ["vue"],
    "vuejs":        ["vue"],
    "express.js":   ["express"],
    "expressjs":    ["express"],
    "next.js":      ["next"],
    "nextjs":       ["next"],
    "angular.js":   ["angular"],
    "angularjs":    ["angular"],
    "scikit-learn": ["sklearn"],
    "sklearn":      ["scikit-learn"],
    "postgres":     ["postgresql"],
    "mongo":        ["mongodb"],
    "k8s":          ["kubernetes"],
    "tf":           ["tensorflow"],
    "js":           ["javascript"],
    "ts":           ["typescript"],
    "aws":          ["amazon web services"],
    "gcp":          ["google cloud platform"],
    
    # --- Skill Inference (Inferring implicit knowledge based on tools) ---
    "mern":         ["react", "node.js", "express", "mongodb", "frontend development", "backend development", "api", "javascript"],
    "mean":         ["angular", "node.js", "express", "mongodb", "frontend development", "backend development", "api", "javascript"],
    "react":        ["frontend development", "javascript"],
    "angular":      ["frontend development", "javascript", "typescript"],
    "vue":          ["frontend development", "javascript"],
    "next":         ["frontend development", "react", "javascript"],
    "node.js":      ["backend development", "api", "javascript"],
    "express":      ["backend development", "api", "node.js"],
    "django":       ["backend development", "python"],
    "flask":        ["backend development", "python"],
    "fastapi":      ["backend development", "python", "api"],
    "spring":       ["backend development", "java"],
    "python":       ["python"],
    "java":         ["java"],
    "javascript":   ["javascript"],
    "typescript":   ["javascript", "typescript"],
    "machine learning": ["ai", "machine learning"],
    "deep learning":    ["ai", "machine learning", "deep learning"],
    "scikit-learn": ["machine learning", "python", "ai"],
    "tensorflow":   ["machine learning", "deep learning", "ai", "python"],
    "pytorch":      ["machine learning", "deep learning", "ai", "python"],
    "keras":        ["machine learning", "deep learning", "ai", "python"],
    "pandas":       ["python", "data analysis"],
    "numpy":        ["python", "data analysis"],
    "xgboost":      ["machine learning", "ai"],
    "langchain":    ["ai", "llm"],
    "openai":       ["ai", "llm"],
    "docker":       ["devops", "containerization"],
    "kubernetes":   ["devops", "containerization"],
    "git":          ["version control"],
    "github":       ["version control", "git"],
    "mongodb":      ["database", "nosql"],
    "postgresql":   ["database", "sql"],
    "mysql":        ["database", "sql"],
    "firebase":     ["database", "cloud"],
    "supabase":     ["database", "cloud"],
    "redis":        ["database", "caching"],
    "html":         ["frontend development"],
    "css":          ["frontend development"],
    "streamlit":    ["python", "frontend development"],
}


def normalize_and_infer(extracted_skills):
    """
    Takes a list of extracted skills and returns a set containing the original
    skills (lowercased for comparison) plus any standard aliases and inferred
    broader categories from the knowledge base.
    """
    final_skills = set()
    
    for skill in extracted_skills:
        skill_lower = skill.lower().strip()
        
        if not skill_lower:
            continue
        
        # 1. Always add the original skill found by the extractor
        final_skills.add(skill_lower)
        
        # 2. If the skill exists in our knowledge base, add all its mapped aliases/inferences
        if skill_lower in SKILL_KNOWLEDGE_BASE:
            for inferred_skill in SKILL_KNOWLEDGE_BASE[skill_lower]:
                final_skills.add(inferred_skill.lower())
    
    return final_skills


# ──────────────────────────────────────────────────────────────────────
# 2. Core Matching Logic
# ──────────────────────────────────────────────────────────────────────

def calculate_match(resume_text, jd_text):
    """
    Two-pronged matching:
      1. Exact Skill Match (Set Math) — via BiLSTM NER + Knowledge Base
      2. Context Similarity (TF-IDF Cosine) — via cleaned text vectors
    
    IMPORTANT FIX (Bug #2): The BiLSTM receives ORIGINAL-CASED text.
    The cleaner (which lowercases + lemmatizes) is ONLY used for TF-IDF.
    """
    # ── Step 1: Extract skills from RAW text (preserves casing for BiLSTM) ──
    # DO NOT pass cleaned/lowercased text to the BiLSTM — it was trained on
    # original casing and will map lowercased tokens to <UNK>.
    raw_resume_skills = extract_skills(resume_text)
    raw_jd_skills = extract_skills(jd_text)
    
    # Expand with aliases and inferences (all comparisons done in lowercase)
    resume_skills = normalize_and_infer(raw_resume_skills)
    jd_skills = normalize_and_infer(raw_jd_skills)
    
    # ── Step 2: Set-based Exact Match Scoring ──
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
    
    # ── Step 3: TF-IDF Contextual Similarity (uses cleaned text) ──
    # The cleaner is appropriate HERE — TF-IDF benefits from lemmatization
    # and stopword removal for better vocabulary overlap.
    clean_resume = clean_resume_text(resume_text)
    clean_jd = clean_resume_text(jd_text)
    
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([clean_jd, clean_resume])
    
    cosine_sim = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
    cosine_score = cosine_sim * 100
    
    # ── Step 4: Final Weighted Score ──
    # 50% exact skill match + 50% contextual similarity
    raw_final_score = (skill_score * 0.50) + (cosine_score * 0.50)
    
    # --- NON-LINEAR SCALING (CURVING) ---
    # Keyword matching naturally yields lower scores because no candidate has 100% of all JD keywords.
    # We apply a square-root curve (commonly used in grading) to scale the score up to human intuition:
    # 20% -> 44%, 60% -> 77%, 85% -> 92%, 100% -> 100%
    final_score = math.sqrt(raw_final_score / 100.0) * 100.0 if raw_final_score > 0 else 0.0
    
    return {
        "matched_skills": sorted(list(matched_skills)),
        "missing_skills": sorted(list(missing_skills)),
        "skill_score_pct": float(round(skill_score, 2)),
        "context_score_pct": float(round(cosine_score, 2)),
        "final_match_pct": float(round(final_score, 2))
    }


def process_resume(pdf_bytes, jd_text, return_raw_text=False):
    """
    Production entry point:
    Accepts raw PDF byte stream (or file path) and Job Description text,
    extracts resume text, and runs the hybrid BiLSTM NER + TF-IDF scoring pipeline.

    Args:
        pdf_bytes (bytes | bytearray | str): Raw bytes of the PDF file or a file path.
        jd_text (str): Job description text string.
        return_raw_text (bool): Whether to include the raw extracted resume text.

    Returns:
        dict: A JSON-compatible dictionary with matching metrics and skills.
    """
    raw_resume_text = extract_text_from_pdf(pdf_bytes)
    match_result = calculate_match(raw_resume_text, jd_text)
    if return_raw_text:
        match_result["raw_text"] = raw_resume_text
    return match_result