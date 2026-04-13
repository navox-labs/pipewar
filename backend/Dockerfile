# ---- build stage ----
FROM python:3.12-slim AS builder

WORKDIR /build

# Install dependencies into an isolated prefix so we can copy only what's needed
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- production stage ----
FROM python:3.12-slim AS production

# Create a non-root user
RUN addgroup --system pipewar && adduser --system --ingroup pipewar pipewar

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# The app imports as `backend.main`, so WORKDIR must be the parent of backend/
WORKDIR /app

# Copy only application source — no tests, no __pycache__, no .env
COPY backend/ ./backend/

# Persistent volume mount point for SQLite database
RUN mkdir -p /data && chown pipewar:pipewar /data

# Environment defaults (secrets injected at runtime via Fly secrets)
ENV ENV=production \
    DB_PATH=/data/pipewar.db \
    PORT=8080 \
    HOST=0.0.0.0

USER pipewar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')"

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
