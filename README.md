<p align="left">
  <img src="frontend/src/logo/logo.png" alt="Parallelpedia" width="200px" height="200px" />
</p>

# Parallelpedia

**Auditing AI encyclopedias, one article at a time.**

Parallelpedia compares Grokipedia and Wikipedia on sensitive topics, detects bias and hallucinations, and publishes machine-readable Community Notes as Knowledge Assets on OriginTrail DKG so AI agents can use more trustworthy knowledge.

## 📑 Table of Contents

- [What It Does](#-what-it-does)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Set Up DKG Node with Plugin](#step-2-set-up-dkg-node-with-plugin)
  - [Step 3: Start DKG Node](#step-3-start-dkg-node)
  - [Step 4: Set Up Backend](#step-4-set-up-backend)
  - [Step 5: Start Backend](#step-5-start-backend)
  - [Step 6: Set Up Frontend](#step-6-set-up-frontend)
  - [Step 7: Use the Application](#step-7-use-the-application)
- [Complete Setup Checklist](#-complete-setup-checklist)
- [Architecture](#️-architecture)
- [How Publishing Works](#-how-publishing-works)
  - [Architecture Flow](#architecture-flow)
  - [Publishing Process](#publishing-process)
  - [Plugin Location](#plugin-location)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

## 🎯 What It Does

Parallelpedia is a full-stack application that:
- **Fetches** articles from Grokipedia and Wikipedia
- **Compares** them using multi-layered analysis (semantic embeddings, NER, fact extraction, LLM classification)
- **Detects** aligned content, missing context, conflicts, and unsupported claims
- **Calculates** trust scores (0-100) based on segment classifications
- **Publishes** Community Notes to OriginTrail DKG as Knowledge Assets
- **Provides** MCP tools for AI agents to query published notes

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 22
- **Python** 3.10+
- **npm** package manager
- **Turbo** CLI: `npm i -g turbo`
- **OpenAI API key** (optional, but recommended for best results)

### Step 1: Clone the Repository

```bash
git clone https://github.com/denishotii/Parallelpedia.git
cd Parallelpedia
```

### Step 2: Clone and Set Up DKG Plugin

The Parallelpedia plugin is **not included by default** in the DKG Node and must be cloned separately from its repository:

```bash
# Clone the Parallelpedia DKG plugin repository
cd dkg-node/packages
git clone https://github.com/denishotii/dkg-plugin-parallelpedia.git
cd dkg-plugin-parallelpedia

# Install plugin dependencies
npm install

# Build the plugin
npm run build

# Go back to dkg-node root directory
cd ../
```



**Important**: The plugin must be registered in `dkg-node/apps/agent/src/server/index.ts`. See the [plugin repository](https://github.com/denishotii/dkg-plugin-parallelpedia) for registration instructions.

### Step 3: Start DKG Node

```bash
cd dkg-node
dkg-cli run-dev
```

The DKG node will be available at:
- **API/MCP Server**: `http://localhost:9200`
- **Frontend UI**: `http://localhost:8081` (optional)

**Keep this terminal running!**

### Step 4: Set Up Backend

Open a **new terminal**:

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install spaCy English model (for NLP)
python -m spacy download en_core_web_sm

# Configure environment
cp .env.example .env
# Edit .env with your settings:
# - DKG_BASE_URL=http://localhost:9200
# - OPENAI_API_KEY=your-key-here (optional but recommended)
```

### Step 5: Start Backend

```bash
# Make sure virtual environment is activated
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend API will be available at `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

**Keep this terminal running!**

### Step 6: Set Up Frontend

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# (Optional) Configure API URL if backend is on different port
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Step 7: Use the Application

1. Open `http://localhost:5173` in your browser
2. Enter a topic (e.g., "Elon_Musk", "Climate_change", "Artificial_intelligence")
3. Click "Compare" to analyze
4. Review the trust score and segment analysis
5. Click "Publish Community Note" to publish to DKG

## 📋 Complete Setup Checklist

- [ ] Node.js >= 22 installed
- [ ] Python 3.10+ installed
- [ ] Turbo CLI installed (`npm i -g turbo`)
- [ ] Main repository cloned (`git clone https://github.com/denishotii/Parallelpedia.git`)
- [ ] DKG plugin cloned (`git clone https://github.com/denishotii/dkg-plugin-parallelpedia.git`)
- [ ] DKG plugin built (`cd dkg-plugin-parallelpedia && npm install && npm run build`)
- [ ] Plugin copied to DKG Node (`cp -r dkg-plugin-parallelpedia dkg-node/packages/`)
- [ ] DKG Node dependencies installed (`cd dkg-node && npm install`)
- [ ] DKG Node configured (`cd dkg-node/apps/agent && npm run script:setup`)
- [ ] DKG Node running (`cd dkg-node/apps/agent && npm run dev`)
- [ ] Backend dependencies installed (`cd backend && pip install -r requirements.txt`)
- [ ] Backend configured (`.env` file created)
- [ ] Backend running (`cd backend && uvicorn app.main:app --reload`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Frontend running (`cd frontend && npm run dev`)

## 🏗️ Architecture

```
┌─────────┐         ┌──────────────┐         ┌──────────┐         ┌─────────────┐
│ Frontend│ ──────> │   Backend    │ ──────> │ DKG Node │ ──────> │  OT-Node   │
│  :5173  │         │  (FastAPI)   │         │  :9200   │         │  (Remote)  │
│         │         │    :8000     │         │          │         │   :8900    │
└─────────┘         └──────────────┘         └──────────┘         └─────────────┘
```

### Components

- **Frontend** (React + Vite + TypeScript): Web UI for article comparison
- **Backend** (FastAPI + Python): Article fetching, comparison analysis, DKG publishing
- **DKG Plugin** (`@dkg/plugin-parallelpedia`): MCP tools and REST API for Community Notes
- **DKG Node**: OriginTrail DKG Edge Node with plugin integration

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

The Parallelpedia plugin must be cloned from its repository: [https://github.com/denishotii/dkg-plugin-parallelpedia](https://github.com/denishotii/dkg-plugin-parallelpedia)

After cloning and integration, the plugin is located at:
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

See [`JSON-LD_Example_Structure.md`](JSON-LD_Example_Structure.md) for example Community Note structures.

## 🔌 API Endpoints

### Backend API (`http://localhost:8000`)

- `GET /api/topics/{topic_id}/grok` - Get Grokipedia article
- `GET /api/topics/{topic_id}/wikipedia` - Get Wikipedia article
- `POST /api/topics/{topic_id}/compare` - Compare articles and generate analysis
- `POST /api/topics/{topic_id}/community-note` - Publish Community Note to DKG
- `GET /api/topics/{topic_id}/community-note` - Get Community Note
- `GET /api/health` - Health check
- **Swagger UI**: `http://localhost:8000/docs`

### DKG Plugin API (`http://localhost:9200`)

- `GET /parallelpedia/community-notes/:topicId` - Get Community Note
- `GET /parallelpedia/community-notes` - Search Community Notes (query params: `keyword`, `minTrustScore`, `maxTrustScore`, `limit`)
- `POST /parallelpedia/community-notes` - Publish Community Note
- **Swagger UI**: `http://localhost:9200/api-docs`

### MCP Tools (for AI Agents)

- `parallelpedia-get-community-note` - Get Community Note by topic ID
- `parallelpedia-search-community-notes` - Search Community Notes with filters

## 🧪 Testing

### Verify Everything Works

1. **Check DKG Node**:
   ```bash
   curl http://localhost:9200/api/health
   ```

2. **Check Backend**:
   ```bash
   curl http://localhost:8000/api/health
   ```

3. **Test Plugin Endpoint**:
   ```bash
   curl http://localhost:9200/parallelpedia/community-notes/Elon_Musk
   ```

4. **Open Frontend**: `http://localhost:5173`

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

## 🎨 Key Features

- ✅ **Multi-layered Analysis**: Semantic embeddings, NER, fact extraction, LLM classification
- ✅ **Four-Tier Classification**: Aligned, Missing Context, Conflict, Unsupported
- ✅ **Trust Score Calculation**: Weighted algorithm (0-100)
- ✅ **DKG Publishing**: One-click publishing to OriginTrail DKG blockchain
- ✅ **MCP Tools**: AI agents can query Community Notes
- ✅ **Interactive UI**: Side-by-side comparison with color-coded highlights
- ✅ **JSON-LD Format**: Structured data using schema.org vocabulary

## 🔧 Troubleshooting

### DKG Node Not Starting

- Check that all dependencies are installed: `cd dkg-node && npm install`
- Verify plugin is built: `cd packages/dkg-plugin-parallelpedia && npm run build`
- Check environment variables in `apps/agent/.env`
- Ensure port 9200 is not in use

### Backend Connection Errors

- Verify DKG Node is running: `curl http://localhost:9200/api/health`
- Check `DKG_BASE_URL` in `backend/.env` (should be `http://localhost:9200`)
- Check backend logs for detailed error messages

### Publishing Fails

- Verify wallet has testnet tokens (NEURO) for gas fees
- Check `DKG_OTNODE_URL` is accessible
- Verify `DKG_PUBLISH_WALLET` contains valid private key
- Check DKG Node logs for detailed error messages

### Frontend Not Loading

- Verify backend is running: `curl http://localhost:8000/api/health`
- Check browser console for errors
- Verify `VITE_API_URL` in `frontend/.env` matches backend URL

## 📝 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- OriginTrail DKG for decentralized knowledge storage
- Wikipedia for open knowledge
- Grokipedia for AI-generated content comparison
