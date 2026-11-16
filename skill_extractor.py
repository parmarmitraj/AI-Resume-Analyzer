"""
skill_extractor.py — Custom BiLSTM NER Inference Engine
========================================================
Loads the trained custom_ner_bilstm.keras model and vocab.json at FastAPI
startup (via lifespan context) and exposes the extract_skills() function.

Two-Phase Extraction Strategy:
  Phase 1 — Dictionary Matching : high recall via skills.csv + common aliases
  Phase 2 — BiLSTM NER          : catches novel / out-of-vocabulary skills

Design decisions:
  • Case-insensitive vocab lookup with _lower_to_original map (fixes <UNK> flood)
  • Sliding window for sentences > MAX_LEN tokens
  • Confidence threshold (CONF_THRESHOLD) filters weak BiLSTM predictions
  • Stopword post-filter removes verbs / determiners leaked as "skills"
"""

import re
import json
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

# ─────────────────────────────────────────────────────────────────────────────
# 1. Runtime State  (populated by load_model_artifacts() at app startup)
# ─────────────────────────────────────────────────────────────────────────────
_model      = None
_word2idx   = None
_idx2tag    = None
_lower2orig = None   # {lowercase_word: original_cased_word} for vocab lookup
_MAX_LEN    = 20
_PAD_IDX    = 0
_UNK_IDX    = 1

# Minimum softmax confidence to accept a BiLSTM "B-SKILL" prediction.
# Lowered to 0.28 because Dataturks data has noisy labels → model is calibrated lower.
CONF_THRESHOLD = 0.28

# ─────────────────────────────────────────────────────────────────────────────
# 2. Stopwords — tokens that should NEVER be emitted as standalone skills
# ─────────────────────────────────────────────────────────────────────────────
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


