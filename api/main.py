import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from api.routes.analyze import router as analyze_router
from api.routes.health import router as health_router
from api.services.classifier import get_classifier_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    classifier = get_classifier_service()
    model_dir = os.environ.get(
        "MODEL_PATH",
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "checkpoints", "best_model"),
    )
    classifier.load_model(model_dir)
    yield


app = FastAPI(
    title="Dark Pattern Detection API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(health_router)


@app.get("/")
async def root():
    return {
        "name": "Dark Pattern Detection API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
