# Submission Notes for Judges

## Important: DKG Node Plugin Integration

Parallelpedia includes a custom plugin for the OriginTrail DKG Node that enables Community Notes functionality. This plugin is **required** for the application to work.

### What We Modified

1. **Created Custom Plugin**: `dkg-node/packages/plugin-parallelpedia/`
   - Provides MCP tools for AI agents to query Community Notes
   - Exposes REST API endpoints for Community Notes management
   - Handles publishing Community Notes as Knowledge Assets

2. **Modified DKG Node**: 
   - `dkg-node/apps/agent/src/server/index.ts` - Registered our plugin
   - `dkg-node/apps/agent/package.json` - Added plugin dependency

### Two Setup Options

#### Option 1: Use Our Pre-configured DKG Node (Recommended)

We've included a modified DKG Node in the `dkg-node/` directory with our plugin already integrated. Simply:

```bash
cd dkg-node/apps/agent
npm install
npm run build:scripts
npm run script:setup
npm run dev
```

#### Option 2: Integrate Plugin into Fresh DKG Node

If you prefer to use a fresh DKG Node clone:

1. Clone the official DKG Node repository
2. Copy `dkg-node/packages/plugin-parallelpedia/` to the DKG Node's `packages/` directory
3. Follow the integration steps in `SETUP.md`

### What's Included in Submission

✅ **Included in Repository**:
- `backend/` - Complete FastAPI backend
- `frontend/` - Complete React frontend  
- `dkg-node/packages/plugin-parallelpedia/` - Our custom plugin
- `dkg-node/apps/agent/src/server/index.ts` - Modified server file
- `dkg-node/apps/agent/package.json` - Modified package.json
- Documentation files

❌ **Not Included** (gitignored, will be generated):
- `dkg-node/node_modules/` - Install with `npm install`
- `dkg-node/apps/agent/node_modules/` - Install with `npm install`
- `dkg-node/apps/agent/dkg.db` - Created during setup
- `backend/venv/` - Created during setup
- `.env` files - Created during setup

### Quick Verification

After setup, verify everything works:

```bash
# 1. DKG Node health
curl http://localhost:9200/health

# 2. Parallelpedia plugin endpoint
curl http://localhost:9200/parallelpedia/community-notes

# 3. Backend health
curl http://localhost:8000/api/health

# 4. Frontend
open http://localhost:5173
```

### Challenge Requirements Met

✅ **Data Retrieval**: Backend fetches from Grokipedia (DKG) and Wikipedia  
✅ **Content Comparison**: Comparison service analyzes articles  
✅ **Discrepancy Identification**: Detects conflicts, missing context, unsupported claims  
✅ **Community Notes Creation**: Generates structured Community Notes  
✅ **Publishing to DKG**: Publishes as Knowledge Assets via our plugin  
✅ **MCP Integration**: Plugin provides MCP tools for AI agents  
⏳ **Trust Metrics**: Structure ready, tokenomics can be added  
⏳ **x402 Monetization**: Can be added as extension

### Key Features Demonstrated

1. **Decentralized Knowledge Storage**: Community Notes published to OriginTrail DKG
2. **AI Agent Integration**: MCP tools allow AI agents to query Community Notes
3. **Trust Layer**: Verifiable Community Notes provide context for AI systems
4. **Full-Stack Application**: Complete web UI for comparison and publishing

### Questions?

- See `SETUP.md` for detailed setup instructions
- See `INTEGRATION_GUIDE.md` for technical details
- See `README.md` for project overview

