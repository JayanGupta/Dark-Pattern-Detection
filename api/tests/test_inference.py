"""
Unit Tests for model inference.
"""

import pytest
import time
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from data.label_mapping import CATEGORIES, NUM_LABELS, labels_to_categories, categories_to_labels
from api.services.text_extractor import extract_text_segments, filter_relevant_segments


class TestLabelMapping:
    """Tests for label_mapping utilities."""

    def test_category_count(self):
        assert NUM_LABELS == 7

    def test_categories_list(self):
        assert "Urgency / Scarcity" in CATEGORIES
        assert "Confirm-shaming" in CATEGORIES
        assert "Hidden Costs" in CATEGORIES
        assert "Disguised Ads" in CATEGORIES

    def test_labels_to_categories(self):
        labels = [1, 0, 0, 0, 1, 0, 0]
        cats = labels_to_categories(labels)
        assert "Urgency / Scarcity" in cats
        assert "Confirm-shaming" in cats
        assert len(cats) == 2

    def test_categories_to_labels(self):
        cats = ["Urgency / Scarcity", "Hidden Costs"]
        labels = categories_to_labels(cats)
        assert labels[0] == 1  # Urgency
        assert labels[5] == 1  # Hidden Costs
        assert sum(labels) == 2

    def test_empty_labels(self):
        labels = [0] * NUM_LABELS
        cats = labels_to_categories(labels)
        assert cats == []

    def test_all_labels(self):
        labels = [1] * NUM_LABELS
        cats = labels_to_categories(labels)
        assert len(cats) == NUM_LABELS


class TestTextExtractor:
    """Tests for HTML text extraction."""

    def test_extracts_paragraph_text(self):
        html = "<html><body><p>Only 2 left in stock!</p></body></html>"
        segments = extract_text_segments(html)
        texts = [s["text"] for s in segments]
        assert any("Only 2 left" in t for t in texts)

    def test_extracts_button_text(self):
        html = '<html><body><button>No thanks, I hate saving money</button></body></html>'
        segments = extract_text_segments(html)
        texts = [s["text"] for s in segments]
        assert any("hate saving money" in t for t in texts)

    def test_skips_scripts(self):
        html = '<html><body><script>var x = 1;</script><p>Real text</p></body></html>'
        segments = extract_text_segments(html)
        texts = [s["text"] for s in segments]
        assert not any("var x" in t for t in texts)
        assert any("Real text" in t for t in texts)

    def test_skips_styles(self):
        html = '<html><body><style>.cls{color:red}</style><p>Visible text</p></body></html>'
        segments = extract_text_segments(html)
        texts = [s["text"] for s in segments]
        assert not any("color" in t for t in texts)

    def test_deduplicates_text(self):
        html = '<html><body><p>Same text</p><span>Same text</span></body></html>'
        segments = extract_text_segments(html)
        texts = [s["text"] for s in segments]
        # Should only appear once
        assert texts.count("Same text") == 1

    def test_skips_short_text(self):
        html = '<html><body><p>Hi</p><p>This is a longer sentence.</p></body></html>'
        segments = extract_text_segments(html)
        texts = [s["text"] for s in segments]
        assert not any(t == "Hi" for t in texts)

    def test_handles_empty_html(self):
        segments = extract_text_segments("")
        assert isinstance(segments, list)

    def test_filter_prioritizes_buttons(self):
        html = '''<html><body>
            <button class="popup">Click me for a deal!</button>
            <p>Regular paragraph text here</p>
        </body></html>'''
        segments = extract_text_segments(html)
        filtered = filter_relevant_segments(segments, max_segments=1)
        assert len(filtered) == 1
        assert "Click me" in filtered[0]["text"] or "popup" in filtered[0].get("context", "")


class TestInferencePerformance:
    """Tests for inference speed requirements."""

    @pytest.mark.skipif(
        not os.path.exists(
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                        "model", "checkpoints", "best_model")
        ),
        reason="Model not trained yet"
    )
    def test_inference_under_2_seconds(self):
        """Inference must complete in under 2 seconds per page (~100 segments)."""
        from model.detector import DarkPatternDetector
        
        detector = DarkPatternDetector()
        test_texts = [
            "Only 2 left in stock!",
            "No thanks, I hate saving money",
            "Someone in New York just bought this",
        ] * 33  # ~100 segments

        start = time.time()
        results = detector.predict(test_texts, threshold=0.5)
        elapsed = time.time() - start

        assert elapsed < 2.0, f"Inference took {elapsed:.2f}s (must be < 2s)"
        assert len(results) == len(test_texts)

    @pytest.mark.skipif(
        not os.path.exists(
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                        "model", "checkpoints", "best_model")
        ),
        reason="Model not trained yet"
    )
    def test_multi_label_output_format(self):
        """Each prediction should have the correct format."""
        from model.detector import DarkPatternDetector
        
        detector = DarkPatternDetector()
        results = detector.predict(
            ["Only 2 left in stock — order soon!"],
            threshold=0.3,
        )

        assert len(results) == 1
        result = results[0]
        assert "text" in result
        assert "categories" in result
        assert "severity_score" in result
        assert "severity" in result
        assert "is_dark_pattern" in result
        assert isinstance(result["categories"], list)
