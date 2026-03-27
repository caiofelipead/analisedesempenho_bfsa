# ── Frontend build stage ──
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false
COPY public/ public/
COPY src/ src/
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# ── Backend stage ──
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend_api.py .
COPY wyscout_adversario_parser.py .

# Copy frontend build
COPY --from=frontend-build /app/build /app/static

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

EXPOSE 8000

CMD ["uvicorn", "backend_api:app", "--host", "0.0.0.0", "--port", "8000"]
