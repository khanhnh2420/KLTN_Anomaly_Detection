# src/main.py
from pathlib import Path
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager
import io

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# =========================
# Paths
# =========================
ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "model" / "svd_lof.joblib"

# =========================
# Request schema
# =========================
class ScoreRequest(BaseModel):
    records: List[Dict[str, Any]]
    top_k: Optional[int] = 10

# =========================
# Lifespan: load model
# =========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    import __main__
    from src.custom_transformers import DropColumns, log_eps  # noqa: F401

    setattr(__main__, "DropColumns", DropColumns)
    setattr(__main__, "log_eps", log_eps)

    bundle = joblib.load(MODEL_PATH)
    app.state.feature_pipe = bundle["feature_pipe"]
    app.state.lof = bundle["lof"]

    yield

# =========================
# App
# =========================
app = FastAPI(title="SVD+LOF Scoring API", version="0.1", lifespan=lifespan)

# =========================
# CORS
# =========================
origins = ["https://sapanomalydetect.netlify.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Health check
# =========================
@app.get("/health")
def health():
    return {"status": "ok"}

# =========================
# JSON scoring
# =========================
@app.post("/score")
def score(req: ScoreRequest):
    if not req.records:
        raise HTTPException(status_code=400, detail="records is empty")

    df = pd.DataFrame(req.records)

    try:
        Z = app.state.feature_pipe.transform(df)
        scores = -app.state.lof.score_samples(Z)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transform/score failed: {e}")

    s = pd.Series(scores)
    idx = s.sort_values(ascending=False).index.tolist()
    k = min(req.top_k or 10, len(idx))
    top_idx = idx[:k]

    return {
        "n": len(scores),
        "top_k": k,
        "top_index": top_idx,
        "top_scores": [float(scores[i]) for i in top_idx],
    }

# =========================
# CSV scoring với kiểm tra cột
# =========================
@app.post("/score_csv")
async def score_csv(file: UploadFile = File(...), top_k: int = 10):
    content = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {e}")

    # =========================
    # Các cột pipeline yêu cầu
    # =========================
    REQUIRED_COLS = ["PRCTR", "BSCHL", "HKONT", "WAERS", "BUKRS", "KTOSL", "DMBTR", "WRBTR"]

    # Kiểm tra các cột thiếu
    missing_cols = set(REQUIRED_COLS) - set(df.columns)
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns in CSV: {sorted(list(missing_cols))}"
        )

    # Lấy các cột feature
    df_model = df[REQUIRED_COLS]

    # Chuyển các cột numeric
    for col in ["DMBTR", "WRBTR"]:
        df_model[col] = pd.to_numeric(df_model[col], errors="coerce").fillna(0)

    # Transform + LOF scoring
    try:
        Z = app.state.feature_pipe.transform(df_model)
        scores = -app.state.lof.score_samples(Z)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transform/score failed: {e}")

    df['anomaly_scored'] = scores.astype(float)

    # Lấy top_k
    df_return = df.sort_values("anomaly_scored", ascending=False)[["BELNR", "anomaly_scored"]].head(top_k).reset_index(drop=True)

    return df_return.to_dict(orient="records")
