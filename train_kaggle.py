import json
import re
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, Bidirectional, LSTM, TimeDistributed, Dense
from tensorflow.keras.preprocessing.sequence import pad_sequences

# 1. The Kaggle Data Parser
def load_kaggle_data(filepath="resume_dataset.json", max_len=20):
    sentences = []
    tags = []
    
    print(f"Parsing Kaggle dataset: {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line.strip())
                text = data.get('content', '')
                annotations = data.get('annotation', [])
                
                # Extract the exact character spans for "Skills"
                skill_spans = []
                for ann in annotations:
                    if 'label' in ann and 'Skills' in ann['label']:
                        points = ann['points'][0]
                        # Dataturks format uses character start/end
                        skill_spans.append((points['start'], points['end']))
                
                tokens = []
                token_tags = []
                
                # Tokenize the resume and check if words fall inside a skill span
                for match in re.finditer(r'[A-Za-z0-9+#.\-]+', text):
                    token = match.group()
                    t_start, t_end = match.start(), match.end()
                    
                    tag = "O"
                    for s_start, s_end in skill_spans:
                        # If the token overlaps with the annotated skill span
                        if t_start >= s_start and t_end <= (s_end + 1):
                            if t_start == s_start or tag == "O":
                                tag = "B-SKILL"
                            else:
                                tag = "I-SKILL"
                            break
                    
                    tokens.append(token)
                    token_tags.append(tag)
                
                # Resumes are long. We chop them into 20-word sentences for the BiLSTM
                for i in range(0, len(tokens), max_len):
                    sentences.append(tokens[i:i+max_len])
                    tags.append(token_tags[i:i+max_len])
                    
    except Exception as e:
        print(f"Error reading data: Make sure the file is named correctly and is in JSON Lines format. Error: {e}")
        return [], []
        
    print(f"Successfully processed {len(sentences)} sentence chunks.")
    return sentences, tags

# 2. Load and Prepare the Data
MAX_LEN = 20
sentences, tags = load_kaggle_data("resume_dataset.json", max_len=MAX_LEN)

if not sentences:
    exit()

# Build Vocabularies
word2idx = {"<PAD>": 0, "<UNK>": 1}
tag2idx = {"<PAD>": 0, "O": 1, "B-SKILL": 2, "I-SKILL": 3}

for sentence in sentences:
    for word in sentence:
        if word not in word2idx:
            word2idx[word] = len(word2idx)

X = [[word2idx.get(w, 1) for w in s] for s in sentences]
y = [[tag2idx[t] for t in tg] for tg in tags]

# Pad Sequences
X_padded = pad_sequences(X, maxlen=MAX_LEN, padding="post", value=word2idx["<PAD>"])
y_padded = pad_sequences(y, maxlen=MAX_LEN, padding="post", value=tag2idx["<PAD>"])

# 3. Scaled Neural Network Architecture
vocab_size = len(word2idx)
num_tags = len(tag2idx)

print(f"Vocabulary Size: {vocab_size} unique words.")

# We increase the Embedding and LSTM dimensions because we have significantly more data
model = Sequential([
    Embedding(input_dim=vocab_size, output_dim=64, input_length=MAX_LEN, mask_zero=True),
    Bidirectional(LSTM(units=64, return_sequences=True)),
    TimeDistributed(Dense(num_tags, activation="softmax"))
])

model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

# 4. Train the Model
# We only need 30 epochs for a large dataset to avoid overfitting
print("\n--- Training Production BiLSTM ---")
model.fit(X_padded, y_padded, batch_size=32, epochs=30, validation_split=0.1)

# 5. Save the Production Artifacts
model.save("custom_ner_bilstm.keras")
with open("vocab.json", "w") as f:
    json.dump({"word2idx": word2idx, "tag2idx": tag2idx, "max_len": MAX_LEN}, f)

print("\nProduction Artifacts saved! Your skill_extractor.py will now use this massive dataset.")