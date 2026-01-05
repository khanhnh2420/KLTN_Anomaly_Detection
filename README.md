# 🎓 KLTN – Anomaly Detection in SAP ERP Data

> **Graduation Thesis Project (KLTN)**
> **Major:** Information Technology
> **Focus:** Anomaly Detection, Machine Learning, Business Process & ERP Data

---

## 📌 Project Overview

This project focuses on **detecting anomalies in SAP ERP transactional data** using **unsupervised machine learning techniques**. The goal is to support **financial auditing, fraud detection, and risk analysis** by identifying abnormal accounting transactions.

The system is designed as a **full-stack anomaly detection platform**, including:

* Data preprocessing & feature engineering
* Model training and scoring
* RESTful backend API
* Interactive frontend visualization

---

## 🎯 Objectives

* Analyze SAP ERP transaction logs and accounting records
* Apply anomaly detection algorithms suitable for **high-dimensional financial data**
* Provide interpretable anomaly scores for auditing purposes
* Deploy a practical demo system for real-world usage

---

## 🧠 Methodology

### 🔹 Data Processing

* Cleaning and normalization of SAP ERP fields
* Categorical encoding
* Numerical scaling

### 🔹 Feature Engineering

* Dimensionality reduction using **SVD**
* Latent space representation

### 🔹 Anomaly Detection Model

* **Local Outlier Factor (LOF)** applied on latent features
* Unsupervised learning (no labeled anomalies required)
* Anomaly score distribution analysis

### 🔹 Thresholding Strategy

* Percentile-based threshold (P90, P95, P99)
* Flexible threshold selection for auditors

---

## 🏗️ System Architecture

```text
Frontend (React)
      │
      ▼
Backend API (FastAPI)
      │
      ▼
Feature Pipeline → SVD → LOF Model
```

---

## ⚙️ Tech Stack

### 🔧 Backend

* Python 3.x
* FastAPI
* Scikit-learn
* NumPy, Pandas
* Joblib

### 🎨 Frontend

* React
* Material UI (MUI)
* Chart.js / Recharts

### 🚀 Deployment

* Backend: **Render**
* Frontend: **Netlify**

---

## 📁 Project Structure

```text
KLTN_anomaly_detection
├─ backend
│  ├─ .dockerignore
│  ├─ Dockerfile
│  ├─ model
│  │  └─ svd_lof.joblib
│  ├─ requirements.txt
│  └─ src
│     ├─ custom_transformers.py
│     ├─ main.py
│     └─ __pycache__
│        ├─ custom_transformers.cpython-311.pyc
│        └─ main.cpython-311.pyc
├─ frontend
│  ├─ netlify.toml
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ anomaly_icon.png
│  │  ├─ index.html
│  │  ├─ manifest.json
│  │  └─ _redirects
│  └─ src
│     ├─ App.jsx
│     ├─ components
│     │  ├─ ErrorState.jsx
│     │  ├─ LoadingScreen.jsx
│     │  └─ MetricCard.jsx
│     ├─ index.js
│     ├─ pages
│     │  ├─ ResultPage.jsx
│     │  └─ UploadPage.jsx
│     ├─ services
│     │  └─ api.js
│     └─ utils
│        └─ errorFormatter.js
└─ README.md
```

---

## 🧪 API Overview

| Endpoint      | Method | Description                           |
| ------------- | ------ | ------------------------------------- |
| `/health`     | GET    | Health check                          |
| `/score_csv`      | POST   | Upload CSV and compute anomaly scores |

---

## 📊 Results & Visualization

* Anomaly Score Distribution
* Top-N anomalous transactions
* Threshold-based anomaly flagging

The system allows auditors to dynamically adjust anomaly thresholds and immediately observe changes in detected anomalies.

---

## 📦 Model Storage Strategy

> ⚠️ **Important Notice**

Due to GitHub's file size limitations, trained models are stored using **Git Large File Storage (Git LFS)**.

* Model file: `backend/model/svd_lof.joblib`
* Git LFS ensures reproducibility without bloating repository size

Alternatively, models can be retrained using provided training scripts.

---

## 🚀 How to Run

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## 📚 Related Work

* Sarno et al. (2020) – Anomaly Detection in Business Processes
* Schreyer et al. (2019) – Latent Space Accounting Anomaly Detection

---

## 🎓 Academic Context

This project is conducted as a **Graduation Thesis (Khóa Luận Tốt Nghiệp)** and is intended for **academic and research purposes**.

---
## 👤 Author & Supervisor

**Authors:**  
Nguyễn Hoàng Khanh – Undergraduate Student, IT  
Lê Quang Huy – Undergraduate Student, IT  

**Supervisor**

**Dr. Nguyễn Văn A**  
Faculty of Computer Science and Engineering  
University of Information Technology – VNU-HCM

---

## 📜 License

This project is for **educational and research use only**.
