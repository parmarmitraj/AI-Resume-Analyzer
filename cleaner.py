"""
cleaner.py — Resume Text Cleaner (spaCy-Free)
==============================================
Replaces the original spaCy-based cleaner with a pure-regex implementation.
Keeps the same public API: clean_resume_text(raw_text) → str

Changes vs. original:
  ✗  Removed: spacy.load("en_core_web_sm")  (was crashing if model not installed)
  ✓  Added  : regex-based tokenisation + stopword filtering + basic lemmatisation
  ✓  Result : zero additional dependencies; faster startup; same quality for TF-IDF
"""

import re

# ─────────────────────────────────────────────────────────────────────────────
# Stopword list — mirrors spaCy's en_core_web_sm common stopwords
# (extended with resume-specific filler words)
# ─────────────────────────────────────────────────────────────────────────────
_STOPWORDS = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you",
    "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself",
    "she", "her", "hers", "herself", "it", "its", "itself", "they", "them",
    "their", "theirs", "themselves", "what", "which", "who", "whom", "this",
    "that", "these", "those", "am", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "having", "do", "does", "did", "doing",
    "a", "an", "the", "and", "but", "if", "or", "because", "as", "until",
    "while", "of", "at", "by", "for", "with", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below", "to",
    "from", "up", "down", "in", "out", "on", "off", "over", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why", "how",
    "all", "both", "each", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "s", "t", "can", "will", "just", "don", "should", "now", "d", "ll", "m",
    "o", "re", "ve", "y", "ain", "aren", "couldn", "didn", "doesn", "hadn",
    "hasn", "haven", "isn", "ma", "mightn", "mustn", "needn", "shan", "shouldn",
    "wasn", "weren", "won", "wouldn",
    # Resume-specific filler
    "experience", "experienced", "work", "working", "worked", "knowledge",
    "understanding", "familiarity", "familiar", "ability", "abilities",
    "skill", "skills", "proficient", "proficiency", "good", "great",
    "strong", "excellent", "basic", "advanced", "expert", "senior", "junior",
    "responsible", "responsibilities", "role", "position", "job", "title",
    "include", "including", "also", "etc", "various", "multiple", "many",
    "year", "years", "month", "months", "project", "projects", "team", "teams",
    "company", "organization", "environment", "domain", "area", "field",
    "using", "used", "use", "utilized", "utilize", "implement", "implemented",
    "implementing", "develop", "developed", "developing", "build", "built",
    "building", "create", "created", "creating", "design", "designed",
    "manage", "managed", "managing", "support", "supported", "maintain",
    "maintained", "maintaining", "provide", "provided", "ensuring", "ensure",
}

# ─────────────────────────────────────────────────────────────────────────────
# Minimal suffix-stripping lemmatiser (handles -ing, -ed, -tion, -ment, -er, -s)
# Not as accurate as spaCy but good enough for TF-IDF vocabulary matching.
# ─────────────────────────────────────────────────────────────────────────────
_LEMMA_SUFFIXES = [
    ("ization", "ize"), ("isation", "ise"), ("ations", "ate"), ("ation", "ate"),
    ("ments", "ment"), ("ment", ""),  ("nesses", ""), ("ness", ""),
    ("ities", ""), ("ity", ""),
    ("ings", ""), ("ing", ""),
    ("tions", ""), ("tion", ""),
    ("ives", "ive"), ("ive", ""),
    ("ees", ""), ("ers", ""),
    ("ied", "y"), ("ed", ""),
    ("es", ""), ("s", ""),
]

_MIN_STEM_LEN = 4   # Only strip suffix if the remaining stem is ≥ this length


def _lemmatize(word: str) -> str:
    """Very lightweight suffix-stripping lemmatisation."""
    for suffix, replacement in _LEMMA_SUFFIXES:
        if word.endswith(suffix):
            stem = word[: len(word) - len(suffix)] + replacement
            if len(stem) >= _MIN_STEM_LEN:
                return stem
    return word


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────
def clean_resume_text(raw_text: str) -> str:
    """
    Cleans resume text for TF-IDF vectorisation.

    Pipeline:
      1. Collapse all whitespace → single space
      2. Tokenise on word boundaries (letters + apostrophes)
      3. Lowercase
      4. Filter stopwords and tokens shorter than 2 chars
      5. Apply lightweight lemmatisation
      6. Re-join with spaces

    Args:
        raw_text: Raw text extracted from a PDF or string.

    Returns:
        A clean, lowercase, lemmatised string ready for TF-IDF.
    """
    # Step 1: Normalise whitespace
    text = re.sub(r"\s+", " ", raw_text).strip()

    # Step 2: Tokenise — keep only letter/digit tokens (ignore punctuation tokens)
    tokens = re.findall(r"[A-Za-z]{2,}", text)

    cleaned = []
    for tok in tokens:
        low = tok.lower()
        # Step 3–4: Skip stopwords and very short tokens
        if low in _STOPWORDS or len(low) < 2:
            continue
        # Step 5: Lemmatise
        lemma = _lemmatize(low)
        if lemma and len(lemma) >= 2 and lemma not in _STOPWORDS:
            cleaned.append(lemma)

    # Step 6: Rejoin
    return " ".join(cleaned)


# ─────────────────────────────────────────────────────────────────────────────
# Standalone test
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = (
        "Developed a backend using Node.js and MongoDB. "
        "Responsible for implementing RESTful APIs with Express.js. "
        "Strong knowledge of Python, TensorFlow, and machine learning algorithms. "
        "Experienced in building CI/CD pipelines using Docker and Kubernetes."
    )
    result = clean_resume_text(sample)
    print("Input  :", sample)
    print("Output :", result)
    print(f"\nCompression: {len(sample)} → {len(result)} chars")
