<p align="center">
  <img src="frontend/src/logo/logo-with-name.svg" alt="Parallelpedia" height="56" />
  <br />
  <sub><em>beta</em></sub>
</p>

# Parallelpedia

**Auditing AI encyclopedias, one article at a time.**

Parallelpedia compares Grokipedia and Wikipedia on sensitive topics, detects bias and hallucinations, and publishes machine-readable Community Notes as Knowledge Assets on OriginTrail so AI agents can use more trustworthy knowledge.

## 🎯 Project Overview

Parallelpedia is a full-stack application that:
1. **Fetches Articles**: Retrieves topics from Grokipedia (via DKG Knowledge Assets, API, or HTML scraping) and corresponding Wikipedia articles
2. **Multi-Layered Comparison**: Uses semantic embeddings, NER, fact extraction, and LLM classification to detect:
   - ✅ **Aligned** claims (similarity ≥ 0.7) - Content matches Wikipedia closely
   - ⚠️ **Missing Context** (similarity 0.3-0.7) - Related but missing important details
   - ✗ **Conflicts** (similarity 0.1-0.3 + detected issues) - Contradictory facts or different interpretations
   - ? **Unsupported** (similarity < 0.1) - Content not found in Wikipedia, potential hallucinations
3. **Trust Score Calculation**: Generates 0-100 trust scores based on segment classifications
4. **Community Notes**: Creates structured Community Notes with summaries, label counts, and key examples
5. **DKG Publishing**: Publishes Community Notes to OriginTrail DKG as Knowledge Assets with provenance
6. **Web UI**: Provides interactive side-by-side comparison with color-coded highlights and detailed analysis
7. **MCP Tools**: Exposes API endpoints and MCP tools for AI agents to query published Community Notes

## 🏗️ Architecture

Parallelpedia consists of three main components:

- **Backend** (FastAPI, Python): REST API for article fetching, multi-layered comparison analysis, and DKG publishing
  - Uses semantic embeddings (OpenAI or sentence-transformers)
  - Implements NER, fact extraction, citation analysis, and LLM classification
  - See [`backend/README.md`](backend/README.md) for detailed documentation

- **Frontend** (React + Vite + TypeScript): Modern web UI with TailwindCSS
  - Side-by-side article comparison with color-coded highlights
  - Interactive tooltips and synchronized scrolling
  - Trust score visualization and tabbed analysis views
  - See [`frontend/README.md`](frontend/README.md) for detailed documentation

- **DKG Plugin** (`@dkg/plugin-parallelpedia`): OriginTrail DKG Node plugin
  - MCP tools for AI agents to query Community Notes
  - REST API endpoints for publishing and querying
  - SPARQL-based search and retrieval
  - See [`dkg-node/packages/dkg-plugin-parallelpedia/README.md`](dkg-node/packages/dkg-plugin-parallelpedia/README.md) for detailed documentation

- **LLM Integration**: OpenAI (abstracted for easy provider switching)
  - GPT-4o-mini for intelligent segment classification
  - OpenAI embeddings for semantic similarity
  - Falls back to sentence-transformers or TF-IDF if OpenAI unavailable

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- OriginTrail DKG Node running (see `dkg-node/` directory)
- OpenAI API key (optional, for enhanced LLM-based comparison - app works without it using TF-IDF)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

   **Optional**: For enhanced LLM-based comparison (better accuracy):
```bash
pip install -r requirements-optional.txt
```

4. Install spaCy English model (for better NLP):
```bash
python -m spacy download en_core_web_sm
```

5. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings (see backend/README.md for all environment variables):
# - DKG_BASE_URL: URL of your DKG node (default: http://localhost:9200)
# - OPENAI_API_KEY: Optional, recommended for enhanced LLM-based comparison
# - USE_LLM_CLASSIFICATION: Enable GPT-4 classification (default: "1")
# - COMPARE_MAX_SEGMENTS: Max segments per article (default: 300)
```

6. Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

Backend API will be available at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure API URL:
```bash
# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env
```

4. Start development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`
<br />
Open the landing page at `/` and click “Open Live App” or go directly to `/app`.

### DKG Node Setup

