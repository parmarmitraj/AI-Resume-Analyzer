import json
import re
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Suppress minor TensorFlow warnings
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# ──────────────────────────────────────────────────────────────────────
# 1. Load Production Artifacts
# ──────────────────────────────────────────────────────────────────────
print("Loading Custom TensorFlow BiLSTM Model...")
model = tf.keras.models.load_model("custom_ner_bilstm.keras")

with open("vocab.json", "r") as f:
    vocab_data = json.load(f)

word2idx = vocab_data["word2idx"]
tag2idx = vocab_data["tag2idx"]
idx2tag = {int(idx): tag for tag, idx in tag2idx.items()}

# FIX (Bug #1): MAX_LEN must match what train_kaggle.py used during training.
# The training script uses max_len=20, so inference MUST also use 20.
# Read from vocab metadata if present, otherwise default to the training value.
MAX_LEN = vocab_data.get("max_len", 20)

# Build a lowercase-to-original mapping for case-aware lookup.
# This lets us find "Python" in the vocab even if we receive "python".
_lower_to_original = {}
for word in word2idx:
    low = word.lower()
    # Prefer the version with higher index (more likely a real word, not a fragment)
    # But really, any match is better than <UNK>
    if low not in _lower_to_original:
        _lower_to_original[low] = word

PAD_IDX = word2idx.get("<PAD>", 0)
UNK_IDX = word2idx.get("<UNK>", 1)

# ──────────────────────────────────────────────────────────────────────
# 2. Configuration
# ──────────────────────────────────────────────────────────────────────

# Common structural English words that should never be standalone skills.
STOPWORDS = {
    "using", "used", "use", "developed", "built", "implemented", "created",
    "deployed", "services", "interfaces", "with", "and", "a", "an", "the",
    "in", "on", "for", "to", "of", "by", "at", "or", "is", "are", "was",
    "were", "be", "been", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "shall", "can",
    "this", "that", "these", "those", "it", "its", "my", "our", "your",
    "their", "his", "her", "i", "me", "we", "they", "he", "she",
    "also", "etc", "experience", "working", "knowledge", "understanding",
    "ability", "work", "project", "team", "year", "years", "including",
    "strong", "good", "basic", "building", "based", "design", "develop",
    "responsible", "application", "applications", "system", "systems",
    "development", "management", "tool", "tools", "technology", "technologies",
    "testing", "test", "data", "process", "processes", "solution", "solutions",
}

# FIX (Bug #4): Lowered threshold from 0.40 to 0.30.
# Kaggle datasets are noisy; the model is less confident but still correct.
CONFIDENCE_THRESHOLD = 0.30

# ──────────────────────────────────────────────────────────────────────
# 3. Tokenization (preserves technical terms)
# ──────────────────────────────────────────────────────────────────────

def clean_and_tokenize(sentence):
    """
    Splits text while preserving compound technical terms like Node.js, C++, C#.
    Uses the SAME regex pattern as train_kaggle.py for consistency.
    """
    # This regex must exactly match train_kaggle.py line 34:
    #   re.finditer(r'[A-Za-z0-9+#.\-]+', text)
    raw_tokens = re.findall(r'[A-Za-z0-9+#.\-]+', sentence)
    
    cleaned = []
    for t in raw_tokens:
        # Check if this is a compound term (contains . or - between alphanumerics)
        has_dot_suffix = bool(re.search(r'\.[a-zA-Z]{1,4}$', t)) and not t.endswith('..')
        has_internal_sep = bool(re.search(r'[a-zA-Z0-9][.\-][a-zA-Z]', t))
        
        if has_dot_suffix or has_internal_sep:
            # Compound term (Node.js, React.js, scikit-learn, ASP.NET)
            # Check if the compound form is in the vocabulary as-is
            if t in word2idx or t.lower() in _lower_to_original:
                cleaned.append(t)
            else:
                # Compound form not in vocab — split into sub-tokens
                # e.g., "Node.js" → ["Node", "js"], "scikit-learn" → ["scikit", "learn"]
                sub_tokens = [s for s in re.split(r'[.\-]', t) if s]
                cleaned.extend(sub_tokens)
        else:
            stripped = t.rstrip('.-')
            if stripped:
                cleaned.append(stripped)
    return cleaned


