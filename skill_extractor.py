import spacy
import pandas as pd
from cleaner import clean_resume_text
from extractor import extract_text_from_pdf

print("Loading spaCy NLP model...")
nlp = spacy.load("en_core_web_sm")
ruler = nlp.add_pipe("entity_ruler", before="ner")

def load_skills_from_csv(csv_path):
    print(f"Loading skills database from {csv_path}...")
    
    # 1. Ingest the CSV file using pandas
    # header=None ensures we don't accidentally skip the first skill if the file lacks a title row
    try:
        df = pd.read_csv(csv_path, header=None)
    except FileNotFoundError:
        print(f"Error: Could not find '{csv_path}'. Please ensure the file is in the project folder.")
        return []
    
    # 2. Extract the first column, drop any empty rows, convert to string, and lowercase
    raw_skills = df.iloc[:, 0].dropna().astype(str).str.lower().tolist()
    
    # 3. Format the data into the dictionary pattern required by spaCy
    skill_patterns = [{"label": "SKILL", "pattern": skill.strip()} for skill in raw_skills if skill.strip()]
    
    print(f"Successfully loaded {len(skill_patterns)} skills into the AI pipeline.")
    return skill_patterns

# 4. Inject the massive dataset into the pipeline
patterns = load_skills_from_csv("skills.csv")
if patterns:
    ruler.add_patterns(patterns)

def extract_skills(cleaned_text):
    doc = nlp(cleaned_text)
    
    found_skills = set()
    for ent in doc.ents:
        if ent.label_ == "SKILL":
            found_skills.add(ent.text)
            
    return list(found_skills)

# --- Test the Pipeline ---
if __name__ == "__main__":
    file_path = "resumes/sample.pdf"
    
    raw_text = extract_text_from_pdf(file_path)
    cleaned = clean_resume_text(raw_text)
    
    print("\n--- Extracting Skills ---")
    extracted_skills = extract_skills(cleaned)
    
    for skill in extracted_skills:
        print(f"- {skill.title()}")