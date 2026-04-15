from pydantic import BaseModel, model_validator


class AnalyzeRequest(BaseModel):
    url: str = None
    html: str = None
    threshold: float = 0.7

    @model_validator(mode="after")
    def check_url_or_html_provided(self):
        if not self.url and not self.html:
            raise ValueError("You must provide either a 'url' or 'html' field.")
        return self


class CategoryMatch(BaseModel):
    name: str
    confidence: float


class PatternMatch(BaseModel):
    text: str
    categories: list
    severity: str
    severity_score: float
    location: str = None


class AnalyzeResponse(BaseModel):
    url: str = None
    total_segments: int
    flagged_segments: int
    patterns: list
    summary: dict
    analysis_time_ms: float


class HealthResponse(BaseModel):
    status: str = "healthy"
    model_loaded: bool = False
    model_info: dict | None = None