The DKG node is already set up in the `dkg-node/` directory. See `dkg-node/README.md` for detailed setup instructions.

**Important**: The Parallelpedia plugin must be built and registered:
```bash
cd dkg-node/packages/dkg-plugin-parallelpedia
npm install
npm run build
```

The plugin is already registered in `apps/agent/src/server/index.ts` and will be automatically loaded when the DKG node starts.

**Configuration**: The DKG node requires environment variables:
- `DKG_OTNODE_URL`: OT-Node endpoint (e.g., `https://v6-pegasus-node-02.origin-trail.network:8900`)
- `DKG_BLOCKCHAIN`: Blockchain network (e.g., `otp:20430` for testnet)
- `DKG_PUBLISH_WALLET`: Wallet private key for publishing

Make sure the DKG node is running on `http://localhost:9200` (default).

See [`dkg-node/packages/dkg-plugin-parallelpedia/README.md`](dkg-node/packages/dkg-plugin-parallelpedia/README.md) for detailed plugin documentation.

## 📖 Usage

1. **Start DKG Node** (if not already running):
```bash
cd dkg-node/apps/agent
npm run dev
```

2. **Start Backend**:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

3. **Start Frontend**:
```bash
cd frontend
npm run dev
```

4. **Use the Application**:
   - Open `http://localhost:5173` in your browser
   - Enter a topic (e.g., "Climate_change", "Artificial_intelligence")
   - Click "Compare" to analyze
   - Review the trust score and segment analysis
   - Publish Community Note to DKG

## 🔌 API Endpoints

### Backend API (FastAPI)

**Article Endpoints:**
- `GET /api/topics/{topic_id}/grok` - Get Grokipedia article
- `GET /api/topics/{topic_id}/wikipedia` - Get Wikipedia article

**Analysis Endpoints:**
- `POST /api/topics/{topic_id}/compare` - Compare articles and generate analysis

**DKG Endpoints:**
- `POST /api/topics/{topic_id}/community-note` - Publish Community Note to DKG
- `GET /api/topics/{topic_id}/community-note` - Get Community Note (MCP endpoint)

**Utility:**
- `GET /` - Root endpoint
- `GET /api/health` - Health check

**Interactive Documentation:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

See [`backend/README.md`](backend/README.md) for detailed API documentation with request/response examples.

### DKG Plugin API

**Community Note Endpoints:**
- `GET /parallelpedia/community-notes/:topicId` - Get Community Note for a topic
- `GET /parallelpedia/community-notes` - Search Community Notes (query params: keyword, minTrustScore, maxTrustScore, limit)
- `POST /parallelpedia/community-notes` - Publish Community Note to DKG

**MCP Tools (for AI Agents):**
- `parallelpedia-get-community-note` - Get Community Note by topic ID
- `parallelpedia-search-community-notes` - Search Community Notes with filters

See [`dkg-node/packages/dkg-plugin-parallelpedia/README.md`](dkg-node/packages/dkg-plugin-parallelpedia/README.md) for detailed plugin API documentation.

## 📡 How Publishing Works

### Architecture Flow

```
┌─────────┐         ┌──────────────┐         ┌──────────┐         ┌─────────────┐
│ Frontend│ ──────> │   Backend    │ ──────> │ DKG Node │ ──────> │  OT-Node   │
│         │         │  (FastAPI)   │         │  Server  │         │ (Remote)   │
│         │         │  :8000       │         │  :9200   │         │  :8900     │
└─────────┘         └──────────────┘         └──────────┘         └─────────────┘
```

### Publishing Process

1. **Frontend/API Request**: User clicks "Publish Community Note" or calls `POST /api/topics/{topic_id}/community-note`

2. **Backend Processing**:
   - Backend creates a `CommunityNote` object with trust score, summary, labels, etc.
   - Backend calls `DKGClient.publish_community_note()` which sends a POST request to the DKG Node Server

3. **DKG Node Server** (`dkg-node/apps/agent`):
   - Receives request at `POST /parallelpedia/community-notes`
   - The **Parallelpedia Plugin** (`dkg-node/packages/dkg-plugin-parallelpedia`) handles this endpoint
   - Plugin converts the data to JSON-LD format
   - Plugin calls `ctx.dkg.asset.create()` to publish to the DKG

