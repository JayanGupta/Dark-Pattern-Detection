"""
Classifier Service

This connects the API routes to our trained ML model.
It handles loading the model and running predictions on text.
"""

import os
import sys
import time
from collections import Counter

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from model.inference import DarkPatternDetector, get_detector
from data.label_mapping import CATEGORIES


class ClassifierService:
    """
    Manages the ML model and provides a simple interface for the API.

    Usage:
        service = get_classifier_service()
        service.load_model()
        result = service.classify(text_segments)
    """

    def __init__(self):
        self._detector = None  # Will hold the DarkPatternDetector instance

    @property
    def is_loaded(self):
        """Check if the model is ready to use."""
        return self._detector is not None and self._detector._model is not None

    def load_model(self, model_dir=None):
        """Load the trained model (called once when the API starts)."""
        try:
            self._detector = get_detector(model_dir)
            # Force the model to load now (not lazily)
            _ = self._detector.model
            print("[OK] Classifier model loaded successfully")
        except FileNotFoundError as e:
            print(f"[WARN] Model not found: {e}")
            print("  The API will run, but /analyze won't work until you train the model.")
            self._detector = None
        except Exception as e:
            print(f"[ERROR] Failed to load model: {e}")
            self._detector = None

    def classify(self, segments, threshold=0.7):
        """
        Classify text segments for dark patterns.

        Args:
            segments:   List of dicts with a "text" key, e.g.
                        [{"text": "Only 2 left!", "context": "button"}, ...]
            threshold:  Minimum confidence to flag (0.0 to 1.0)

        Returns:
            A dict with patterns found, counts per category, and totals.
        """
        if not self._detector:
            raise RuntimeError(
                "Model not loaded! Train it first: python -m model.train"
            )

        if not segments:
            return {
                "patterns": [],
                "summary": {cat: 0 for cat in CATEGORIES},
                "total_segments": 0,
                "flagged_segments": 0,
            }

        # Pull out just the text strings for the model
        texts = [seg["text"] for seg in segments]

        # Run the model on all texts
        start = time.time()
        predictions = self._detector.predict(texts, threshold=threshold)
        inference_time = (time.time() - start) * 1000  # Convert to milliseconds

        # Collect only the texts that were flagged as dark patterns
        patterns = []
        category_counts = Counter()

        for segment, prediction in zip(segments, predictions):
            if prediction["is_dark_pattern"]:
                pattern = {
                    "text": prediction["text"],
                    "categories": prediction["categories"],
                    "severity": prediction["severity"],
                    "severity_score": prediction["severity_score"],
                    "location": segment.get("context", None),
                }
                patterns.append(pattern)

                # Count how many of each category we found
                for cat in prediction["categories"]:
                    category_counts[cat["name"]] += 1

        # Sort by severity (worst first)
        patterns.sort(key=lambda x: x["severity_score"], reverse=True)

        # Build summary with all 7 categories (even ones with 0 count)
        full_summary = {cat: category_counts.get(cat, 0) for cat in CATEGORIES}

        return {
            "patterns": patterns,
            "summary": full_summary,
            "total_segments": len(segments),
            "flagged_segments": len(patterns),
            "inference_time_ms": round(inference_time, 2),
        }

    def get_model_info(self):
        """Get info about the loaded model."""
        if self._detector:
            return self._detector.get_model_info()
        return {"status": "not loaded"}


# --- Singleton: one shared instance for the whole API ---

_classifier_service = None

def get_classifier_service():
    """Get the shared classifier service (creates one if needed)."""
    global _classifier_service
    if _classifier_service is None:
        _classifier_service = ClassifierService()
    return _classifier_service
