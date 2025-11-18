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
# Edit .env with your settings (see Environment Variables section below)
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DKG_BASE_URL` | URL of your DKG node | `http://localhost:9200` | No |
| `OPENAI_API_KEY` | OpenAI API key for enhanced LLM features | None | No (recommended) |
| `USE_LLM_CLASSIFICATION` | Enable GPT-4 classification (`"1"` or `"0"`) | `"1"` | No |
| `COMPARE_MAX_SEGMENTS` | Maximum segments per article for performance | `300` | No |
| `LLM_BATCH_SIZE` | Number of segments to process in each LLM batch | `10` | No |
| `ENABLE_DKG_LOOKUP` | Enable DKG SPARQL lookup for Grokipedia articles (`"1"` or `"0"`) | `"1"` | No |
| `GROKIPEDIA_API_BASE` | Base URL for unofficial Grokipedia API | `https://grokipedia-api.com` | No |

6. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Architecture

The backend consists of four main services:

1. **ArticleService** (`app/services/articles.py`): Fetches articles from Grokipedia and Wikipedia
2. **ComparisonService** (`app/services/comparison.py`): Compares articles using multi-layered analysis
3. **DKGClient** (`app/services/dkg_client.py`): Interacts with OriginTrail DKG for publishing and querying
4. **LLMClient** (`app/services/llm_client.py`): Provides embeddings and classification via OpenAI

Services are initialized at application startup and shared across requests.

## How Articles Are Fetched

### Grokipedia Articles

The system tries multiple methods in order:

1. **DKG Knowledge Assets** (if `ENABLE_DKG_LOOKUP=1`):
   - Queries DKG via SPARQL to find articles by `topicId`
   - Fetches the Knowledge Asset using the UAL
   - Extracts content from various JSON-LD structures

2. **Unofficial API** (if `GROKIPEDIA_API_BASE` is set):
   - Attempts to fetch from `{GROKIPEDIA_API_BASE}/page/{topic_id}`
   - Extracts content from JSON response

3. **HTML Scraping**:
   - Tries multiple URL formats: `/page/{topic}`, `/{topic}`, with/without encoding
   - Parses HTML using BeautifulSoup
   - Extracts content from common article selectors

4. **Placeholder Fallback**:
   - Returns a placeholder article if all methods fail
   - Allows the comparison system to work even when Grokipedia is inaccessible

**Topic ID Format**: Use underscores (e.g., `Climate_change`). The system will try various URL encodings automatically.

### Wikipedia Articles

1. **Wikimedia REST API**:
   - Uses `https://en.wikipedia.org/api/rest_v1/page/html/{topic_id}`
   - Parses HTML and extracts clean text
   - Removes navigation, infoboxes, references, and other noise
   - Preserves headings and paragraph structure

2. **Topic ID Format**: 
   - Accepts both underscored (`Climate_change`) and spaced (`Climate change`) formats
   - Automatically normalizes and URL-encodes

## Enhanced Comparison Features

The comparison system uses a **multi-layered approach** combining:

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

### How Comparison Works (Detailed Algorithm)

1. **Text Segmentation**:
   - Splits both articles into sentence-level segments using spaCy (or regex fallback)
   - Limits to `COMPARE_MAX_SEGMENTS` segments per article (default: 300)

2. **Embedding Generation**:
   - Generates embeddings for all segments using:
     - **Primary**: OpenAI `text-embedding-3-small` (if `OPENAI_API_KEY` is set)
     - **Fallback**: sentence-transformers `all-MiniLM-L6-v2`
     - **Last Resort**: TF-IDF vectorization

3. **Similarity Matching**:
   - Computes cosine similarity between Grokipedia and Wikipedia segment embeddings
   - For each Grokipedia segment, finds the best-matching Wikipedia segment

4. **Multi-Signal Classification**:
   For each Grokipedia segment, the system:
   - Extracts named entities (people, orgs, places, dates, numbers)
   - Compares entities with the matched Wikipedia segment
   - Detects date conflicts (different years for same topic)
   - Detects number conflicts (same context, different statistics)
   - Checks for missing citations
   - Optionally uses GPT-4o-mini for final classification (if `USE_LLM_CLASSIFICATION=1`)

5. **Segment Labeling**:
   Each segment is classified into one of four categories:
   - **ALIGNED** (similarity ≥ 0.7): Content matches Wikipedia closely
   - **MISSING_CONTEXT** (similarity 0.3-0.7): Related but missing details
   - **CONFLICT** (similarity 0.1-0.3 + detected issues): Contradictory facts
   - **UNSUPPORTED** (similarity < 0.1): Content not found in Wikipedia

6. **Trust Score Calculation**:
   ```
   trust_score = Σ(weight × (0.5 + 0.5 × similarity)) / Σ|weight| × 100
   
   Weights:
   - ALIGNED: +1.0
   - MISSING_CONTEXT: +0.6
   - CONFLICT: -0.5
   - UNSUPPORTED: +0.3
   ```
   Final score is clamped to 0-100.

7. **Summary Generation**:
   - Analyzes label distribution and trust score
   - Generates human-readable summary highlighting key findings

### Configuration

- `USE_LLM_CLASSIFICATION=1`: Enable GPT-4 classification (recommended)
- `COMPARE_MAX_SEGMENTS=300`: Limit segments per article for performance
- `LLM_BATCH_SIZE=10`: Number of segments to process in each LLM batch

## How Community Notes Are Published

### Publishing Flow

