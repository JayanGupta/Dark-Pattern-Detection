import os
import sys
import json
import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from sklearn.metrics import f1_score, hamming_loss
from torch.utils.data import DataLoader

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from model.config import BEST_MODEL_DIR, TEST_DATA_PATH, MAX_SEQ_LENGTH, BATCH_SIZE, DEFAULT_THRESHOLD, EVAL_RESULTS_PATH, DEVICE
from data.dataset_loader import DarkPatternDataset

def evaluate():
    if not os.path.exists(BEST_MODEL_DIR):
        print(f"Model not found at {BEST_MODEL_DIR}")
        return

    tokenizer = AutoTokenizer.from_pretrained(BEST_MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(BEST_MODEL_DIR).to(DEVICE)
    model.eval()

    test_dataset = DarkPatternDataset(TEST_DATA_PATH, MAX_SEQ_LENGTH, tokenizer)
    loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)

    preds, labels = [], []
    with torch.no_grad():
        for batch in loader:
            output = model(batch["input_ids"].to(DEVICE), batch["attention_mask"].to(DEVICE))
            probs = torch.sigmoid(output.logits).cpu().numpy()
            preds.extend((probs >= DEFAULT_THRESHOLD).astype(int))
            labels.extend(batch["labels"].numpy().astype(int))

    preds, labels = np.array(preds), np.array(labels)
    
    results = {
        "f1_micro": round(f1_score(labels, preds, average="micro", zero_division=0), 4),
        "f1_macro": round(f1_score(labels, preds, average="macro", zero_division=0), 4),
        "hamming_loss": round(hamming_loss(labels, preds), 4)
    }

    with open(EVAL_RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)
    
    print("Evaluation Results:", results)

if __name__ == "__main__":
    evaluate()
