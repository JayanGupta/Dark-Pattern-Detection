"""
Inference Pipeline - Dark Pattern Detector

This file loads our trained DistilBERT model and uses it to
predict whether text contains dark patterns.

HOW IT WORKS:
1. Load the trained model from the checkpoints folder
2. Take in a list of text strings (e.g. "Only 2 left in stock!")
3. Run each text through the model to get probabilities
4. If probability > threshold, flag it as a dark pattern
5. Return results with category names, confidence scores, and severity
"""

import os
import sys
import time
import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# Add project root to path so we can import our own modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from data.label_mapping import CATEGORIES, IDX_TO_CATEGORY, SEVERITY_WEIGHTS, get_severity_level
from model.config import BEST_MODEL_DIR, MAX_SEQ_LENGTH, INFERENCE_THRESHOLD, INFERENCE_BATCH_SIZE, DEVICE


class DarkPatternDetector:
    """
    The main class that detects dark patterns in text.

    Usage:
        detector = DarkPatternDetector()
        results = detector.predict(["Only 2 left!", "Add to cart"])
    """

    def __init__(self, model_dir=None, device=None):
        # Where to find the trained model files
        self.model_dir = model_dir or BEST_MODEL_DIR
        # Use GPU if available, otherwise CPU
        self.device = device or DEVICE
        # These will be set when we load the model
        self._model = None
        self._tokenizer = None

    @property
    def model(self):
        """Load model the first time it's needed (lazy loading)."""
        if self._model is None:
            self._load_model()
        return self._model

    @property
    def tokenizer(self):
        """Load tokenizer the first time it's needed."""
        if self._tokenizer is None:
            self._load_model()
        return self._tokenizer

    def _load_model(self):
        """Load the trained model and tokenizer from disk."""
        if not os.path.exists(self.model_dir):
            raise FileNotFoundError(
                f"Model not found at {self.model_dir}. "
                "You need to train the model first! Run: python -m model.train"
            )

        print(f"Loading model from {self.model_dir}...")

        # Load the tokenizer (converts text to numbers the model understands)
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_dir)

        # Load the trained model
        self._model = AutoModelForSequenceClassification.from_pretrained(self.model_dir)
        self._model.to(self.device)  # Move to GPU if available
        self._model.eval()  # Set to evaluation mode (no training)

        print(f"[OK] Model loaded on {self.device}")

    def predict(self, texts, threshold=None, batch_size=None):
        """
        Predict dark patterns in a list of text strings.

        Args:
            texts:      A list of strings to check, e.g. ["Only 2 left!", "Buy now"]
            threshold:  Minimum confidence to flag something (default: 0.7 = 70%)
            batch_size: How many texts to process at once (for speed)

        Returns:
            A list of results, one per input text. Each result looks like:
            {
                "text": "Only 2 left in stock!",
                "categories": [{"name": "Urgency / Scarcity", "confidence": 0.94}],
                "severity_score": 0.87,
                "severity": "high",
                "is_dark_pattern": True
            }
        """
        # Nothing to do if no texts given
        if not texts:
            return []

        # Use defaults if not specified
        threshold = threshold or INFERENCE_THRESHOLD
        batch_size = batch_size or INFERENCE_BATCH_SIZE

        # --- STEP 1: Convert all texts to model predictions ---

        all_probabilities = []

        # Process texts in batches (faster than one at a time)
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]

            # Tokenize: convert words to numbers the model understands
            encoded = self.tokenizer(
                batch,
                max_length=MAX_SEQ_LENGTH,
                padding=True,
                truncation=True,
                return_tensors="pt",  # Return PyTorch tensors
            )

            # Move data to the same device as the model (CPU or GPU)
            encoded = {key: val.to(self.device) for key, val in encoded.items()}

            # Run through the model (no gradient calculation needed for inference)
            with torch.no_grad():
                output = self.model(**encoded)

                # Convert raw model output (logits) to probabilities using sigmoid
                # Sigmoid squishes values to 0-1 range (like percentages)
                logits = output.logits.cpu().numpy()
                probabilities = 1 / (1 + np.exp(-logits))

                all_probabilities.extend(probabilities.tolist())

        # --- STEP 2: Turn probabilities into human-readable results ---

        results = []

        for text, probs in zip(texts, all_probabilities):
            # Check each category to see if it's above the threshold
            detected_categories = []
            for index, probability in enumerate(probs):
                if probability >= threshold:
                    category_name = IDX_TO_CATEGORY[index]
                    detected_categories.append({
                        "name": category_name,
                        "confidence": round(float(probability), 4),
                    })

            # Sort by confidence (highest first)
            detected_categories.sort(key=lambda x: x["confidence"], reverse=True)

            # Calculate how severe/harmful this dark pattern is
            severity_score = self._calculate_severity(probs, threshold)
            severity_level = get_severity_level(severity_score)

            results.append({
                "text": text,
                "categories": detected_categories,
                "severity_score": round(severity_score, 4),
                "severity": severity_level,
                "is_dark_pattern": len(detected_categories) > 0,
            })

        return results

    def _calculate_severity(self, probs, threshold):
        """
        Calculate how harmful a dark pattern is (0.0 to 1.0).

        Some categories are more harmful than others:
        - Hidden Costs (0.95 weight) — very harmful
        - Forced Continuity (0.9 weight) — very harmful
        - Social Proof (0.5 weight) — less harmful

        This function multiplies each detected category's confidence
        by its harmfulness weight, then averages them.
        """
        weighted_sum = 0.0
        total_weight = 0.0

        for index, probability in enumerate(probs):
            if probability >= threshold:
                category_name = IDX_TO_CATEGORY[index]
                weight = SEVERITY_WEIGHTS.get(category_name, 0.5)
                weighted_sum += probability * weight
                total_weight += weight

        if total_weight == 0:
            return 0.0

        return weighted_sum / total_weight

    def predict_single(self, text, threshold=None):
        """Shortcut: predict dark patterns for just one text string."""
        results = self.predict([text], threshold=threshold)
        return results[0] if results else {}

    def get_model_info(self):
        """Return info about the loaded model."""
        return {
            "model_name": "DistilBERT (fine-tuned)",
            "model_dir": self.model_dir,
            "device": self.device,
            "num_categories": len(CATEGORIES),
            "categories": CATEGORIES,
            "max_seq_length": MAX_SEQ_LENGTH,
            "default_threshold": INFERENCE_THRESHOLD,
        }


