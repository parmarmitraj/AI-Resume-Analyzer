import re
import spacy
from extractor import extract_text_from_pdf

# Load the core English NLP model we downloaded earlier
print("Loading spaCy NLP model...")
nlp = spacy.load("en_core_web_sm")

def clean_resume_text(raw_text):
    # 1. Regex Cleaning: Replace multiple spaces, tabs, or newlines with a single space
    # \s+ matches any whitespace character sequence
    text = re.sub(r'\s+', ' ', raw_text)
    
    # 2. Pass the text through the spaCy pipeline
    # This automatically tokenizes, tags, and parses the entire string
    doc = nlp(text)
    
    cleaned_tokens = []
    for token in doc:
        # 3. Filter out stop words and generic punctuation
        # We check boolean flags automatically assigned by spaCy
        if not token.is_stop and not token.is_punct:
            # 4. Append the lemmatized (root) version of the word in lowercase
            cleaned_tokens.append(token.lemma_.lower())
            
    # 5. Rejoin the tokens into a single clean string
    return " ".join(cleaned_tokens)

# --- Test the Pipeline ---
if __name__ == "__main__":
    file_path = "resumes/sample.pdf"
    
    # Step 1: Extract
    raw_text = extract_text_from_pdf(file_path)
    
    # Step 2: Clean
    cleaned_text = clean_resume_text(raw_text)
    
    print("\n--- Cleaned Text ---\n")
    print(cleaned_text)
    
    # Compare the character lengths to see how much noise was removed
    print(f"\nOriginal Length: {len(raw_text)} characters")
    print(f"Cleaned Length: {len(cleaned_text)} characters")