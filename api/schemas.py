"""
API Request/Response Schemas

These are the data shapes (models) for what the API accepts and returns.
Pydantic validates the data automatically — if someone sends bad data,
it returns a clear error message.
"""

from pydantic import BaseModel, Field, model_validator


class AnalyzeRequest(BaseModel):
    """What the user sends to POST /analyze."""

    url: str | None = Field(
        None,
        description="URL of the web page to analyze",
        examples=["https://example.com/product-page"],
    )
    html: str | None = Field(
        None,
        description="Raw HTML content to analyze (alternative to URL)",
    )
    threshold: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Minimum confidence to flag a dark pattern (0.0 to 1.0)",
    )

    @model_validator(mode="after")
    def check_url_or_html_provided(self):
        """Make sure the user provided either a URL or HTML content."""
        if not self.url and not self.html:
            raise ValueError("You must provide either a 'url' or 'html' field.")
        return self


class CategoryMatch(BaseModel):
    """One detected dark pattern category."""
    name: str = Field(..., description="Category name, e.g. 'Urgency / Scarcity'")
    confidence: float = Field(..., description="How confident the model is (0.0 to 1.0)")


class PatternMatch(BaseModel):
    """One flagged text segment with its dark pattern info."""
    text: str = Field(..., description="The suspicious text")
    categories: list[CategoryMatch] = Field(..., description="Which dark patterns were detected")
    severity: str = Field(..., description="low, medium, high, or critical")
    severity_score: float = Field(..., description="Numeric severity (0.0 to 1.0)")
    location: str | None = Field(None, description="Where in the HTML this was found")


class AnalyzeResponse(BaseModel):
    """What the API returns after analyzing a page."""
    url: str | None = Field(None, description="The URL that was analyzed")
    total_segments: int = Field(..., description="Total text segments found on the page")
    flagged_segments: int = Field(..., description="How many segments had dark patterns")
    patterns: list[PatternMatch] = Field(..., description="All detected dark patterns")
    summary: dict[str, int] = Field(..., description="Count per category")
    analysis_time_ms: float = Field(..., description="How long the analysis took (ms)")


class HealthResponse(BaseModel):
    """API health check response."""
    status: str = "healthy"
    model_loaded: bool = False
    model_info: dict | None = None
