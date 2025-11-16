# Parallelpedia Backend

FastAPI backend for comparing Grokipedia and Wikipedia articles.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

   **Optional**: For enhanced LLM-based comparison features (better accuracy):
```bash
pip install -r requirements-optional.txt
# Then set OPENAI_API_KEY in your .env file
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
# Edit .env with your settings:
# - DKG_BASE_URL: URL of your DKG node (default: http://localhost:9200)
# - OPENAI_API_KEY: Optional, only needed for advanced LLM features
```

4. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `GET /api/topics/{topic_id}/grok` - Get Grokipedia article
- `GET /api/topics/{topic_id}/wikipedia` - Get Wikipedia article
- `POST /api/topics/{topic_id}/compare` - Compare articles
- `POST /api/topics/{topic_id}/community-note` - Publish Community Note to DKG
- `GET /api/topics/{topic_id}/community-note` - Get Community Note (MCP endpoint)

## Documentation

API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

