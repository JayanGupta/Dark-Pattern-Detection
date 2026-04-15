import os
import sys
import time
import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from data.label_mapping import CATEGORIES, IDX_TO_CATEGORY, SEVERITY_WEIGHTS, get_severity_level
from model.config import BEST_MODEL_DIR, MAX_SEQ_LENGTH, INFERENCE_THRESHOLD, INFERENCE_BATCH_SIZE, DEVICE

class DarkPatternDetector:
    def __init__(self, model_dir=None, device=None):
        self.model_dir = model_dir or BEST_MODEL_DIR
        self.device = device or DEVICE
        self._model = None
        self._tokenizer = None

    @property
    def model(self):
        if self._model is None:
            self._load_model()
        return self._model

    @property
    def tokenizer(self):
        if self._tokenizer is None:
            self._load_model()
        return self._tokenizer

    def _load_model(self):
        if not os.path.exists(self.model_dir):
            raise FileNotFoundError(f"Model not found at {self.model_dir}. Train it first.")

        print(f"Loading model from {self.model_dir}...")
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
        self._model = AutoModelForSequenceClassification.from_pretrained(self.model_dir)
        self._model.to(self.device)
        self._model.eval()
        print(f"[OK] Model loaded on {self.device}")

    def predict(self, texts, threshold=None, batch_size=None):
        if not texts:
            return []

        threshold = threshold or INFERENCE_THRESHOLD
        batch_size = batch_size or INFERENCE_BATCH_SIZE

        all_probabilities = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            encoded = self.tokenizer(
                batch,
                max_length=MAX_SEQ_LENGTH,
                padding=True,
                truncation=True,
                return_tensors="pt",
            )
            encoded = {key: val.to(self.device) for key, val in encoded.items()}

            with torch.no_grad():
                output = self.model(**encoded)
                logits = output.logits.cpu().numpy()
                probabilities = 1 / (1 + np.exp(-logits))
                all_probabilities.extend(probabilities.tolist())

        results = []

        for text, probs in zip(texts, all_probabilities):
            detected_categories = []
            for index, probability in enumerate(probs):
                if probability >= threshold:
                    category_name = IDX_TO_CATEGORY[index]
                    detected_categories.append({
                        "name": category_name,
                        "confidence": round(float(probability), 4),
                    })

            detected_categories.sort(key=lambda x: x["confidence"], reverse=True)
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
        results = self.predict([text], threshold=threshold)
        return results[0] if results else {}

    def get_model_info(self):
        return {
            "model_name": "DistilBERT (fine-tuned)",
            "model_dir": self.model_dir,
            "device": self.device,
            "num_categories": len(CATEGORIES),
            "categories": CATEGORIES,
            "max_seq_length": MAX_SEQ_LENGTH,
            "default_threshold": INFERENCE_THRESHOLD,
        }

_detector_instance = None

def get_detector(model_dir=None):
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = DarkPatternDetector(model_dir=model_dir)
    return _detector_instance

if __name__ == "__main__":
    detector = DarkPatternDetector()
    test_texts = [
        "Only 2 left in stock - order soon!",
        "No thanks, I hate saving money",
        "Someone in New York just bought this item",
        "Your free trial ends in 3 days. You will be automatically charged $29.99/month.",
        "Processing fee of $3.99 added at checkout",
        "Recommended for you (sponsored)",
        "Add to cart",
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