4. **OT-Node** (Remote):
   - DKG Node Server connects to the remote OT-Node (e.g., `https://v6-pegasus-node-02.origin-trail.network:8900`)
   - OT-Node publishes the asset to the blockchain
   - Returns a UAL (Unique Asset Locator) like `did:dkg:otp:20430:...`

5. **Response Chain**:
   - OT-Node → DKG Node Server → Backend → Frontend
   - Each step logs the UAL for verification

### Plugin Location

The Parallelpedia plugin is located at:
```
dkg-node/packages/dkg-plugin-parallelpedia/
├── src/
│   └── index.ts          # Main plugin code
├── dist/                 # Compiled JavaScript
├── README.md            # Plugin documentation
└── package.json
```

The plugin is registered in `dkg-node/apps/agent/src/server/index.ts` and provides:
- **MCP Tools**: For AI agents to query Community Notes
- **REST API Endpoints**: For publishing and querying Community Notes
- **SPARQL Query Support**: For searching published notes

### Standalone Plugin Repository

The plugin is also available as a separate GitHub repository for hackathon submission:

**Repository**: https://github.com/denishotii/dkg-plugin-parallelpedia

#### Cloning and Using the Plugin Standalone

If you want to use the plugin in your own DKG Node setup:

1. **Clone the plugin repository**:
   ```bash
   git clone https://github.com/denishotii/dkg-plugin-parallelpedia.git
   cd dkg-plugin-parallelpedia
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the plugin**:
   ```bash
   npm run build
   ```

4. **Install in your DKG Node**:
   ```bash
   # In your DKG Node project
   npm install ./path/to/dkg-plugin-parallelpedia
   # Or if published to npm:
   # npm install @dkg/plugin-parallelpedia
   ```

5. **Register in your DKG Node server** (`apps/agent/src/server/index.ts`):
   ```typescript
   import parallelpediaPlugin from "@dkg/plugin-parallelpedia";
   
   // In your plugin array:
   plugins: [
     // ... other plugins
     parallelpediaPlugin,
   ]
   ```

6. **Configure environment variables** in your DKG Node:
   ```bash
   DKG_OTNODE_URL=https://v6-pegasus-node-02.origin-trail.network:8900
   DKG_BLOCKCHAIN=otp:20430
   DKG_PUBLISH_WALLET=your_private_key_here
   ```

The plugin will automatically provide the `/parallelpedia/community-notes` endpoints once registered.

### Verifying Published Assets

After publishing, you'll receive a UAL (Unique Asset Locator). You can verify the asset:

```bash
# Using the DKG Node API
curl "http://localhost:9200/api/dkg/assets?ual=YOUR_UAL_HERE"

