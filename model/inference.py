"""
Inference Pipeline.

Provides the DarkPatternDetector class for running predictions on text segments.
Optimized for fast batch inference (<2s per page).
"""

import os
import sys
import time
from typing import List, Dict, Optional

import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from data.label_mapping import (
    CATEGORIES, IDX_TO_CATEGORY, SEVERITY_WEIGHTS, get_severity_level,
)
from model.config import (
    BEST_MODEL_DIR, MAX_SEQ_LENGTH, INFERENCE_THRESHOLD,
    INFERENCE_BATCH_SIZE, DEVICE,
)


class DarkPatternDetector:
    """
    Dark pattern detection inference engine.
    
    Loads a fine-tuned DistilBERT model and provides batch prediction
    on text segments with configurable confidence thresholds.
    """

    def __init__(self, model_dir: str = None, device: str = None):
        """
        Initialize the detector.
        
        Args:
            model_dir: Path to the saved model directory.
                       Defaults to model/checkpoints/best_model/
            device: 'cuda' or 'cpu'. Auto-detects if None.
        """
        self.model_dir = model_dir or BEST_MODEL_DIR
        self.device = device or DEVICE
        self._model = None
        self._tokenizer = None

    @property
    def model(self):
        """Lazy-load model on first access."""
        if self._model is None:
            self._load_model()
        return self._model

    @property
    def tokenizer(self):
        """Lazy-load tokenizer on first access."""
        if self._tokenizer is None:
            self._load_model()
        return self._tokenizer

    def _load_model(self):
        """Load model and tokenizer from checkpoint."""
        if not os.path.exists(self.model_dir):
            raise FileNotFoundError(
                f"Model checkpoint not found at {self.model_dir}. "
                "Run model/train.py first!"
            )
        
        print(f"Loading model from {self.model_dir}...")
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
        self._model = AutoModelForSequenceClassification.from_pretrained(self.model_dir)
        self._model.to(self.device)
        self._model.eval()
        print(f"✓ Model loaded on {self.device}")

    def predict(
        self,
        texts: List[str],
        threshold: float = None,
        batch_size: int = None,
    ) -> List[Dict]:
        """
        Predict dark patterns in a list of text segments.
        
        Args:
            texts: List of text segments to classify.
            threshold: Confidence threshold (default: 0.7).
            batch_size: Batch size for inference.
            
        Returns:
            List of prediction dicts, one per input text:
            {
                "text": str,
                "categories": [{"name": str, "confidence": float}],
                "severity_score": float,
                "severity": str,   # "low", "medium", "high", "critical"
                "is_dark_pattern": bool,
            }
        """
        if not texts:
            return []

        threshold = threshold or INFERENCE_THRESHOLD
        batch_size = batch_size or INFERENCE_BATCH_SIZE

        start_time = time.time()

        # Batch tokenize
        all_probs = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            encodings = self.tokenizer(
                batch_texts,
                max_length=MAX_SEQ_LENGTH,
                padding=True,
                truncation=True,
                return_tensors="pt",
            )
            encodings = {k: v.to(self.device) for k, v in encodings.items()}

            with torch.no_grad():
                outputs = self.model(**encodings)
                logits = outputs.logits.cpu().numpy()
                probs = 1 / (1 + np.exp(-logits))  # Sigmoid
                all_probs.extend(probs.tolist())

        # Process predictions
        results = []
        for text, probs in zip(texts, all_probs):
            categories = []
            for idx, prob in enumerate(probs):
                if prob >= threshold:
                    cat_name = IDX_TO_CATEGORY[idx]
                    categories.append({
                        "name": cat_name,
                        "confidence": round(float(prob), 4),
                    })

            # Sort categories by confidence (descending)
            categories.sort(key=lambda x: x["confidence"], reverse=True)

            # Compute severity score
            severity_score = self._compute_severity(probs, threshold)
            severity = get_severity_level(severity_score)

            results.append({
                "text": text,
                "categories": categories,
                "severity_score": round(severity_score, 4),
                "severity": severity,
                "is_dark_pattern": len(categories) > 0,
            })

        inference_time = time.time() - start_time
        return results

    def _compute_severity(self, probs: list, threshold: float) -> float:
        """
        Compute an aggregate severity score from prediction probabilities.
        
        Uses category-specific weights to reflect the relative harmfulness
        of different dark pattern types.
        """
        weighted_sum = 0.0
        weight_total = 0.0

        for idx, prob in enumerate(probs):
            if prob >= threshold:
                cat_name = IDX_TO_CATEGORY[idx]
                weight = SEVERITY_WEIGHTS.get(cat_name, 0.5)
                weighted_sum += prob * weight
                weight_total += weight

        if weight_total == 0:
            return 0.0
        return weighted_sum / weight_total

    def predict_single(self, text: str, threshold: float = None) -> Dict:
        """Predict dark patterns for a single text segment."""
        results = self.predict([text], threshold=threshold)
        return results[0] if results else {}

    def get_model_info(self) -> Dict:
        """Return model metadata."""
        return {
            "model_name": "DistilBERT (fine-tuned)",
            "model_dir": self.model_dir,
            "device": self.device,
            "num_categories": len(CATEGORIES),
            "categories": CATEGORIES,
            "max_seq_length": MAX_SEQ_LENGTH,
            "default_threshold": INFERENCE_THRESHOLD,
        }


# ─── Convenience function ─────────────────────────────────────────────

_detector_instance = None

def get_detector(model_dir: str = None) -> DarkPatternDetector:
    """Get or create a singleton detector instance."""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = DarkPatternDetector(model_dir=model_dir)
    return _detector_instance


# ─── Demo ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    detector = DarkPatternDetector()

    test_texts = [
        "Only 2 left in stock — order soon!",
        "No thanks, I hate saving money",
        "Someone in New York just bought this item",
        "Your free trial ends in 3 days. You will be automatically charged $29.99/month.",
        "Processing fee of $3.99 added at checkout",
        "Recommended for you (sponsored)",
        "Add to cart",  # Negative — should not be flagged
    ]

    print("=" * 60)
    print("Dark Pattern Detection — Inference Demo")
    print("=" * 60)

    results = detector.predict(test_texts, threshold=0.5)

    for result in results:
        print(f"\n  Text: \"{result['text'][:80]}\"")
        if result["is_dark_pattern"]:
            print(f"  🚨 DARK PATTERN DETECTED (severity: {result['severity']})")
            for cat in result["categories"]:
                bar = "█" * int(cat["confidence"] * 20)
                print(f"    → {cat['name']}: {cat['confidence']:.2%}  {bar}")
        else:
            print(f"  ✓ Clean")
