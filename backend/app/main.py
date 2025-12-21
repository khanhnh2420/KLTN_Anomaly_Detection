from fastapi import FastAPI, UploadFile, File
import pandas as pd
import os
import joblib
from io import BytesIO

app = FastAPI(title="Anomaly Detection API")

# =============================
# Load model
# =============================
BASE_DIR = os.path.dirname(__file__)
model_path = os.path.join(BASE_DIR, "model.joblib")
model = joblib.load(model_path)

# =============================
# Upload file endpoint
# =============================
@app.post("/predict-file")
async def predict_file(file: UploadFile = File(...)):
    try:
        # =============================
        # Đọc file CSV hoặc Excel
        # =============================
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        elif file.filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(file.file)
        else:
            return {"error": "Unsupported file type"}
        
        # =============================
        # Dự đoán
        # =============================
        predictions = model.predict(df)
        df['prediction'] = predictions
        
        # =============================
        # Trả về kết quả CSV
        # =============================
        output = BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return {"filename": file.filename, "predictions": predictions.tolist()}
    
    except Exception as e:
        return {"error": str(e)}
