"""
ML Security Microservice
========================
Serves two pre-trained scikit-learn models via a FastAPI HTTP API:

  POST /predict  → RandomForestClassifier
                   Features: request_length, num_special_chars,
                              sql_keyword_count, has_script_tag, num_parameters
                   Output:   { label, malicious_prob, risk_score }

  POST /anomaly  → IsolationForest (with StandardScaler preprocessing)
                   Features: Flow Duration, Total Fwd Packets,
                              Total Backward Packets, Flow Bytes/s, Flow Packets/s
                   Output:   { is_anomaly, anomaly_score, risk_score }

  GET  /health   → { status, models_loaded }
"""

from __future__ import annotations

import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("ml-service")

# ---------------------------------------------------------------------------
# Paths — models live alongside this file in models/
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"

REQUEST_MODEL_PATH = MODELS_DIR / "request_model.pkl"
ANOMALY_MODEL_PATH = MODELS_DIR / "anomaly_model.pkl"
SCALER_PATH        = MODELS_DIR / "scaler.pkl"

# ---------------------------------------------------------------------------
# Global model state
# ---------------------------------------------------------------------------
models: dict[str, Any] = {}


def load_models() -> None:
    """Load all three pkl files.  Raises on failure so the service won't start."""
    log.info("Loading ML models from %s …", MODELS_DIR)

    models["request_model"] = joblib.load(REQUEST_MODEL_PATH)
    log.info("  ✓ request_model.pkl  (%s)", type(models["request_model"]).__name__)

    models["scaler"] = joblib.load(SCALER_PATH)
    log.info("  ✓ scaler.pkl         (%s)", type(models["scaler"]).__name__)

    models["anomaly_model"] = joblib.load(ANOMALY_MODEL_PATH)
    log.info("  ✓ anomaly_model.pkl  (%s)", type(models["anomaly_model"]).__name__)

    log.info("All models loaded successfully.")


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown hook)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()
    yield
    models.clear()
    log.info("Models unloaded.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Bug Tracker ML Security Service",
    description="Real-time HTTP request classification and anomaly detection",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class RequestFeatures(BaseModel):
    """
    Features extracted from an incoming HTTP request.

    request_length      : total byte length of URL + serialised body
    num_special_chars   : count of <  >  '  "  ;  |  &  {  }  $  in payload
    sql_keyword_count   : count of SQL keywords (select / union / drop / …)
    has_script_tag      : 1 if <script seen in payload, else 0
    num_parameters      : total number of query + body parameters
    """
    request_length:    float
    num_special_chars: float
    sql_keyword_count: float
    has_script_tag:    float
    num_parameters:    float


class RequestPrediction(BaseModel):
    label:         int    # 0 = normal, 1 = malicious
    malicious_prob: float  # probability of class 1
    risk_score:    float  # 0-100 normalised score


class AnomalyFeatures(BaseModel):
    """
    Network-flow-level features used to detect anomalous behaviour.

    flow_duration          : elapsed ms since first request from this IP in the session window
    total_fwd_packets      : total inbound requests from IP in the session window
    total_backward_packets : total outbound responses (approximated as fwd count)
    flow_bytes_per_sec     : bytes/s rate for this IP
    flow_packets_per_sec   : requests/s rate for this IP
    """
    flow_duration:          float
    total_fwd_packets:      float
    total_backward_packets: float
    flow_bytes_per_sec:     float
    flow_packets_per_sec:   float


class AnomalyResult(BaseModel):
    is_anomaly:    bool
    anomaly_score: float  # raw IsolationForest score (more negative = more anomalous)
    risk_score:    float  # 0-100 normalised score


# ---------------------------------------------------------------------------
# Helper: map IsolationForest score to 0-100 risk score
# ---------------------------------------------------------------------------
def _anomaly_risk_score(raw_score: float) -> float:
    """
    IsolationForest.score_samples() returns values roughly in [-0.5, 0.5].
    Inliers are close to 0, outliers are very negative.
    We map this to 0-100 where 100 = most anomalous.
    """
    # Clamp to [-1, 0] then flip and scale
    clamped = max(-1.0, min(0.0, raw_score))
    return round(abs(clamped) * 100, 2)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": {
            "request_model": "request_model" in models,
            "anomaly_model": "anomaly_model" in models,
            "scaler":        "scaler"        in models,
        },
    }


@app.post("/predict", response_model=RequestPrediction)
def predict(features: RequestFeatures):
    """Classify a single HTTP request as normal or malicious."""
    if "request_model" not in models:
        raise HTTPException(status_code=503, detail="request_model not loaded")

    X = np.array([[
        features.request_length,
        features.num_special_chars,
        features.sql_keyword_count,
        features.has_script_tag,
        features.num_parameters,
    ]])

    model = models["request_model"]

    try:
        label         = int(model.predict(X)[0])
        probas        = model.predict_proba(X)[0]   # [p_normal, p_malicious]
        malicious_prob = float(probas[1])
        risk_score     = round(malicious_prob * 100, 2)
    except Exception as exc:
        log.exception("Prediction error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    log.info(
        "predict | label=%d | malicious_prob=%.3f | risk_score=%.1f",
        label, malicious_prob, risk_score,
    )
    return RequestPrediction(
        label=label,
        malicious_prob=malicious_prob,
        risk_score=risk_score,
    )


@app.post("/anomaly", response_model=AnomalyResult)
def anomaly(features: AnomalyFeatures):
    """Detect whether a request flow is anomalous."""
    if "anomaly_model" not in models or "scaler" not in models:
        raise HTTPException(status_code=503, detail="anomaly models not loaded")

    X_raw = np.array([[
        features.flow_duration,
        features.total_fwd_packets,
        features.total_backward_packets,
        features.flow_bytes_per_sec,
        features.flow_packets_per_sec,
    ]])

    try:
        X_scaled     = models["scaler"].transform(X_raw)
        prediction   = int(models["anomaly_model"].predict(X_scaled)[0])  # 1=inlier, -1=outlier
        raw_score    = float(models["anomaly_model"].score_samples(X_scaled)[0])
        is_anomaly   = prediction == -1
        risk_score   = _anomaly_risk_score(raw_score)
    except Exception as exc:
        log.exception("Anomaly detection error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    log.info(
        "anomaly | is_anomaly=%s | raw_score=%.4f | risk_score=%.1f",
        is_anomaly, raw_score, risk_score,
    )
    return AnomalyResult(
        is_anomaly=is_anomaly,
        anomaly_score=round(raw_score, 6),
        risk_score=risk_score,
    )


# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("ML_SERVICE_PORT", 5001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
