import os
import sys
import time
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from model.detector import DarkPatternDetector, get_detector
from data.label_mapping import CATEGORIES

class ClassifierService:
    def __init__(self):
        self._detector = None

    @property
    def is_loaded(self):
        return self._detector is not None and self._detector._model is not None

    def load_model(self, model_dir=None):
        try:
            self._detector = get_detector(model_dir)
            _ = self._detector.model
            print("[OK] Classifier model loaded successfully")
        except FileNotFoundError as e:
            print(f"[WARN] Model not found: {e}")
            self._detector = None
        except Exception as e:
            print(f"[ERROR] Failed to load model: {e}")
            self._detector = None

    def classify(self, segments, threshold=0.7):
        if not self._detector:
            raise RuntimeError("Model not loaded! Train it first: python -m model.train")

        if not segments:
            return {
                "patterns": [],
                "summary": {cat: 0 for cat in CATEGORIES},
                "total_segments": 0,
                "flagged_segments": 0,
            }

        texts = [seg["text"] for seg in segments]
        start = time.time()
        predictions = self._detector.predict(texts, threshold=threshold)
        inference_time = (time.time() - start) * 1000

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

                for cat in prediction["categories"]:
                    category_counts[cat["name"]] += 1

        patterns.sort(key=lambda x: x["severity_score"], reverse=True)
        full_summary = {cat: category_counts.get(cat, 0) for cat in CATEGORIES}

        return {
            "patterns": patterns,
            "summary": full_summary,
            "total_segments": len(segments),
            "flagged_segments": len(patterns),
            "inference_time_ms": round(inference_time, 2),
        }

    def get_model_info(self):
        if self._detector:
            return self._detector.get_model_info()
        return {"status": "not loaded"}


_classifier_service = None

def get_classifier_service():
    global _classifier_service
    if _classifier_service is None:
        _classifier_service = ClassifierService()
    return _classifier_service
