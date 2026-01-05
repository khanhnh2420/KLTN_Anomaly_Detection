# syntax=docker/dockerfile:1.7
FROM python:3.10-slim

WORKDIR /app

# SSL cert
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir \
    --timeout=1000 \
    -i https://pypi.org/simple \
    -r requirements.txt

COPY src/ ./src/
COPY model/ ./model/

# App Service listen on port 8000
EXPOSE 8000

# Start uvicorn on port 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
