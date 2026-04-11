"""
Analyze Route — POST /analyze

Accepts a URL or raw HTML, extracts text segments, classifies them
for dark patterns, and returns a structured report.
"""

import time
from fastapi import APIRouter, HTTPException

from api.schemas import AnalyzeRequest, AnalyzeResponse, PatternMatch, CategoryMatch
from api.services.scraper import scrape_url
from api.services.text_extractor import extract_text_segments, filter_relevant_segments
from api.services.classifier import get_classifier_service

router = APIRouter(tags=["Analysis"])


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Analyze a web page for dark patterns",
    description=(
        "Accepts a URL or raw HTML content and returns a structured report "
        "of detected dark patterns with severity scores and category labels."
    ),
)
async def analyze(request: AnalyzeRequest):
    """
    Analyze a web page for dark patterns.
    
    Provide either a `url` to scrape or raw `html` content.
    Optionally set a `threshold` (default: 0.7) for confidence filtering.
    """
    start_time = time.time()

    classifier = get_classifier_service()
    if not classifier.is_loaded:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model not loaded. The model needs to be trained first. "
                "Run: python model/train.py"
            ),
        )

    html_content = None

    # Step 1: Get HTML
    if request.url:
        try:
            html_content = await scrape_url(request.url)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to scrape URL: {str(e)}",
            )
    elif request.html:
        html_content = request.html

    if not html_content:
        raise HTTPException(
            status_code=400,
            detail="No HTML content to analyze.",
        )

    # Step 2: Extract text segments
    try:
        segments = extract_text_segments(html_content)
        segments = filter_relevant_segments(segments, max_segments=500)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract text from HTML: {str(e)}",
        )

    if not segments:
        total_time = (time.time() - start_time) * 1000
        return AnalyzeResponse(
            url=request.url,
            total_segments=0,
            flagged_segments=0,
            patterns=[],
            summary={},
            analysis_time_ms=round(total_time, 2),
        )

    # Step 3: Classify segments
    try:
        result = classifier.classify(segments, threshold=request.threshold)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Classification failed: {str(e)}",
        )

    # Step 4: Build response
    total_time = (time.time() - start_time) * 1000

    patterns = [
        PatternMatch(
            text=p["text"],
            categories=[
                CategoryMatch(name=c["name"], confidence=c["confidence"])
                for c in p["categories"]
            ],
            severity=p["severity"],
            severity_score=p["severity_score"],
            location=p.get("location"),
        )
        for p in result["patterns"]
    ]

    return AnalyzeResponse(
        url=request.url,
        total_segments=result["total_segments"],
        flagged_segments=result["flagged_segments"],
        patterns=patterns,
        summary=result["summary"],
        analysis_time_ms=round(total_time, 2),
    )
