# Simple Dockerfile for Parallelpedia (Backend + Frontend)
# Optimized for Koyeb deployment

# Base image with Node.js and Python
FROM node:22-slim

# Install Python 3.10+ and build dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3.10-dev \
    python3-pip \
    python3-venv \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create symlinks for python
RUN ln -s /usr/bin/python3.10 /usr/bin/python && \
    ln -s /usr/bin/python3.10 /usr/bin/python3

# Set working directory
WORKDIR /app

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

# Copy frontend source
COPY frontend/ ./frontend/

# Copy backend files
WORKDIR /app
COPY backend/ ./backend/

# Set up Python virtual environment for backend
WORKDIR /app/backend
RUN python3 -m venv venv && \
    ./venv/bin/pip install --upgrade pip && \
    ./venv/bin/pip install -r requirements.txt && \
    ./venv/bin/python -m spacy download en_core_web_sm

# Expose ports
EXPOSE 5173 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV ENABLE_DKG_LOOKUP=0

# Run both services
WORKDIR /app
CMD bash -c "cd /app/backend && source venv/bin/activate && ENABLE_DKG_LOOKUP=0 uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 & cd /app/frontend && npm run dev -- --host 0.0.0.0 --port 5173 & wait"
