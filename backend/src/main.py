from pathlib import Path
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager
import math
import io

import joblib
import pandas as pd
import numpy as np
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

    setattr(__main__, "DropColumns", DropColumns)
    setattr(__main__, "log_eps", log_eps)

    bundle = joblib.load(MODEL_PATH)

    app.state.pipe = bundle
    print("[MODEL] Loaded Pipeline steps:", [name for name, _ in bundle.steps])

    yield


# =========================
# App
# =========================
app = FastAPI(title="LOF Scoring API", version="0.1", lifespan=lifespan)

# =========================
# CORS
# =========================
origins = ["https://sapanomalydetect.netlify.app", "http://localhost:3000"]

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
# CSV scoring với pagination
# =========================
@app.post("/score_csv")
async def score_csv(
    file: UploadFile = File(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    percentile: float = Query(95, ge=50, le=99.9),
):
    content = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"code": "CSV_READ_FAILED", "message": f"Failed to read CSV: {e}"},
        )

    # =========================
    # Required columns
    # =========================
    REQUIRED_COLS = [
        "PRCTR",
        "BSCHL",
        "HKONT",
        "WAERS",
        "BUKRS",
        "KTOSL",
        "DMBTR",
        "WRBTR",
    ]
    missing_cols = set(REQUIRED_COLS) - set(df.columns)
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "MISSING_COLUMNS",
                "message": "Missing required columns in CSV",
                "columns": sorted(list(missing_cols)),
            },
        )

    # =========================
    # Numeric coercion
    # =========================
    for c in ["DMBTR", "WRBTR"]:
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    # =========================
    # Anomaly scoring (PIPELINE)
    # =========================
    try:
        scores = -app.state.pipe.score_samples(df)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "SCORING_FAILED", "message": f"Model scoring failed: {e}"},
        )

    df["anomaly_scored"] = scores.astype(float)

    # =========================
    # GLOBAL threshold
    # =========================
    threshold_value = float(np.percentile(scores, percentile))
    df["is_anomaly"] = (df["anomaly_scored"] >= threshold_value).astype(int)

    # =========================
    # Sort DESC by anomaly score
    # =========================
    df_sorted = df.sort_values("anomaly_scored", ascending=False).reset_index(drop=True)

    # =========================
    # Pagination
    # =========================
    total_rows = len(df_sorted)
    total_pages = max(1, math.ceil(total_rows / page_size))

    if page > total_pages:
        raise HTTPException(
            status_code=400,
            detail=f"page ({page}) exceeds total_pages ({total_pages})",
        )

    start = (page - 1) * page_size
    end = start + page_size
    df_page = df_sorted.iloc[start:end].copy()

    # =========================
    # Metadata
    # =========================
    total_anomalies = int(df["is_anomaly"].sum())

    return {
        "meta": {
            "page": page,
            "page_size": page_size,
            "total_rows": total_rows,
            "total_pages": total_pages,
            "total_anomalies": total_anomalies,
        },
        "threshold": {
            "value": threshold_value,
            "percentile": percentile,
        },
        "data": df_page.to_dict(orient="records"),
    }