# Or via the plugin endpoint (if SPARQL is working)
curl "http://localhost:9200/parallelpedia/community-notes/TOPIC_ID"
```

**Note**: SPARQL queries on remote testnet OT-Nodes may not work immediately. Use the UAL method for reliable verification.

## 🧪 Testing

### Backend
```bash
cd backend
pytest  # When tests are added
```

### Frontend
```bash
cd frontend
npm test  # When tests are added
```

## 📁 Project Structure

```
Parallelpedia/
├── backend/                              # FastAPI backend
│   ├── app/
│   │   ├── models.py                     # Pydantic models
│   │   ├── main.py                       # FastAPI app
│   │   └── services/                     # Business logic
│   │       ├── articles.py               # Article fetching (Grokipedia/Wikipedia)
│   │       ├── comparison.py             # Multi-layered comparison engine
│   │       ├── dkg_client.py             # DKG integration client
│   │       └── llm_client.py             # LLM abstraction (OpenAI)
│   ├── requirements.txt
│   ├── requirements-optional.txt
│   └── README.md                         # Detailed backend documentation
├── frontend/                             # React frontend
│   ├── src/
│   │   ├── components/                   # React components
│   │   │   ├── HighlightedArticleView.tsx
│   │   │   ├── SegmentComparison.tsx
│   │   │   ├── TrustScore.tsx
│   │   │   └── DifferenceTooltip.tsx
│   │   ├── services/
│   │   │   └── api.ts                    # Backend API client
│   │   ├── pages/
│   │   │   └── LandingPage.tsx
│   │   ├── utils/
│   │   │   └── textHighlighting.ts      # Text highlighting logic
│   │   └── App.tsx                       # Main app component
│   ├── package.json
│   └── README.md                         # Detailed frontend documentation
├── dkg-node/                             # OriginTrail DKG Node
│   ├── packages/
│   │   └── dkg-plugin-parallelpedia/    # Parallelpedia DKG plugin
│   │       ├── src/
│   │       │   └── index.ts              # Plugin implementation
│   │       └── README.md                 # Detailed plugin documentation
│   └── apps/
│       └── agent/                        # DKG Node agent server
└── README.md                             # This file
```

**Documentation:**
- **Backend**: See [`backend/README.md`](backend/README.md) for architecture, API details, comparison algorithm, and setup
- **Frontend**: See [`frontend/README.md`](frontend/README.md) for component structure, UI features, and development guide
- **DKG Plugin**: See [`dkg-node/packages/dkg-plugin-parallelpedia/README.md`](dkg-node/packages/dkg-plugin-parallelpedia/README.md) for MCP tools, API endpoints, and DKG integration

## 🎨 Features

### Comparison Engine
- ✅ **Multi-layered Analysis**: Semantic embeddings, NER, fact extraction, citation analysis
- ✅ **LLM Classification**: GPT-4o-mini for intelligent segment classification (optional)
- ✅ **Four-Tier Classification**: Aligned, Missing Context, Conflict, Unsupported
- ✅ **Trust Score Calculation**: Weighted algorithm (0-100) based on segment classifications
- ✅ **Fallback Support**: Works without OpenAI using sentence-transformers or TF-IDF

### User Interface
- ✅ **Side-by-Side Comparison**: View Grokipedia and Wikipedia articles simultaneously
- ✅ **Color-Coded Highlights**: Visual indicators for different segment types
- ✅ **Interactive Tooltips**: Click segments to see detailed comparisons
- ✅ **Tabbed Analysis**: Filtered views (Evidence, Conflicts, Alignments)
- ✅ **Synchronized Scrolling**: Both articles scroll together for easy comparison
- ✅ **Responsive Design**: Works on desktop and mobile devices

### DKG Integration
- ✅ **Community Note Publishing**: One-click publishing to OriginTrail DKG blockchain
- ✅ **MCP Tools**: AI agents can query Community Notes via MCP tools
- ✅ **REST API**: Plugin exposes REST endpoints for querying and searching
- ✅ **SPARQL Queries**: Advanced search by keyword and trust score filters
- ✅ **Provenance Tracking**: Includes source URLs and input hashes

### Article Fetching
- ✅ **Multiple Sources**: DKG Knowledge Assets, API, HTML scraping, placeholder fallback
- ✅ **Wikipedia Integration**: Uses Wikimedia REST API with clean text extraction
- ✅ **Error Handling**: Graceful fallbacks when sources are unavailable

## 📚 Documentation

For detailed documentation on each component:

- **[Backend Documentation](backend/README.md)**: Architecture, API endpoints, comparison algorithm, environment variables, error handling
- **[Frontend Documentation](frontend/README.md)**: Component structure, UI features, API integration, development guide
- **[DKG Plugin Documentation](dkg-node/packages/dkg-plugin-parallelpedia/README.md)**: MCP tools, REST API, SPARQL queries, publishing flow, troubleshooting

## 🔮 Future Enhancements

- [ ] Enhanced Grokipedia article fetching from DKG Knowledge Assets
- [ ] Historical trust score tracking and trends
- [ ] Batch topic processing
- [ ] Export reports (PDF/JSON)
- [ ] Citation verification and source validation
- [ ] Advanced bias detection algorithms
- [ ] Real-time comparison updates
- [ ] Community voting on trust scores

## 📝 License

MIT License - see LICENSE file

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 🙏 Acknowledgments

- OriginTrail DKG for decentralized knowledge storage
- Wikipedia for open knowledge
- Grokipedia for AI-generated content comparison 
