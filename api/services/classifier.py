"""
Classifier Service.

Wraps the model inference pipeline for API use.
Provides singleton model loading and batch classification.
"""

import os
import sys
import time
from typing import List, Dict, Optional
from collections import Counter

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from model.inference import DarkPatternDetector, get_detector
from data.label_mapping import CATEGORIES


class ClassifierService:
    """
    Classifier service for the API.
    
    Manages model lifecycle and provides a clean interface
    for the route handlers.
    """

    def __init__(self):
        self._detector: Optional[DarkPatternDetector] = None

    @property
    def is_loaded(self) -> bool:
        """Check if the model is loaded."""
        return self._detector is not None and self._detector._model is not None

    def load_model(self, model_dir: str = None):
        """Load the model (called on app startup)."""
        try:
            self._detector = get_detector(model_dir)
            # Force model loading
            _ = self._detector.model
            print("✓ Classifier model loaded successfully")
        except FileNotFoundError as e:
            print(f"⚠ Model not found: {e}")
            print("  The API will run but /analyze will return errors until the model is trained.")
            self._detector = None
        except Exception as e:
            print(f"✗ Failed to load model: {e}")
            self._detector = None

    def classify(
        self,
        segments: List[Dict],
        threshold: float = 0.7,
    ) -> Dict:
        """
        Classify text segments for dark patterns.
        
        Args:
            segments: List of text segment dicts from text_extractor.
                      Each must have a "text" key.
            threshold: Confidence threshold for classification.
            
        Returns:
            Dict with:
            - patterns: List of flagged patterns with metadata
            - summary: Count per category
            - total_segments: Total input segments
            - flagged_segments: Number of flagged segments
        """
        if not self._detector:
            raise RuntimeError(
                "Model not loaded. Train the model first with: python model/train.py"
            )

        if not segments:
            return {
                "patterns": [],
                "summary": {cat: 0 for cat in CATEGORIES},
                "total_segments": 0,
                "flagged_segments": 0,
            }

        # Extract texts for inference
        texts = [seg["text"] for seg in segments]

        # Run batch prediction
        start = time.time()
        predictions = self._detector.predict(texts, threshold=threshold)
        inference_time = (time.time() - start) * 1000

        # Build response
        patterns = []
        summary = Counter()

        for seg, pred in zip(segments, predictions):
            if pred["is_dark_pattern"]:
                pattern = {
                    "text": pred["text"],
                    "categories": pred["categories"],
                    "severity": pred["severity"],
                    "severity_score": pred["severity_score"],
                    "location": seg.get("context", None),
                }
                patterns.append(pattern)

                # Update summary counts
                for cat in pred["categories"]:
                    summary[cat["name"]] += 1

        # Sort patterns by severity score (descending)
        patterns.sort(key=lambda x: x["severity_score"], reverse=True)

        # Build full summary with all categories
        full_summary = {cat: summary.get(cat, 0) for cat in CATEGORIES}

        return {
            "patterns": patterns,
            "summary": full_summary,
            "total_segments": len(segments),
            "flagged_segments": len(patterns),
            "inference_time_ms": round(inference_time, 2),
        }

    def get_model_info(self) -> Dict:
        """Get model metadata."""
        if self._detector:
            return self._detector.get_model_info()
        return {"status": "not loaded"}


# ─── Singleton ─────────────────────────────────────────────────────────

_classifier_service = None


def get_classifier_service() -> ClassifierService:
    """Get or create a singleton classifier service."""
    global _classifier_service
    if _classifier_service is None:
        _classifier_service = ClassifierService()
    return _classifier_service
