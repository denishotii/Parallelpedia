# Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Final image
FROM python:3.11-slim

# Install nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Setup backend
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm || true
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')" || true
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

# Environment
ENV ENABLE_DKG_LOOKUP=0

# Start script
RUN echo '#!/bin/bash\n\
cd /app/backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 &\n\
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
