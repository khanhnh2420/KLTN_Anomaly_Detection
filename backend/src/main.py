# src/main.py
from pathlib import Path
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager
import math
import io

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
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
    from src.custom_transformers import DropColumns, log_eps

    # Patch for old pickle
    setattr(__main__, "DropColumns", DropColumns)
    setattr(__main__, "log_eps", log_eps)

    bundle = joblib.load(MODEL_PATH)
    app.state.feature_pipe = bundle["feature_pipe"]
    app.state.lof = bundle["lof"]

    yield

# =========================
# App
# =========================
app = FastAPI(
    title="SVD + LOF Scoring API",
    version="1.0",
    lifespan=lifespan,
)

# =========================
# CORS (BẮT BUỘC CHO FE)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # khi production có thể giới hạn domain
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
# CSV upload + pagination
# =========================
@app.post("/score_csv")
async def score_csv(
    file: UploadFile = File(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=5, le=100),
):
    # 1. Read CSV
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))

    if "BELNR" not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="CSV must contain column 'BELNR'",
        )

    # 2. Ensure numeric
    for c in ["DMBTR", "WRBTR"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    # 3. Feature + scoring
    try:
        Z = app.state.feature_pipe.transform(df)
        scores = -app.state.lof.score_samples(Z)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Scoring failed: {e}")

    df["anomaly_scored"] = scores.astype(float)

    # 4. Sort
    df_sorted = (
        df.sort_values("anomaly_scored", ascending=False)
        .reset_index(drop=True)
    )

    total_rows = len(df_sorted)
    total_pages = max(1, math.ceil(total_rows / page_size))

    if page > total_pages:
        raise HTTPException(
            status_code=400,
            detail=f"page ({page}) exceeds total_pages ({total_pages})",
        )

    # 5. Pagination
    start = (page - 1) * page_size
    end = start + page_size
    df_page = df_sorted.iloc[start:end][["BELNR", "anomaly_scored"]]

    # 6. Response
    return {
        "meta": {
            "page": page,
            "page_size": page_size,
            "total_rows": total_rows,
            "total_pages": total_pages,
        },
        "data": df_page.to_dict(orient="records"),
    }
