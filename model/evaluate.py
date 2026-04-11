"""
Model Evaluation Script.

Loads the best checkpoint and computes detailed per-category metrics
on the test set: F1, Precision, Recall, and Hamming Loss.
"""

import os
import sys
import json
import numpy as np

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from sklearn.metrics import (
    f1_score, precision_score, recall_score,
    hamming_loss, classification_report,
    multilabel_confusion_matrix,
)
from torch.utils.data import DataLoader

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from model.config import (
    NUM_LABELS, BEST_MODEL_DIR, TEST_DATA_PATH,
    MAX_SEQ_LENGTH, BATCH_SIZE, DEFAULT_THRESHOLD,
    EVAL_RESULTS_PATH, DEVICE,
)
from data.dataset_loader import DarkPatternDataset
from data.label_mapping import CATEGORIES


def evaluate():
    """Run full evaluation on the test set."""
    print("=" * 60)
    print("Dark Pattern Detection — Model Evaluation")
    print(f"Device: {DEVICE}")
    print("=" * 60)

    # Load model and tokenizer
    if not os.path.exists(BEST_MODEL_DIR):
        print(f"✗ Model checkpoint not found at {BEST_MODEL_DIR}")
        print("  → Run train.py first!")
        return

    print(f"\n→ Loading model from {BEST_MODEL_DIR}")
    tokenizer = AutoTokenizer.from_pretrained(BEST_MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(BEST_MODEL_DIR)
    model.to(DEVICE)
    model.eval()
    print(f"  ✓ Model loaded")

    # Load test data
    print(f"\n→ Loading test data...")
    test_dataset = DarkPatternDataset(
        csv_path=TEST_DATA_PATH,
        max_length=MAX_SEQ_LENGTH,
        tokenizer=tokenizer,
    )
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    print(f"  ✓ {len(test_dataset)} test samples")

    # Run inference
    print(f"\n→ Running inference...")
    all_preds = []
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for batch in test_loader:
            input_ids = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)
            labels = batch["labels"]

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits.cpu().numpy()
            probs = 1 / (1 + np.exp(-logits))
            preds = (probs >= DEFAULT_THRESHOLD).astype(int)

            all_probs.extend(probs.tolist())
            all_preds.extend(preds.tolist())
            all_labels.extend(labels.numpy().astype(int).tolist())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    all_probs = np.array(all_probs)

    # ─── Compute Metrics ──────────────────────────────────────────────
    print(f"\n{'═' * 60}")
    print("  EVALUATION RESULTS")
    print(f"{'═' * 60}")

    # Overall metrics
    f1_micro = f1_score(all_labels, all_preds, average="micro", zero_division=0)
    f1_macro = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    f1_weighted = f1_score(all_labels, all_preds, average="weighted", zero_division=0)
    precision_macro = precision_score(all_labels, all_preds, average="macro", zero_division=0)
    recall_macro = recall_score(all_labels, all_preds, average="macro", zero_division=0)
    h_loss = hamming_loss(all_labels, all_preds)

    print(f"\n  Overall Metrics:")
    print(f"  {'─' * 42}")
    print(f"  {'F1 (Micro)':<30s} {f1_micro:.4f}")
    print(f"  {'F1 (Macro)':<30s} {f1_macro:.4f}")
    print(f"  {'F1 (Weighted)':<30s} {f1_weighted:.4f}")
    print(f"  {'Precision (Macro)':<30s} {precision_macro:.4f}")
    print(f"  {'Recall (Macro)':<30s} {recall_macro:.4f}")
    print(f"  {'Hamming Loss':<30s} {h_loss:.4f}")

    # Per-category metrics
    per_f1 = f1_score(all_labels, all_preds, average=None, zero_division=0)
    per_precision = precision_score(all_labels, all_preds, average=None, zero_division=0)
    per_recall = recall_score(all_labels, all_preds, average=None, zero_division=0)

    print(f"\n  Per-Category Metrics:")
    print(f"  {'─' * 65}")
    print(f"  {'Category':<25s} {'Precision':>10s} {'Recall':>10s} {'F1':>10s} {'Support':>10s}")
    print(f"  {'─' * 65}")

    per_category_results = {}
    for i, cat in enumerate(CATEGORIES):
        support = int(all_labels[:, i].sum()) if i < all_labels.shape[1] else 0
        p = per_precision[i] if i < len(per_precision) else 0
        r = per_recall[i] if i < len(per_recall) else 0
        f = per_f1[i] if i < len(per_f1) else 0
        print(f"  {cat:<25s} {p:>10.4f} {r:>10.4f} {f:>10.4f} {support:>10d}")
        per_category_results[cat] = {
            "precision": round(float(p), 4),
            "recall": round(float(r), 4),
            "f1": round(float(f), 4),
            "support": support,
        }

    # Confusion matrix per category
    print(f"\n  Confusion Matrices (per category):")
    print(f"  {'─' * 50}")
    mcm = multilabel_confusion_matrix(all_labels, all_preds)
    for i, cat in enumerate(CATEGORIES):
        if i < len(mcm):
            tn, fp, fn, tp = mcm[i].ravel()
            print(f"  {cat}:")
            print(f"    TP={tp:4d}  FP={fp:4d}  FN={fn:4d}  TN={tn:4d}")

    # ─── Save Results ─────────────────────────────────────────────────
    results = {
        "overall": {
            "f1_micro": round(f1_micro, 4),
            "f1_macro": round(f1_macro, 4),
            "f1_weighted": round(f1_weighted, 4),
            "precision_macro": round(precision_macro, 4),
            "recall_macro": round(recall_macro, 4),
            "hamming_loss": round(h_loss, 4),
        },
        "per_category": per_category_results,
        "threshold": DEFAULT_THRESHOLD,
        "num_test_samples": len(all_labels),
    }

    with open(EVAL_RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n  ✓ Results saved → {EVAL_RESULTS_PATH}")

    print(f"\n{'═' * 60}")
    print("✓ Evaluation complete!")
    print(f"{'═' * 60}")

    return results


if __name__ == "__main__":
    evaluate()
