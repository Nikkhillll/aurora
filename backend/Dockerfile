FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# SINGLE worker on purpose: WebSocket clients and live state are per-process.
# Multiple workers would silently drop broadcasts to clients on other processes.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
