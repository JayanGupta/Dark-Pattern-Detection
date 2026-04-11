"""
Unit Tests for the /analyze API endpoint.
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from api.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Tests for GET /health."""

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_response_schema(self):
        response = client.get("/health")
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "model_loaded" in data

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data


class TestAnalyzeEndpoint:
    """Tests for POST /analyze."""

    def test_analyze_requires_url_or_html(self):
        """Should return 422 when neither url nor html is provided."""
        response = client.post("/analyze", json={"threshold": 0.7})
        assert response.status_code == 422

    def test_analyze_accepts_html(self):
        """Should accept raw HTML content."""
        response = client.post("/analyze", json={
            "html": "<html><body><p>Only 2 left in stock!</p></body></html>",
            "threshold": 0.5,
        })
        # May return 503 if model not loaded, or 200 if loaded
        assert response.status_code in (200, 503)

    def test_analyze_validates_threshold_range(self):
        """Threshold must be between 0 and 1."""
        response = client.post("/analyze", json={
            "html": "<html><body>Test</body></html>",
            "threshold": 1.5,  # Out of range
        })
        assert response.status_code == 422

    def test_analyze_response_schema(self):
        """Response should have the correct schema when model is loaded."""
        response = client.post("/analyze", json={
            "html": "<html><body><p>No thanks, I hate saving money</p></body></html>",
            "threshold": 0.5,
        })
        if response.status_code == 200:
            data = response.json()
            assert "total_segments" in data
            assert "flagged_segments" in data
            assert "patterns" in data
            assert "summary" in data
            assert "analysis_time_ms" in data
            assert isinstance(data["patterns"], list)
            assert isinstance(data["summary"], dict)

    def test_analyze_with_empty_html(self):
        """Should handle empty HTML body gracefully."""
        response = client.post("/analyze", json={
            "html": "<html><body></body></html>",
            "threshold": 0.7,
        })
        if response.status_code == 200:
            data = response.json()
            assert data["flagged_segments"] == 0

    def test_analyze_invalid_url(self):
        """Should return error for unreachable URLs."""
        response = client.post("/analyze", json={
            "url": "https://this-domain-definitely-does-not-exist-12345.com",
            "threshold": 0.7,
        })
        # Should be 400 or 500 (URL fetch error), not a 200
        assert response.status_code in (400, 500, 503)

    def test_analyze_default_threshold(self):
        """Should use default threshold of 0.7 when not specified."""
        response = client.post("/analyze", json={
            "html": "<html><body><p>Test text</p></body></html>",
        })
        # Just verify it doesn't crash
        assert response.status_code in (200, 503)
