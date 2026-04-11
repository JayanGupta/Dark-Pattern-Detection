"""
Model Training Script.

Fine-tunes DistilBERT for multi-label dark pattern classification
using HuggingFace Trainer API.
"""

import os
import sys
import json
import numpy as np

import torch
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    EarlyStoppingCallback,
)
from sklearn.metrics import f1_score, precision_score, recall_score

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from model.config import (
    MODEL_NAME, NUM_LABELS, PROBLEM_TYPE,
    MAX_SEQ_LENGTH, BATCH_SIZE, LEARNING_RATE, NUM_EPOCHS,
    WARMUP_RATIO, WEIGHT_DECAY, GRADIENT_ACCUMULATION_STEPS,
    SEED, DEFAULT_THRESHOLD, CHECKPOINT_DIR, BEST_MODEL_DIR,
    TRAIN_DATA_PATH, TRAIN_DATA_FALLBACK, TEST_DATA_PATH,
    DEVICE, FP16, LOGGING_STEPS, SAVE_STEPS, EVAL_STEPS,
    SAVE_TOTAL_LIMIT, LOAD_BEST_MODEL_AT_END, METRIC_FOR_BEST_MODEL,
)
from data.dataset_loader import DarkPatternDataset
from data.label_mapping import CATEGORIES


# ─── Metrics ──────────────────────────────────────────────────────────

def compute_metrics(eval_pred):
    """Compute multi-label classification metrics."""
    logits, labels = eval_pred
    # Apply sigmoid to convert logits to probabilities
    probs = 1 / (1 + np.exp(-logits))
    # Threshold to binary predictions
    preds = (probs >= DEFAULT_THRESHOLD).astype(int)

    # Compute metrics
    f1_micro = f1_score(labels, preds, average="micro", zero_division=0)
    f1_macro = f1_score(labels, preds, average="macro", zero_division=0)
    f1_weighted = f1_score(labels, preds, average="weighted", zero_division=0)
    precision_macro = precision_score(labels, preds, average="macro", zero_division=0)
    recall_macro = recall_score(labels, preds, average="macro", zero_division=0)

    # Per-category F1
    per_category_f1 = f1_score(labels, preds, average=None, zero_division=0)

    metrics = {
        "f1_micro": f1_micro,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "precision_macro": precision_macro,
        "recall_macro": recall_macro,
    }

    # Add per-category metrics
    for i, cat in enumerate(CATEGORIES):
        if i < len(per_category_f1):
            safe_name = cat.replace(" / ", "_").replace("-", "_").replace(" ", "_").lower()
            metrics[f"f1_{safe_name}"] = per_category_f1[i]

    return metrics


# ─── Training ─────────────────────────────────────────────────────────

def train():
    """Run the full training pipeline."""
    print("=" * 60)
    print("Dark Pattern Detection — Model Training")
    print(f"Device: {DEVICE} | FP16: {FP16}")
    print("=" * 60)

    # Determine training data path
    train_path = TRAIN_DATA_PATH
    if not os.path.exists(train_path):
        train_path = TRAIN_DATA_FALLBACK
    if not os.path.exists(train_path):
        print(f"✗ Training data not found!")
        print("  → Run data/preprocess.py first!")
        return

    if not os.path.exists(TEST_DATA_PATH):
        print(f"✗ Test data not found!")
        print("  → Run data/preprocess.py first!")
        return

    # Load tokenizer
    print(f"\n→ Loading tokenizer: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    # Load datasets
    print(f"\n→ Loading training data from: {os.path.basename(train_path)}")
    train_dataset = DarkPatternDataset(
        csv_path=train_path,
        max_length=MAX_SEQ_LENGTH,
        tokenizer=tokenizer,
    )
    print(f"  ✓ {len(train_dataset)} training samples")

    print(f"\n→ Loading test data from: {os.path.basename(TEST_DATA_PATH)}")
    test_dataset = DarkPatternDataset(
        csv_path=TEST_DATA_PATH,
        max_length=MAX_SEQ_LENGTH,
        tokenizer=tokenizer,
    )
    print(f"  ✓ {len(test_dataset)} test samples")

    # Load model
    print(f"\n→ Loading model: {MODEL_NAME}")
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
        problem_type=PROBLEM_TYPE,
    )
    print(f"  ✓ Model loaded ({sum(p.numel() for p in model.parameters()) / 1e6:.1f}M parameters)")

    # Create output directories
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    os.makedirs(BEST_MODEL_DIR, exist_ok=True)

    # Training arguments
    training_args = TrainingArguments(
        output_dir=CHECKPOINT_DIR,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        warmup_ratio=WARMUP_RATIO,
        weight_decay=WEIGHT_DECAY,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
        eval_strategy="steps",
        eval_steps=EVAL_STEPS,
        save_strategy="steps",
        save_steps=SAVE_STEPS,
        save_total_limit=SAVE_TOTAL_LIMIT,
        load_best_model_at_end=LOAD_BEST_MODEL_AT_END,
        metric_for_best_model=METRIC_FOR_BEST_MODEL,
        greater_is_better=True,
        logging_steps=LOGGING_STEPS,
        logging_dir=os.path.join(CHECKPOINT_DIR, "logs"),
        fp16=FP16,
        seed=SEED,
        report_to="none",
        remove_unused_columns=False,
    )

    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
    )

    # Train!
    print(f"\n{'─' * 60}")
    print("Starting training...")
    print(f"{'─' * 60}")
    train_result = trainer.train()

    # Save best model
    print(f"\n→ Saving best model to {BEST_MODEL_DIR}")
    trainer.save_model(BEST_MODEL_DIR)
    tokenizer.save_pretrained(BEST_MODEL_DIR)
    print("  ✓ Model and tokenizer saved")

    # Save training metrics
    metrics = train_result.metrics
    metrics_path = os.path.join(CHECKPOINT_DIR, "train_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  ✓ Training metrics saved → {metrics_path}")

    # Final evaluation
    print(f"\n{'─' * 60}")
    print("Final evaluation on test set...")
    print(f"{'─' * 60}")
    eval_metrics = trainer.evaluate()

    print(f"\n  Results:")
    print(f"  {'Metric':<30s} {'Value':>10s}")
    print(f"  {'─' * 42}")
    for key, value in sorted(eval_metrics.items()):
        if key.startswith("eval_"):
            name = key.replace("eval_", "")
            print(f"  {name:<30s} {value:>10.4f}")

    print(f"\n{'=' * 60}")
    print("✓ Training complete!")
    print(f"  Best model saved to: {BEST_MODEL_DIR}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    train()
