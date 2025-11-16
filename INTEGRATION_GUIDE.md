# Parallelpedia DKG Integration Guide

This guide explains the integration between Parallelpedia and the OriginTrail DKG Node for the hackathon challenge.

## What Was Built

### 1. Parallelpedia Plugin (`@dkg/plugin-parallelpedia`)

A new plugin for the DKG Node that provides:

#### MCP Tools (for AI Agents)
- **`parallelpedia-get-community-note`** - Get a Community Note for a specific topic
- **`parallelpedia-search-community-notes`** - Search Community Notes by keyword or trust score

#### REST API Endpoints
- **`GET /parallelpedia/community-notes/:topicId`** - Get Community Note
- **`GET /parallelpedia/community-notes`** - Search Community Notes
- **`POST /parallelpedia/community-notes`** - Publish Community Note to DKG

### 2. Updated Backend DKG Client

The Python backend's `DKGClient` has been updated to:
- Use the Parallelpedia plugin API endpoints
- Properly publish Community Notes as Knowledge Assets
- Query Community Notes from the DKG

## Setup Instructions

### 1. Build and Install the Plugin

```bash
# Build the plugin
cd dkg-node/packages/plugin-parallelpedia
npm install
npm run build

# Install in agent (if not already done)
cd ../../apps/agent
npm install
```

### 2. Restart the DKG Node

The plugin is already registered in `apps/agent/src/server/index.ts`. After building, restart your DKG node:

```bash
cd dkg-node/apps/agent
npm run dev
```

The DKG node should now be running with the Parallelpedia plugin enabled.

### 3. Verify the Integration

Check that the plugin is loaded:

```bash
# Check API docs
curl http://localhost:9200/api-docs

# Test the endpoint
curl http://localhost:9200/parallelpedia/community-notes/Climate_change
```

## Usage

### From Backend (Python FastAPI)

The backend already uses the updated `DKGClient`:

```python
from app.services.dkg_client import DKGClient

client = DKGClient(base_url="http://localhost:9200")

# Publish a Community Note
ual = await client.publish_community_note(community_note)
print(f"Published with UAL: {ual}")

# Get a Community Note
note = await client.get_community_note("Climate_change")
if note:
    print(f"Trust Score: {note.trust_score}")
    print(f"Summary: {note.summary}")
```

### From MCP (AI Agents)

AI agents can now use the MCP tools:

```javascript
// Example: Get Community Note
const result = await mcp.callTool("parallelpedia-get-community-note", {
  topicId: "Climate_change"
});

// Example: Search Community Notes
const results = await mcp.callTool("parallelpedia-search-community-notes", {
  keyword: "climate",
  minTrustScore: 50,
  limit: 10
});
```

### From REST API

```bash
# Get Community Note
curl http://localhost:9200/parallelpedia/community-notes/Climate_change

# Search Community Notes
curl "http://localhost:9200/parallelpedia/community-notes?keyword=climate&minTrustScore=50"

# Publish Community Note
curl -X POST http://localhost:9200/parallelpedia/community-notes \
  -H "Content-Type: application/json" \
  -d '{
    "topicId": "Climate_change",
    "trustScore": 75.5,
    "summary": "Summary of findings...",
    "labelsCount": {"aligned": 10, "conflict": 2},
    "keyExamples": [{"text": "...", "label": "conflict"}],
    "grokTitle": "Climate Change",
    "wikiTitle": "Climate Change"
  }'
```

## Data Flow

1. **Backend compares articles** → Generates `CommunityNote` object
2. **Backend calls `DKGClient.publish_community_note()`** → Sends to DKG Node API
3. **DKG Node plugin receives request** → Converts to JSON-LD
4. **Plugin publishes to DKG** → Creates Knowledge Asset
5. **UAL returned** → Stored in backend/database
6. **AI agents query via MCP** → Plugin queries DKG and returns results

## Community Note Structure

Community Notes are stored as Knowledge Assets with this JSON-LD structure:

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "parallelpedia": "https://parallelpedia.org/schema/"
  },
  "@type": "CommunityNote",
  "topicId": "Climate_change",
  "trustScore": 75.5,
  "summary": "Summary of findings...",
  "labelsCount": {
    "aligned": 10,
    "missing_context": 2,
    "conflict": 1,
    "unsupported": 0
  },
  "keyExamples": [
    {
      "text": "Example discrepancy text...",
      "label": "conflict"
    }
  ],
  "grokTitle": "Climate Change",
  "wikiTitle": "Climate Change",
  "dateCreated": "2025-01-01T00:00:00Z"
}
```

## Testing the Integration

### 1. Start All Services

```bash
# Terminal 1: DKG Node
cd dkg-node/apps/agent
npm run dev

# Terminal 2: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 3: Frontend
cd frontend
npm run dev
```

### 2. Test Publishing

1. Open frontend: http://localhost:5173
2. Enter a topic (e.g., "Climate_change")
3. Click "Compare"
4. Review the analysis
5. Click "Publish Community Note"
6. Verify the UAL is returned

### 3. Test Querying

```bash
# Query via API
curl http://localhost:9200/parallelpedia/community-notes/Climate_change

# Query via backend
curl http://localhost:8000/api/topics/Climate_change/community-note
```

### 4. Test MCP Integration

Use the DKG Node's chat interface at http://localhost:8081/chat and ask:

- "Get the Community Note for Climate_change"
- "Search for Community Notes about climate"
- "What is the trust score for Climate_change?"

## Troubleshooting

### Plugin Not Loading

- Check that the plugin is built: `cd packages/plugin-parallelpedia && npm run build`
- Check that it's registered in `apps/agent/src/server/index.ts`
- Check server logs for errors

### API Endpoints Not Found

- Verify DKG node is running on port 9200
- Check that plugin is loaded (should see in startup logs)
- Verify CORS settings if calling from frontend

### Publishing Fails

- Check DKG node configuration (blockchain, wallet, etc.)
- Verify DKG_OTNODE_URL is set correctly
- Check DKG node logs for errors

### SPARQL Queries Not Working

The plugin uses SPARQL queries to search Community Notes. If queries fail:
- Verify Knowledge Assets are published correctly
- Check that JSON-LD structure matches expected format
- Review DKG node logs for query errors

## Next Steps

1. **Test with real Grokipedia data** - Once you have Knowledge Assets from Umanitek
2. **Enhance SPARQL queries** - Optimize for better search performance
3. **Add trust metrics** - Implement token staking for Community Notes (optional challenge)
4. **x402 monetization** - Add payment protocol for premium notes (optional challenge)

## Files Modified/Created

- `dkg-node/packages/plugin-parallelpedia/` - New plugin
- `dkg-node/apps/agent/src/server/index.ts` - Plugin registration
- `dkg-node/apps/agent/package.json` - Plugin dependency
- `backend/app/services/dkg_client.py` - Updated DKG client

## Support

For issues or questions:
- Check DKG Node logs
- Review plugin README: `dkg-node/packages/plugin-parallelpedia/README.md`
- Check OriginTrail DKG documentation

