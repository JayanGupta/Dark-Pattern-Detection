from fastapi import APIRouter
from api.schemas import HealthResponse
from api.services.classifier import get_classifier_service

router = APIRouter()

@router.get("/health")
async def health():
    classifier = get_classifier_service()
    return HealthResponse(
        status="healthy",
        model_loaded=classifier.is_loaded,
        model_info=classifier.get_model_info() if classifier.is_loaded else None,
    )
