"""
Health Route — GET /health

Returns API health status and model loading state.
"""

from fastapi import APIRouter
from api.schemas import HealthResponse
from api.services.classifier import get_classifier_service

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check API health status",
)
async def health():
    """Returns the API health status and whether the ML model is loaded."""
    classifier = get_classifier_service()
    return HealthResponse(
        status="healthy",
        model_loaded=classifier.is_loaded,
        model_info=classifier.get_model_info() if classifier.is_loaded else None,
    )
