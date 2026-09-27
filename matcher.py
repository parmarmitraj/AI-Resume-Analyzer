from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from extractor import extract_text_from_pdf
from cleaner import clean_resume_text
from skill_extractor import extract_skills

def calculate_match(resume_text, jd_text):
    # 1. Clean both documents to remove noise
    clean_resume = clean_resume_text(resume_text)
    clean_jd = clean_resume_text(jd_text)

    # 2. Extract specific technical skills (Hard Matching)
    # We convert lists to Python 'sets' to easily perform mathematical operations like intersection
    resume_skills = set(extract_skills(clean_resume))
    jd_skills = set(extract_skills(clean_jd))

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
    
    # Example Job Description (You can replace this with a real one)
    sample_jd = """
    We are seeking a Full Stack Software Engineer to join our team. The ideal candidate will have 
    strong experience building web applications using Java, Spring MVC, and React. 
    You should have a solid understanding of relational databases like MySQL and experience 
    writing complex SQL queries. Familiarity with Python and machine learning pipelines is a plus.
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