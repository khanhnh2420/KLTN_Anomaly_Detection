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
    allow_origins=[
        "http://localhost:3000",
        "https://sap-anomaly-fe.onrender.com",
    ],  # khi production có thể giới hạn domain
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
    content = await file.read()

    USE_COLS = ["BELNR", "DMBTR", "WRBTR"]
    FEATURE_COLS = ["DMBTR", "WRBTR"]

    # 1. Read CSV (nhẹ nhất có thể)
    df = pd.read_csv(
        io.BytesIO(content),
        usecols=USE_COLS,
        dtype={
            "BELNR": "string",
            "DMBTR": "float32",
            "WRBTR": "float32",
        },
    )

    # 2. Feature
    df_model = df[FEATURE_COLS]
    Z = app.state.feature_pipe.transform(df_model)
    Z = Z.astype("float32", copy=False)

    # 3. Batched LOF scoring
    scores = score_lof_batched(app.state.lof, Z)
    df["anomaly_scored"] = scores

    # 4. Pagination (không sort full)
    total_rows = len(df)
    total_pages = max(1, math.ceil(total_rows / page_size))

    if page > total_pages:
        raise HTTPException(
            status_code=400,
            detail=f"page ({page}) exceeds total_pages ({total_pages})",
        )

    k = page * page_size
    topk = df.nlargest(k, "anomaly_scored")

    start = (page - 1) * page_size
    end = page * page_size

    df_page = topk.iloc[start:end][["BELNR", "anomaly_scored"]]

    return {
        "meta": {
            "page": page,
            "page_size": page_size,
            "total_rows": total_rows,
            "total_pages": total_pages,
        },
        "data": df_page.to_dict(orient="records"),
    }
