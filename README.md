# Parallelpedia

**Auditing AI encyclopedias, one article at a time.**

Parallelpedia compares Grokipedia and Wikipedia on sensitive topics, detects bias and hallucinations, and publishes machine-readable Community Notes as Knowledge Assets on OriginTrail so AI agents can use more trustworthy knowledge.

## 🎯 Project Overview

Parallelpedia is a full-stack application that:
1. Fetches topics from Grokipedia (via OriginTrail DKG Knowledge Assets)
2. Fetches corresponding Wikipedia articles
3. Compares content and detects:
   - ✅ Aligned claims
   - ⚠️ Missing context
   - ✗ Factual conflicts
   - ? Unsupported claims
4. Generates trust scores and Community Notes
5. Publishes Community Notes to OriginTrail DKG as Knowledge Assets
6. Provides a web UI for side-by-side comparison
7. Exposes an API endpoint for AI agents (via MCP)

## 🏗️ Architecture

- **Backend**: FastAPI (Python) - REST API for article fetching, comparison, and DKG publishing
- **Frontend**: React + Vite + TypeScript - Modern web UI with TailwindCSS
- **DKG Integration**: OriginTrail DKG Node for Knowledge Asset management
- **LLM**: OpenAI (abstracted for easy provider switching)

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

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings:
# - DKG_BASE_URL: URL of your DKG node (default: http://localhost:9200)
# - OPENAI_API_KEY: Optional, only if you installed optional dependencies for enhanced comparison
```

5. Start the backend server:
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

### DKG Node Setup

The DKG node is already set up in the `dkg-node/` directory. See `dkg-node/README.md` for detailed setup instructions.

Make sure the DKG node is running on `http://localhost:9200` (default).

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

### Article Endpoints
- `GET /api/topics/{topic_id}/grok` - Get Grokipedia article
- `GET /api/topics/{topic_id}/wikipedia` - Get Wikipedia article

### Analysis Endpoints
- `POST /api/topics/{topic_id}/compare` - Compare articles and generate analysis

### DKG Endpoints
- `POST /api/topics/{topic_id}/community-note` - Publish Community Note to DKG
- `GET /api/topics/{topic_id}/community-note` - Get Community Note (MCP endpoint)

### Utility
- `GET /api/health` - Health check

See `http://localhost:8000/docs` for interactive API documentation.

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
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models.py       # Pydantic models
│   │   ├── main.py         # FastAPI app
│   │   └── services/       # Business logic
│   │       ├── articles.py
│   │       ├── comparison.py
│   │       ├── dkg_client.py
│   │       └── llm_client.py
│   ├── requirements.txt
│   └── README.md
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   └── App.tsx        # Main app
│   ├── package.json
│   └── README.md
├── dkg-node/              # OriginTrail DKG Node
└── README.md
```

## 🎨 Features

- ✅ Side-by-side article comparison
- ✅ Color-coded segment analysis (aligned/missing/conflict/unsupported)
- ✅ Trust score calculation (0-100)
- ✅ Community Note generation
- ✅ DKG Knowledge Asset publishing
- ✅ MCP-compatible API endpoint
- ✅ Responsive web UI

## 🔮 Future Enhancements

- [ ] Real Grokipedia article fetching from DKG
- [ ] Advanced LLM-based comparison
- [ ] Historical trust score tracking
- [ ] Batch topic processing
- [ ] Export reports (PDF/JSON)
- [ ] Citation verification
- [ ] Bias detection algorithms

## 📝 License

MIT License - see LICENSE file

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 🙏 Acknowledgments

- OriginTrail DKG for decentralized knowledge storage
- Wikipedia for open knowledge
- Grokipedia for AI-generated content comparison 