def _resolve_token(token):
    """
    FIX (Bug #2): Case-aware vocabulary lookup with fallback chain.
    Try: exact match → lowercase match via reverse map → title case → upper → <UNK>
    """
    # 1. Exact match (best case: vocab has this exact token)
    if token in word2idx:
        return word2idx[token]
    
    # 2. Lowercase reverse lookup (e.g., input is "python", vocab has "Python")
    original = _lower_to_original.get(token.lower())
    if original is not None:
        return word2idx[original]
    
    # 3. Title case (e.g., input is "PYTHON", try "Python")
    if token.title() in word2idx:
        return word2idx[token.title()]
    
    # 4. Uppercase (e.g., input is "html", try "HTML")
    if token.upper() in word2idx:
        return word2idx[token.upper()]
    
    # 5. Lowercase directly
    if token.lower() in word2idx:
        return word2idx[token.lower()]
    
    return UNK_IDX


# ──────────────────────────────────────────────────────────────────────
# 4. Core Extraction Engine
# ──────────────────────────────────────────────────────────────────────

def extract_skills_from_tokens(tokens):
    """
    Runs a batch of tokens through the BiLSTM and extracts skill spans
    using BIO tags with confidence filtering.
    """
    if not tokens:
        return []
    
    # Encode tokens with case-aware lookup
    encoded = [_resolve_token(t) for t in tokens]
    padded = pad_sequences([encoded], maxlen=MAX_LEN, padding="post", value=PAD_IDX)
    
    probabilities = model.predict(padded, verbose=0)[0]
    predicted_indices = np.argmax(probabilities, axis=-1)
    
    extracted = []
    current_skill = []
    
    for i, token in enumerate(tokens[:MAX_LEN]):
        predicted_idx = predicted_indices[i]
        tag = idx2tag.get(predicted_idx, "O")
        confidence = float(probabilities[i][predicted_idx])
        
        # Ignore tokens if it's a structural stopword (regardless of model prediction)
        if token.lower() in STOPWORDS:
            if current_skill:
                extracted.append(" ".join(current_skill))
                current_skill = []
            continue
        
        if tag == "B-SKILL" and confidence > CONFIDENCE_THRESHOLD:
            # Start of a new skill — flush any previous skill
            if current_skill:
                extracted.append(" ".join(current_skill))
            current_skill = [token]
        elif tag == "I-SKILL" and current_skill:
            # Continuation of current skill — trust the sequence
            current_skill.append(token)
        else:
            # O tag or B-SKILL below threshold — flush
            if current_skill:
                extracted.append(" ".join(current_skill))
                current_skill = []
    
    # Flush any remaining skill
    if current_skill:
        extracted.append(" ".join(current_skill))
    
    return extracted


import csv

# ──────────────────────────────────────────────────────────────────────
# 2.5 Hybrid Dictionary-Based Extraction setup
# ──────────────────────────────────────────────────────────────────────
KNOWN_SKILLS_DB = set()
try:
    with open("skills.csv", "r", encoding="utf-8") as f:
        # Some CSVs have headers or multiple columns, we just take the first column
        for line in f:
            skill = line.strip().split(",")[0].strip('"').lower()
            if len(skill) > 1 and skill not in STOPWORDS:
                KNOWN_SKILLS_DB.add(skill)
except Exception as e:
    print(f"Warning: Could not load skills.csv: {e}")

# Ensure critical modern skills and aliases are in the DB
COMMON_ALIASES = {
    "node.js", "nodejs", "react", "react.js", "reactjs", "vue", "vue.js", "express", "express.js",
    "next.js", "nextjs", "angular", "angular.js", "scikit-learn", "sklearn", "kubernetes", "k8s",
    "tensorflow", "tf", "javascript", "js", "typescript", "ts", "aws", "gcp", "azure",
    "machine learning", "deep learning", "ai", "artificial intelligence", "llm", "genai",
    "docker", "git", "github", "mongodb", "postgresql", "mysql", "redis", "firebase", "supabase",
    "html", "css", "streamlit", "python", "java", "c++", "c#", "php", "ruby", "swift", "golang", "rust",
    "ci/cd", "jenkins", "graphql", "apollo", "memcached", "elasticsearch", "kafka",
    "rabbitmq", "react native", "flutter", "fastapi", "django", "flask", "pandas", "numpy", "pytorch",
    "keras", "xgboost", "langchain", "langgraph", "rag", "openai", "claude", "gemini",
    "mern", "mean", "lamp", "jamstack", "frontend", "backend", "full stack", "fullstack",
    "devops", "cloud", "api", "rest api", "microservices"
}
KNOWN_SKILLS_DB.update(COMMON_ALIASES)

