# Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci && npm cache clean --force
COPY frontend/ ./
RUN npm run build && rm -rf node_modules

# Final image
FROM python:3.11-slim

# Install nginx only
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx bash && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Setup backend
WORKDIR /app/backend
COPY backend/requirements.txt .

# Install dependencies with aggressive cleanup
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge && \
    rm -rf /root/.cache/pip /tmp/* /var/tmp/*

# Download NLP models
RUN python -m spacy download en_core_web_sm || true && \
    python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)" || true

# Clean up everything possible
RUN rm -rf /root/.cache/* /tmp/* /var/tmp/* && \
    find /usr/local/lib/python3.11/site-packages -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.11/site-packages -name "*.pyc" -delete 2>/dev/null || true

COPY backend/app/ ./app/
RUN mkdir -p ./data

# Setup frontend
COPY --from=frontend /app/dist /var/www/html

# Nginx config
RUN echo 'server { \
    listen 80; \
    root /var/www/html; \
    index index.html; \
    location /api { \
        proxy_pass http://localhost:8000; \
        proxy_set_header Host $host; \
    } \
    location / { \
        try_files $uri /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

ENV ENABLE_DKG_LOOKUP=0 PYTHONUNBUFFERED=1

# Start script
RUN echo '#!/bin/bash\n\
cd /app/backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 &\n\
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