1. **Comparison**: The system first runs a comparison analysis (same as `/compare` endpoint)

2. **Community Note Creation**:
   - Extracts trust score, summary, and label counts from analysis
   - Selects top 5 segment comparisons as key examples
   - Creates a `CommunityNote` object

3. **Provenance Generation**:
   - Creates provenance metadata including:
     - `createdBy`: "Parallelpedia"
     - `version`: "1.0.0"
     - `inputHash`: SHA-256 hash of input data
     - `sources`: URLs of both Grokipedia and Wikipedia articles

4. **DKG Publishing**:
   - Sends Community Note to DKG Node via `POST /parallelpedia/community-notes`
   - DKG Node plugin converts to JSON-LD format
   - Publishes as Knowledge Asset to OriginTrail DKG
   - Returns UAL (Unique Asset Locator)

5. **Response**:
   - Returns success status, UAL, and verification URL
   - UAL can be used to query the asset later

### Timeout Handling

- DKG publishing can take 60-900 seconds (blockchain operations)
- HTTP client timeout: 15 minutes for read operations
- If timeout occurs, the request fails gracefully with an error message

## API Endpoints

### Root & Health

#### `GET /`
Root endpoint returning API information.

**Response:**
```json
{
  "name": "Parallelpedia API",
  "version": "1.0.0",
  "description": "Auditing AI encyclopedias, one article at a time."
}
```

#### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "article_service": true,
    "comparison_service": true,
    "dkg_client": true
  }
}
```

### Article Endpoints

#### `GET /api/topics/{topic_id}/grok`
Fetch Grokipedia article for a topic.

**Parameters:**
- `topic_id` (path): Topic identifier (e.g., `Climate_change`)

**Response:** `Article` object
```json
{
  "topic_id": "Climate_change",
  "title": "Climate Change",
  "source": "grok",
  "raw_text": "Article content...",
  "url": "https://grokipedia.com/page/Climate_change"
}
```

**Errors:**
- `404`: Article not found
- `503`: Service not initialized

#### `GET /api/topics/{topic_id}/wikipedia`
Fetch Wikipedia article for a topic.

**Parameters:**
- `topic_id` (path): Topic identifier (e.g., `Climate_change`)

**Response:** `Article` object (same structure as above, `source: "wikipedia"`)

**Errors:**
- `404`: Article not found
- `503`: Service not initialized

### Comparison Endpoint

#### `POST /api/topics/{topic_id}/compare`
Compare Grokipedia and Wikipedia articles.

**Parameters:**
- `topic_id` (path): Topic identifier

**Response:** `TopicAnalysis` object
```json
{
  "topic_id": "Climate_change",
  "grok_title": "Climate Change",
  "wiki_title": "Climate Change",
  "trust_score": 75.5,
  "summary": "High trust score: Content is largely aligned with Wikipedia.",
  "segment_comparisons": [
    {
      "segment_id": "Climate_change_seg_0",
      "text": "Segment text...",
      "label": "aligned",
      "similarity_score": 0.85,
      "matched_wiki_sentences": ["Matching Wikipedia sentence..."]
    }
  ],
  "labels_count": {
    "aligned": 45,
    "missing_context": 12,
    "conflict": 3,
    "unsupported": 5
  }
}
```

**Errors:**
- `404`: One or both articles not found
- `422`: Insufficient content (< 50 characters)
- `500`: Error during comparison
- `503`: Service not initialized

### Community Note Endpoints

#### `POST /api/topics/{topic_id}/community-note`
Publish a Community Note to DKG.

**Parameters:**
- `topic_id` (path): Topic identifier

**Response:**
```json
{
  "success": true,
  "ual": "did:dkg:0x1234...",
  "asset_id": "did:dkg:0x1234...",
  "community_note": {
    "topic_id": "Climate_change",
    "trust_score": 75.5,
    "summary": "Summary...",
    "labels_count": {"aligned": 45, "conflict": 3},
    "key_examples": [...],
    "grok_title": "Climate Change",
    "wiki_title": "Climate Change"
  },
  "verification_url": "http://localhost:9200/api/dkg/assets?ual=did:dkg:0x1234..."
}
```

**Errors:**
- `404`: Articles not found
- `500`: Failed to publish to DKG (check DKG node logs)
- `503`: Service not initialized

**Note:** This endpoint may take several minutes due to blockchain operations.

#### `GET /api/topics/{topic_id}/community-note`
Get a Community Note from DKG (MCP endpoint).

**Parameters:**
- `topic_id` (path): Topic identifier

**Response:** `CommunityNote` object

**Errors:**
- `404`: Community note not found
- `503`: Service not initialized

## Error Handling

### Common Error Scenarios

1. **Article Not Found (404)**:
   - Grokipedia: Article doesn't exist, not accessible, or may be in DKG
   - Wikipedia: Check topic name format (use underscores)

2. **Insufficient Content (422)**:
   - Article has less than 50 characters
   - Cannot perform meaningful comparison

3. **DKG Publishing Timeout**:
   - Blockchain operations can take 15+ minutes
   - Check DKG node logs for details
   - Verify DKG node is running and connected

4. **Service Not Initialized (503)**:
   - Services failed to initialize at startup
   - Check logs for initialization errors
   - Verify environment variables and dependencies

## Documentation

Interactive API documentation available at:
- **Swagger UI**: `http://localhost:8000/docs` (recommended)
- **ReDoc**: `http://localhost:8000/redoc`

Both provide:
- Complete endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Example requests and responses