# ─────────────────────────────────────────────────────────────────────────────
# 3. Model & Vocab Loader  (called once at FastAPI startup)
# ─────────────────────────────────────────────────────────────────────────────
def load_model_artifacts(
    model_path: str = "custom_ner_bilstm.keras",
    vocab_path: str = "vocab.json"
) -> None:
    """
    Loads the Keras model and vocab dictionary into module-level globals.
    Call this once at application startup — NOT on each request.
    """
    global _model, _word2idx, _idx2tag, _lower2orig, _MAX_LEN, _PAD_IDX, _UNK_IDX

    # ── Load model ────────────────────────────────────────────────────────────
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file '{model_path}' not found.\n"
            "Run 'python train_kaggle.py' first to train and save the model."
        )
    print(f"[NER] Loading model: {model_path}")
    _model = tf.keras.models.load_model(model_path)

    # ── Load vocab ────────────────────────────────────────────────────────────
    if not os.path.exists(vocab_path):
        raise FileNotFoundError(
            f"Vocab file '{vocab_path}' not found.\n"
            "Run 'python train_kaggle.py' to regenerate it."
        )
    print(f"[NER] Loading vocab : {vocab_path}")
    with open(vocab_path, "r", encoding="utf-8") as fh:
        vocab_data = json.load(fh)

    _word2idx = vocab_data["word2idx"]
    tag2idx   = vocab_data["tag2idx"]
    _idx2tag  = {int(v): k for k, v in tag2idx.items()}
    _MAX_LEN  = int(vocab_data.get("max_len", 20))
    _PAD_IDX  = _word2idx.get("<PAD>", 0)
    _UNK_IDX  = _word2idx.get("<UNK>", 1)

    # Build a case-insensitive lookup to avoid unnecessary <UNK> tokens
    _lower2orig = {}
    for word in _word2idx:
        low = word.lower()
        if low not in _lower2orig:
            _lower2orig[low] = word

    meta = vocab_data.get("_meta", {})
    print(
        f"[NER] ✅ Ready  —  vocab={len(_word2idx)}  max_len={_MAX_LEN}  "
        f"val_acc={meta.get('val_acc', 'n/a')}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# 4. Dictionary Knowledge Base  (Phase 1 — high recall)
# ─────────────────────────────────────────────────────────────────────────────
# Loaded lazily on first call to avoid import-time I/O
_dict_initialized = False
_KNOWN_SKILLS_DB: set  = set()
_NORMALIZED_SKILLS: dict = {}   # {normalised_form: canonical_skill}

_COMMON_ALIASES = {
    "node.js", "nodejs", "react", "react.js", "reactjs", "vue", "vue.js",
    "express", "express.js", "next.js", "nextjs", "angular", "angular.js",
    "scikit-learn", "sklearn", "kubernetes", "k8s", "tensorflow", "tf",
    "javascript", "js", "typescript", "ts", "aws", "gcp", "azure",
    "machine learning", "deep learning", "ai", "artificial intelligence",
    "llm", "genai", "docker", "git", "github", "mongodb", "postgresql",
    "mysql", "redis", "firebase", "supabase", "html", "css", "streamlit",
    "python", "java", "c++", "c#", "php", "ruby", "swift", "golang", "rust",
    "ci/cd", "jenkins", "graphql", "apollo", "memcached", "elasticsearch",
    "kafka", "rabbitmq", "react native", "flutter", "fastapi", "django",
    "flask", "pandas", "numpy", "pytorch", "keras", "xgboost", "langchain",
    "langgraph", "rag", "openai", "claude", "gemini", "mern", "mean",
    "lamp", "jamstack", "frontend", "backend", "full stack", "fullstack",
    "devops", "cloud", "api", "rest api", "microservices", "spring boot",
    "hibernate", "maven", "gradle", "junit", "selenium", "postman",
    "jira", "confluence", "linux", "bash", "powershell", "terraform",
    "ansible", "bitbucket", "gitlab", "hugging face", "transformers",
    "bert", "gpt", "stable diffusion", "llama", "mistral",
}


def _init_dict():
    global _dict_initialized, _KNOWN_SKILLS_DB, _NORMALIZED_SKILLS
    if _dict_initialized:
        return
    _KNOWN_SKILLS_DB = set(_COMMON_ALIASES)

    try:
        with open("skills.csv", "r", encoding="utf-8") as fh:
            for line in fh:
                skill = line.strip().split(",")[0].strip('"').lower()
                if len(skill) > 1 and skill not in STOPWORDS:
                    _KNOWN_SKILLS_DB.add(skill)
        print(f"[NER] Dictionary: {len(_KNOWN_SKILLS_DB)} skills loaded from skills.csv")
    except Exception as exc:
        print(f"[NER] Warning: Could not load skills.csv: {exc}")

    # Pre-compute normalised forms (replace non-alnum except +,# with space)
    for skill in _KNOWN_SKILLS_DB:
        norm = re.sub(r"[^\w+#]", " ", skill)
        norm = re.sub(r"\s+", " ", norm).strip()
        if len(norm) > 1 and norm not in STOPWORDS:
            _NORMALIZED_SKILLS[norm] = skill

    _dict_initialized = True


# ─────────────────────────────────────────────────────────────────────────────
# 5. Tokenisation Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _split_into_sentences(text: str) -> list[str]:
    """
    Splits on newlines and sentence-ending periods, but NOT on periods that
    are part of technical terms (Node.js, ASP.NET, 2.5, etc.).
    """
    lines = re.split(r"\n+", text)
    sentences = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Split on period + space + capital (sentence boundary)
        # but NOT on period followed by lowercase or digit (tech term)
        parts = re.split(r"\.(?=\s+[A-Z])", line)
        sentences.extend(p.strip() for p in parts if p.strip())
    return sentences


def _tokenize(sentence: str) -> list[str]:
    """
    Tokenises preserving technical tokens: Node.js, C++, ASP.NET, ci/cd, etc.
    Returns a list of tokens, all stripped of leading/trailing punctuation.
    """
    raw = re.findall(r"[A-Za-z0-9][A-Za-z0-9+#.\-/]*", sentence)
    return [t.rstrip(".-") for t in raw if t.rstrip(".-")]


def _tok_to_idx(token: str) -> int:
    """Case-insensitive vocab lookup with <UNK> fallback."""
    # Try exact match first (preserves casing for tech terms like "MongoDB")
    if token in _word2idx:
        return _word2idx[token]
    # Try lowercase fallback
    orig = _lower2orig.get(token.lower())
    if orig:
        return _word2idx[orig]
    return _UNK_IDX


# ─────────────────────────────────────────────────────────────────────────────
# 6. BiLSTM Inference  (Phase 2 — catch OOV skills)
# ─────────────────────────────────────────────────────────────────────────────
def _run_bilstm(tokens: list[str]) -> list[str]:
    """
    Runs the BiLSTM model over a single token window (len ≤ MAX_LEN).
    Returns a list of extracted skill strings.
    """
    encoded = [_tok_to_idx(t) for t in tokens]
    padded  = pad_sequences([encoded], maxlen=_MAX_LEN, padding="post", value=_PAD_IDX)
    probs   = _model.predict(padded, verbose=0)[0]   # shape: (MAX_LEN, num_tags)
    pred_ids = np.argmax(probs, axis=-1)

    skills, current = [], []
    for i, token in enumerate(tokens[:_MAX_LEN]):
        tag        = _idx2tag.get(pred_ids[i], "O")
        confidence = float(probs[i][pred_ids[i]])

        if tag == "B-SKILL" and confidence >= CONF_THRESHOLD:
            if current:
                skills.append(" ".join(current))
            current = [token]
        elif tag == "I-SKILL" and current and confidence >= CONF_THRESHOLD:
            current.append(token)
        else:
            if current:
                skills.append(" ".join(current))
            current = []

    if current:
        skills.append(" ".join(current))

    return skills


# ─────────────────────────────────────────────────────────────────────────────
# 7. Main Public API
# ─────────────────────────────────────────────────────────────────────────────
def extract_skills(text: str) -> list[str]:
    """
    Extracts skill tokens from free-form resume or job-description text.

    Phase 1: Dictionary matching  (high recall, fast)
    Phase 2: BiLSTM NER           (catches novel / compound skills)

    Args:
        text: Raw text string (from PDF extraction or plain text).

    Returns:
        A deduplicated list of lowercase skill strings.
    """
    _init_dict()

    if _model is None:
        raise RuntimeError(
            "NER model not loaded. Call load_model_artifacts() at app startup."
        )

    all_skills: set[str] = set()

    # ── Phase 1: Dictionary Matching ─────────────────────────────────────────
    text_lower  = text.lower()
    text_padded = " " + re.sub(r"[^\w+#]", " ", text_lower) + " "
    text_padded = re.sub(r"\s+", " ", text_padded)

    for norm_skill, original_skill in _NORMALIZED_SKILLS.items():
        if f" {norm_skill} " in text_padded:
            all_skills.add(original_skill)

    # ── Phase 2: BiLSTM NER ──────────────────────────────────────────────────
    sentences = _split_into_sentences(text)
    stride    = max(1, _MAX_LEN // 2)

    for sentence in sentences:
        tokens = _tokenize(sentence)
        if not tokens:
            continue

        if len(tokens) <= _MAX_LEN:
            windows = [tokens]
        else:
            windows = [tokens[i: i + _MAX_LEN] for i in range(0, len(tokens), stride)]

        for window in windows:
            if not window:
                continue
            for skill in _run_bilstm(window):
                cleaned = skill.strip()
                if cleaned and cleaned.lower() not in STOPWORDS and len(cleaned) > 1:
                    all_skills.add(cleaned)

    return list(all_skills)