# Pre-compute normalized skills for fast matching (avoids punctuation boundary issues)
NORMALIZED_SKILLS = {}
for skill in KNOWN_SKILLS_DB:
    # Replace non-alphanumerics (except +, #) with space, then strip multiple spaces
    norm = re.sub(r'[^\w+#]', ' ', skill)
    norm = re.sub(r'\s+', ' ', norm).strip()
    if len(norm) > 1 and norm not in STOPWORDS:
        NORMALIZED_SKILLS[norm] = skill

def _split_into_sentences(text):
    """
    Smart sentence splitting that doesn't destroy technical terms.
    
    Splits on newlines and sentence-ending periods, but NOT on periods that are
    part of technical terms like Node.js, React.js, ASP.NET, etc.
    """
    # First, split on newlines (safe — never inside a technical term)
    lines = re.split(r'\n+', text)
    
    sentences = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Split on periods that are followed by a space and uppercase letter (sentence boundary)
        # but NOT on patterns like ".js", ".NET", ".py" (technical suffixes)
        parts = re.split(r'\.(?=\s+[A-Z])', line)
        for part in parts:
            part = part.strip()
            if part:
                sentences.append(part)
    
    return sentences

def extract_skills(text):
    """
    Main entry point: Two-Phase Extraction.
    Phase 1: High-recall Dictionary matching using skills.csv and common aliases.
    Phase 2: Custom BiLSTM NER to catch novel or out-of-vocabulary skills.
    """
    all_skills = set()
    
    # ── Phase 1: Dictionary Matching ──
    text_lower = text.lower()
    # Normalize text the exact same way as skills
    text_padded = " " + re.sub(r'[^\w+#]', ' ', text_lower) + " "
    # Collapse multiple spaces
    text_padded = re.sub(r'\s+', ' ', text_padded)
    
    for norm_skill, original_skill in NORMALIZED_SKILLS.items():
        if f" {norm_skill} " in text_padded:
            all_skills.add(original_skill)

    # ── Phase 2: BiLSTM Custom NER ──
    sentences = _split_into_sentences(text)
    
    for sentence in sentences:
        tokens = clean_and_tokenize(sentence)
        
        if not tokens:
            continue
        
        # Use a sliding window for sentences longer than MAX_LEN.
        stride = max(1, MAX_LEN // 2)
        
        if len(tokens) <= MAX_LEN:
            skills = extract_skills_from_tokens(tokens)
            for s in skills:
                cleaned = s.strip()
                if cleaned and cleaned.lower() not in STOPWORDS and len(cleaned) > 1:
                    all_skills.add(cleaned)
        else:
            for start in range(0, len(tokens), stride):
                window = tokens[start:start + MAX_LEN]
                if not window:
                    break
                skills = extract_skills_from_tokens(window)
                for s in skills:
                    cleaned = s.strip()
                    if cleaned and cleaned.lower() not in STOPWORDS and len(cleaned) > 1:
                        all_skills.add(cleaned)
    
    return list(all_skills)


# ──────────────────────────────────────────────────────────────────────
# 6. Verification Block
# ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample_text = (
        "Developed a backend using Node.js and MongoDB. "
        "Built interfaces with React and deployed backend services. "
        "Proficient in Python, Java, C++, and JavaScript. "
        "Experience with Machine Learning, TensorFlow, and scikit-learn. "
        "Knowledge of HTML, CSS, and Flask for web development. "
        "Also used GraphQL and Docker in CI/CD pipeline."
    )
    print("\nSample Input Text:")
    print(sample_text)
    
    extracted = extract_skills(sample_text)
    print(f"\nHybrid Extractor Output ({len(extracted)} skills):")
    for skill in sorted(extracted):
        print(f"  → {skill}")