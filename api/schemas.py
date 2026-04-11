"""
Pydantic Request/Response Schemas for the Dark Pattern Detection API.
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field, model_validator


class AnalyzeRequest(BaseModel):
    """Request body for the POST /analyze endpoint."""
    url: Optional[str] = Field(
        None,
        description="URL of the web page to analyze. Either url or html must be provided.",
        examples=["https://example.com/product-page"],
    )
    html: Optional[str] = Field(
        None,
        description="Raw HTML content to analyze. Either url or html must be provided.",
    )
    threshold: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for flagging dark patterns (0.0–1.0).",
    )

    @model_validator(mode="after")
    def validate_input(self):
        if not self.url and not self.html:
            raise ValueError("Either 'url' or 'html' must be provided.")
        return self


class CategoryMatch(BaseModel):
    """A single detected dark pattern category with its confidence."""
    name: str = Field(..., description="Dark pattern category name")
    confidence: float = Field(..., description="Model confidence score (0.0–1.0)")


class PatternMatch(BaseModel):
    """A single flagged text segment with its dark pattern classifications."""
    text: str = Field(..., description="The flagged text segment")
    categories: List[CategoryMatch] = Field(
        ..., description="Detected dark pattern categories"
    )
    severity: str = Field(
        ..., description="Severity level: low, medium, high, or critical"
    )
    severity_score: float = Field(
        ..., description="Numeric severity score (0.0–1.0)"
    )
    location: Optional[str] = Field(
        None, description="HTML element context (tag name, class hints)"
    )


class AnalyzeResponse(BaseModel):
    """Response body for the POST /analyze endpoint."""
    url: Optional[str] = Field(None, description="The analyzed URL (if provided)")
    total_segments: int = Field(..., description="Total text segments extracted")
    flagged_segments: int = Field(
        ..., description="Number of segments flagged as dark patterns"
    )
    patterns: List[PatternMatch] = Field(
        ..., description="List of detected dark patterns"
    )
    summary: Dict[str, int] = Field(
        ..., description="Count of detected patterns per category"
    )
    analysis_time_ms: float = Field(
        ..., description="Total analysis time in milliseconds"
    )


class HealthResponse(BaseModel):
    """Response body for the GET /health endpoint."""
    status: str = "healthy"
    model_loaded: bool = False
    model_info: Optional[Dict] = None
