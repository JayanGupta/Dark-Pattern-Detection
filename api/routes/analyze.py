import time
from fastapi import APIRouter, HTTPException

from api.schemas import AnalyzeRequest, AnalyzeResponse, PatternMatch, CategoryMatch
from api.services.scraper import scrape_url
from api.services.text_extractor import extract_text_segments, filter_relevant_segments
from api.services.classifier import get_classifier_service

router = APIRouter()

@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    start_time = time.time()
    classifier = get_classifier_service()
    if not classifier.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded. Train first: python model/train.py")

    html_content = None

    if request.url:
        try:
            html_content = await scrape_url(request.url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    elif request.html:
        html_content = request.html

    if not html_content:
        raise HTTPException(status_code=400, detail="No HTML content")

    try:
        segments = extract_text_segments(html_content)
        segments = filter_relevant_segments(segments, max_segments=500)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not segments:
        return AnalyzeResponse(
            url=request.url,
            total_segments=0,
            flagged_segments=0,
            patterns=[],
            summary={},
            analysis_time_ms=round((time.time() - start_time) * 1000, 2),
        )

    try:
        result = classifier.classify(segments, threshold=request.threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    patterns = [
        PatternMatch(
            text=p["text"],
            categories=[CategoryMatch(name=c["name"], confidence=c["confidence"]) for c in p["categories"]],
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
        analysis_time_ms=round((time.time() - start_time) * 1000, 2),
    )
