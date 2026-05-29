from __future__ import annotations

import io
from typing import List, Optional

import numpy as np
import torch
from fastapi import FastAPI, File, UploadFile
from PIL import Image
from pydantic import BaseModel
from torchvision import models, transforms

from matcher import find_top_matches

app = FastAPI(title="StolenCheck ML Service")

# ---------------------------------------------------------------------------
# Model (loaded once at startup)
# ---------------------------------------------------------------------------
_model: torch.nn.Module | None = None


def _get_model() -> torch.nn.Module:
    """Return the cached MobileNetV2 feature extractor."""
    global _model
    if _model is None:
        base = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        # Remove the classifier head; keep only the feature extractor.
        # MobileNetV2.features outputs (B, 1280, 7, 7) for 224x224 input.
        _model = torch.nn.Sequential(
            base.features,
            torch.nn.AdaptiveAvgPool2d((1, 1)),
            torch.nn.Flatten(),
        )
        _model.eval()
    return _model


# Pre-load the model at import / startup time.
_get_model()

# ---------------------------------------------------------------------------
# Image preprocessing (ImageNet normalisation)
# ---------------------------------------------------------------------------
_preprocess = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)

# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class MatchRequest(BaseModel):
    query_embedding: List[float]
    candidates: List[List[float]]
    top_k: Optional[int] = 5


class MatchResult(BaseModel):
    index: int
    score: float


class MatchResponse(BaseModel):
    results: List[MatchResult]


class EmbeddingResponse(BaseModel):
    embedding: List[float]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/extract", response_model=EmbeddingResponse)
async def extract(file: UploadFile = File(...)):
    """Accept an uploaded image and return its 1280-dim MobileNetV2 embedding."""
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    tensor = _preprocess(image).unsqueeze(0)  # (1, 3, 224, 224)

    model = _get_model()
    with torch.no_grad():
        embedding: torch.Tensor = model(tensor)  # (1, 1280)

    return EmbeddingResponse(embedding=embedding.squeeze(0).tolist())


@app.post("/match", response_model=MatchResponse)
async def match(body: MatchRequest):
    """Find the top-k most similar candidates to the query embedding."""
    results = find_top_matches(
        query_embedding=body.query_embedding,
        candidates=body.candidates,
        top_k=body.top_k,
    )
    return MatchResponse(results=results)
