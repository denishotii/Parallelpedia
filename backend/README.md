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

3. Install spaCy English model (for better NLP):
```bash
python -m spacy download en_core_web_sm
```

   **Note**: If spaCy model installation fails, the system will fall back to regex-based sentence splitting.

4. Set up OpenAI API key (recommended for best results):
   - Get your API key from https://platform.openai.com/api-keys
   - Add it to your `.env` file:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ```
   
   **Why OpenAI?** The enhanced comparison system uses:
   - GPT-4o-mini for intelligent segment classification
   - OpenAI embeddings (text-embedding-3-small) for semantic similarity
   - Better detection of conflicts, missing context, and hallucinations
   
   **Fallback**: If OpenAI is not configured, the system uses:
   - sentence-transformers for embeddings (still good quality)
   - Similarity-based classification (works but less accurate)

5. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
# Edit .env with your settings:
# - DKG_BASE_URL: URL of your DKG node (default: http://localhost:9200)
# - OPENAI_API_KEY: Recommended for enhanced LLM features
# - USE_LLM_CLASSIFICATION: Set to "1" to enable GPT-4 classification (default: "1")
# - COMPARE_MAX_SEGMENTS: Max segments per article (default: 300)
```

6. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Enhanced Comparison Features

The comparison system now uses a **multi-layered approach** combining:

### Tier 1: Core Enhancements
- **Semantic Embeddings**: OpenAI or sentence-transformers for understanding meaning, not just word matching
- **Better Sentence Segmentation**: spaCy-based NLP for accurate sentence boundaries
- **LLM Classification**: GPT-4o-mini for intelligent segment classification

### Tier 2: Advanced Analysis
- **Named Entity Recognition (NER)**: Compares people, organizations, places, dates
- **Fact Extraction**: Identifies and compares structured factual claims
- **Citation Analysis**: Detects missing citations and unsourced claims
- **Temporal Analysis**: Compares dates, timelines, and detects temporal conflicts
- **Number/Statistics Comparison**: Flags conflicting numbers and statistics

### How It Works

1. **Semantic Similarity**: Uses embeddings to find the best matching Wikipedia segment for each Grokipedia segment
2. **Multi-Signal Analysis**: Combines similarity scores with entity matching, date comparison, and citation checks
3. **LLM Classification**: GPT-4 analyzes segments to detect subtle conflicts, missing context, and hallucinations
4. **Smart Classification**: Reduces false positives by using multiple signals instead of just similarity scores

### Configuration

- `USE_LLM_CLASSIFICATION=1`: Enable GPT-4 classification (recommended)
- `COMPARE_MAX_SEGMENTS=300`: Limit segments per article for performance
- `LLM_BATCH_SIZE=10`: Number of segments to process in each LLM batch

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `GET /api/topics/{topic_id}/grok` - Get Grokipedia article
- `GET /api/topics/{topic_id}/wikipedia` - Get Wikipedia article
- `POST /api/topics/{topic_id}/compare` - Compare articles (now with enhanced analysis)
- `POST /api/topics/{topic_id}/community-note` - Publish Community Note to DKG
- `GET /api/topics/{topic_id}/community-note` - Get Community Note (MCP endpoint)

## Documentation

API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

