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
# Batched LOF scoring helper
# =========================
def score_lof_batched(lof_model, X, batch_size: int = 5000):
    scores = []
    n = X.shape[0]
    for i in range(0, n, batch_size):
        batch = X[i:i+batch_size]
        scores.append(-lof_model.score_samples(batch))
    return pd.np.concatenate(scores)

# =========================
# CSV scoring với pagination
# =========================
@app.post("/score_csv")
async def score_csv(
    file: UploadFile = File(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    content = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {e}")

    # Cột pipeline yêu cầu
    REQUIRED_COLS = ["PRCTR", "BSCHL", "HKONT", "WAERS", "BUKRS", "KTOSL", "DMBTR", "WRBTR"]

    # Kiểm tra cột thiếu
    missing_cols = set(REQUIRED_COLS) - set(df.columns)
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns in CSV: {sorted(list(missing_cols))}"
        )

    # Lấy cột feature
    df_model = df[REQUIRED_COLS]

    # Chuyển các cột numeric
    for col in ["DMBTR", "WRBTR"]:
        df_model[col] = pd.to_numeric(df_model[col], errors="coerce").fillna(0)

    # Transform + LOF scoring
    try:
        Z = app.state.feature_pipe.transform(df_model)
        scores = score_lof_batched(app.state.lof, Z)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transform/score failed: {e}")

    df['anomaly_scored'] = scores.astype(float)

    # =========================
    # Pagination
    # =========================
    total_rows = len(df)
    total_pages = max(1, math.ceil(total_rows / page_size))

    if page > total_pages:
        raise HTTPException(
            status_code=400,
            detail=f"page ({page}) exceeds total_pages ({total_pages})",
        )

    start = (page - 1) * page_size
    end = page * page_size

    # Lấy top anomaly scores cho tất cả rows, sau đó slice theo page
    df_top = df.nlargest(end, "anomaly_scored")
    df_page = df_top.iloc[start:end][["BELNR", "anomaly_scored"]]

    return {
        "meta": {
            "page": page,
            "page_size": page_size,
            "total_rows": total_rows,
            "total_pages": total_pages
        },
        "data": df_page.to_dict(orient="records")
    }
