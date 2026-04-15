import numpy as np
from sklearn.metrics import f1_score, precision_score, recall_score
from model.config import DEFAULT_THRESHOLD
from data.label_mapping import CATEGORIES

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    probs = 1 / (1 + np.exp(-logits))
    preds = (probs >= DEFAULT_THRESHOLD).astype(int)

    f1_micro = f1_score(labels, preds, average="micro", zero_division=0)
    f1_macro = f1_score(labels, preds, average="macro", zero_division=0)
    f1_weighted = f1_score(labels, preds, average="weighted", zero_division=0)
    precision_macro = precision_score(labels, preds, average="macro", zero_division=0)
    recall_macro = recall_score(labels, preds, average="macro", zero_division=0)

    per_category_f1 = f1_score(labels, preds, average=None, zero_division=0)

    metrics = {
        "f1_micro": f1_micro,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "precision_macro": precision_macro,
        "recall_macro": recall_macro,
    }

    for i, cat in enumerate(CATEGORIES):
        if i < len(per_category_f1):
            safe_name = cat.replace(" / ", "_").replace("-", "_").replace(" ", "_").lower()
            metrics[f"f1_{safe_name}"] = per_category_f1[i]

    return metrics