# --- Singleton: reuse the same detector everywhere ---

_detector_instance = None

def get_detector(model_dir=None):
    """Get a single shared detector instance (creates one if it doesn't exist)."""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = DarkPatternDetector(model_dir=model_dir)
    return _detector_instance


# --- Demo: run this file directly to test ---

if __name__ == "__main__":
    detector = DarkPatternDetector()

    # Example texts to test
    test_texts = [
        "Only 2 left in stock - order soon!",
        "No thanks, I hate saving money",
        "Someone in New York just bought this item",
        "Your free trial ends in 3 days. You will be automatically charged $29.99/month.",
        "Processing fee of $3.99 added at checkout",
        "Recommended for you (sponsored)",
        "Add to cart",  # This should NOT be flagged
    ]

    print("=" * 60)
    print("Dark Pattern Detection - Inference Demo")
    print("=" * 60)

    results = detector.predict(test_texts, threshold=0.5)

    for result in results:
        print(f"\n  Text: \"{result['text'][:80]}\"")
        if result["is_dark_pattern"]:
            print(f"  >> DARK PATTERN DETECTED (severity: {result['severity']})")
            for cat in result["categories"]:
                bar = "#" * int(cat["confidence"] * 20)
                print(f"    - {cat['name']}: {cat['confidence']:.2%}  {bar}")
        else:
            print(f"  [OK] Clean")
