import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, Bidirectional, LSTM, TimeDistributed, Dense
from tensorflow.keras.preprocessing.sequence import pad_sequences

# 1. Expanded Training Sentences & BIO Tags
sentences = [
    ["Developed", "a", "backend", "using", "Node.js", "and", "MongoDB"],
    ["Built", "interfaces", "with", "React"],
    ["Experience", "with", "Python", "and", "FastAPI"],
    ["Implemented", "REST", "APIs", "using", "Express.js"],
    ["Created", "fullstack", "apps", "with", "React", "and", "MongoDB"],
    ["Built", "backend", "services", "with", "MongoDB", "database"],
    ["Skilled", "in", "Python", "and", "machine", "learning"],
    ["Strong", "foundation", "in", "Java", "and", "SQL"]
]

tags = [
    ["O", "O", "O", "O", "B-SKILL", "O", "B-SKILL"],
    ["O", "O", "O", "B-SKILL"],
    ["O", "O", "B-SKILL", "O", "B-SKILL"],
    ["O", "B-SKILL", "I-SKILL", "O", "B-SKILL"],
    ["O", "O", "O", "O", "B-SKILL", "O", "B-SKILL"],
    ["O", "O", "O", "O", "B-SKILL", "O"],
    ["O", "O", "B-SKILL", "O", "B-SKILL", "I-SKILL"],
    ["O", "O", "O", "B-SKILL", "O", "B-SKILL"]
]

# 2. Vocabulary Mappings
word2idx = {"<PAD>": 0, "<UNK>": 1}
tag2idx = {"<PAD>": 0, "O": 1, "B-SKILL": 2, "I-SKILL": 3}

for sentence in sentences:
    for word in sentence:
        if word not in word2idx:
            word2idx[word] = len(word2idx)

idx2tag = {idx: tag for tag, idx in tag2idx.items()}

# 3. Integer Encoding & Padding
MAX_LEN = 12
X = [[word2idx.get(w, 1) for w in s] for s in sentences]
y = [[tag2idx[t] for t in tg] for tg in tags]

X_padded = pad_sequences(X, maxlen=MAX_LEN, padding="post", value=word2idx["<PAD>"])
y_padded = pad_sequences(y, maxlen=MAX_LEN, padding="post", value=tag2idx["<PAD>"])

# 4. Neural Network Architecture
vocab_size = len(word2idx)
num_tags = len(tag2idx)

model = Sequential([
    Embedding(input_dim=vocab_size, output_dim=16, input_length=MAX_LEN, mask_zero=True),
    Bidirectional(LSTM(units=32, return_sequences=True)),
    TimeDistributed(Dense(num_tags, activation="softmax"))
])

model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

# 5. Train Model (120 epochs to ensure convergence)
print("--- Training BiLSTM on Expanded Patterns ---")
model.fit(X_padded, y_padded, epochs=120, verbose=0)
final_loss, final_acc = model.evaluate(X_padded, y_padded, verbose=0)
print(f"Training Complete -> Loss: {final_loss:.4f} | Accuracy: {final_acc:.4f}")

# 6. Inference Function
def extract_skills_with_bilstm(sentence_tokens, trained_model, word_map, tag_map, max_len=12):
    encoded = [word_map.get(token, word_map["<UNK>"]) for token in sentence_tokens]
    padded = pad_sequences([encoded], maxlen=max_len, padding="post", value=word_map["<PAD>"])
    
    probabilities = trained_model.predict(padded, verbose=0)[0]
    predicted_tag_indices = np.argmax(probabilities, axis=-1)
    
    extracted_skills = []
    current_skill = []

    for i, token in enumerate(sentence_tokens[:max_len]):
        tag = tag_map.get(predicted_tag_indices[i], "O")
        if tag == "B-SKILL":
            if current_skill:
                extracted_skills.append(" ".join(current_skill))
            current_skill = [token]
        elif tag == "I-SKILL" and current_skill:
            current_skill.append(token)
        else:
            if current_skill:
                extracted_skills.append(" ".join(current_skill))
                current_skill = []

    if current_skill:
        extracted_skills.append(" ".join(current_skill))

    return extracted_skills

# 7. Test Predictions
test_sentence = ["Built", "backend", "with", "MongoDB"]
detected = extract_skills_with_bilstm(test_sentence, model, word2idx, idx2tag, max_len=MAX_LEN)

print("\n--- Running Test Prediction ---")
print(f"Input Sentence:   {' '.join(test_sentence)}")
print(f"Extracted Skills: {detected}")

# 8. Save Artifacts
model.save("custom_ner_bilstm.keras")
with open("vocab.json", "w") as f:
    json.dump({"word2idx": word2idx, "tag2idx": tag2idx}, f)
print("\nArtifacts saved: 'custom_ner_bilstm.keras' and 'vocab.json'")