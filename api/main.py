"""
FastAPI Application — Dark Pattern Detection API.

Main entry point for the backend server.
"""

import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from api.routes.analyze import router as analyze_router
from api.routes.health import router as health_router
from api.services.classifier import get_classifier_service


# ─── Lifespan ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ML model on startup."""
    print("\n" + "=" * 60)
    print("  Dark Pattern Detection API — Starting Up")
    print("=" * 60)

    # Load classifier model
    classifier = get_classifier_service()
    model_dir = os.environ.get(
        "MODEL_PATH",
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "checkpoints", "best_model"),
    )
    classifier.load_model(model_dir)

    print("=" * 60)
    print("  API Ready!")
    print("=" * 60 + "\n")

    yield  # App is running

    # Cleanup
    print("\nShutting down...")


# ─── App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Dark Pattern Detection API",
    description=(
        "API for detecting dark patterns in web pages. "
        "Submit a URL or raw HTML and receive a structured report "
        "of manipulative UI/UX patterns with severity scores."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────

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

# ─── Routes ───────────────────────────────────────────────────────────

app.include_router(analyze_router)
app.include_router(health_router)


@app.get("/", tags=["Root"])
async def root():
    """API root — redirects to docs."""
    return {
        "name": "Dark Pattern Detection API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# ─── Run ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
