# Parallelpedia Setup Guide for Judges

This guide will help you set up and run Parallelpedia for evaluation.

## Prerequisites

- **Node.js** >= 22
- **Python** 3.10+
- **npm** package manager
- **Turbo** CLI (install globally: `npm i -g turbo`)

## Quick Start

### 1. Clone and Setup DKG Node

The Parallelpedia plugin needs to be integrated into a DKG Node. We provide setup instructions for this:

```bash
# Clone the DKG Node repository (if you don't have it)
git clone https://github.com/OriginTrail/dkg-node.git parallelpedia-dkg-node
cd parallelpedia-dkg-node

# Install dependencies
npm install

# Copy our plugin to the DKG Node
cp -r ../Parallelpedia/dkg-node/packages/plugin-parallelpedia packages/

# Install the plugin in the agent
cd apps/agent
npm install --save @dkg/plugin-parallelpedia@file:../../packages/plugin-parallelpedia

# Register the plugin (already done in our modified files)
# The plugin is registered in src/server/index.ts

# Build the plugin
cd ../../packages/plugin-parallelpedia
npm install
npm run build

# Go back to agent and build
cd ../../apps/agent
npm run build:server
```

### 2. Configure DKG Node

```bash
cd apps/agent
npm run build:scripts
npm run script:setup
```

You'll be prompted for:
- `DATABASE_URL`: Use default `dkg.db`
- `OPENAI_API_KEY`: Your OpenAI API key (optional, for LLM features)
- `DKG_PUBLISH_WALLET`: Private key for publishing to DKG
- `DKG_BLOCKCHAIN`: Use `hardhat1:31337` for local dev or `otp:20430` for testnet
- `DKG_OTNODE_URL`: Use `http://localhost:8900` for local or testnet URL
- `PORT`: Default `9200`
- `EXPO_PUBLIC_APP_URL`: Default `http://localhost:9200`
- `EXPO_PUBLIC_MCP_URL`: Default `http://localhost:9200`

### 3. Start DKG Node

```bash
cd apps/agent
npm run dev
```

The DKG node will run on:
- **Frontend/UI**: http://localhost:8081
- **API/MCP Server**: http://localhost:9200

### 4. Setup Backend

```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Optional: For enhanced LLM comparison
pip install -r requirements-optional.txt

# Create .env file
cat > .env << EOF
DKG_BASE_URL=http://localhost:9200
OPENAI_API_KEY=your_key_here  # Optional
EOF

# Start backend
uvicorn app.main:app --reload --port 8000
```

### 5. Setup Frontend

```bash
cd ../frontend
npm install

# Create .env file (optional)
echo "VITE_API_URL=http://localhost:8000" > .env

# Start frontend
npm run dev
```

Frontend will be available at http://localhost:5173

## Alternative: Using Our Pre-configured DKG Node

If you prefer, you can use our modified DKG Node directly:

```bash
# From the Parallelpedia root directory
cd dkg-node/apps/agent
npm install
npm run build:scripts
npm run script:setup
npm run dev
```

**Note**: The `dkg-node` directory contains our custom plugin and modifications. The plugin is located at `dkg-node/packages/plugin-parallelpedia/`.

## Verification

1. **Check DKG Node is running**:
   ```bash
   curl http://localhost:9200/health
   ```

2. **Check Parallelpedia plugin**:
   ```bash
   curl http://localhost:9200/parallelpedia/community-notes
   ```
   Should return: `{"found":false,"count":0,"notes":[]}`

3. **Check Backend**:
   ```bash
   curl http://localhost:8000/api/health
   ```

4. **Check Frontend**: Open http://localhost:5173

## Using the Application

1. Open http://localhost:5173 in your browser
2. Enter a topic (e.g., "Climate_change", "Artificial_intelligence")
3. Click "Compare" to analyze Grokipedia vs Wikipedia
4. Review the trust score and segment analysis
5. Click "Publish Community Note" to publish to DKG
6. Query published notes via the DKG Node API or MCP

## MCP Integration

The DKG Node exposes MCP tools that AI agents can use:

- `parallelpedia-get-community-note` - Get Community Note for a topic
- `parallelpedia-search-community-notes` - Search Community Notes

Access via the chat interface at http://localhost:8081/chat

## Troubleshooting

### DKG Node Issues

- **Plugin not loading**: Make sure you built the plugin (`npm run build` in plugin directory)
- **Port conflicts**: Change `PORT` in `.env` file
- **Database errors**: Run `npm run script:setup` again

### Backend Issues

- **Cannot connect to DKG**: Check `DKG_BASE_URL` in backend `.env`
- **Publishing fails**: Verify DKG node is running and wallet is configured

### Frontend Issues

- **API errors**: Check `VITE_API_URL` matches backend URL
- **CORS errors**: Backend CORS is configured for `localhost:5173` and `localhost:3000`

## Project Structure

```
Parallelpedia/
├── backend/              # FastAPI backend
├── frontend/             # React frontend
├── dkg-node/             # Modified DKG Node with our plugin
│   └── packages/
│       └── plugin-parallelpedia/  # Our custom plugin
├── README.md
├── SETUP.md              # This file
└── INTEGRATION_GUIDE.md  # Detailed integration docs
```

## Key Files Modified in DKG Node

- `dkg-node/packages/plugin-parallelpedia/` - New plugin (entire directory)
- `dkg-node/apps/agent/src/server/index.ts` - Plugin registration
- `dkg-node/apps/agent/package.json` - Plugin dependency

## Support

For issues, check:
- DKG Node logs in terminal
- Backend logs
- Browser console for frontend errors
- `INTEGRATION_GUIDE.md` for detailed technical docs

