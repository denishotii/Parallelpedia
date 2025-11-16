# What to Commit for Submission

## Files to Include in Git

### Core Application
- ✅ `backend/` - Complete FastAPI backend (except venv and __pycache__)
- ✅ `frontend/` - Complete React frontend (except node_modules and dist)
- ✅ `README.md` - Main project documentation
- ✅ `INTEGRATION_GUIDE.md` - Technical integration guide
- ✅ `SETUP.md` - Setup instructions for judges
- ✅ `SUBMISSION_NOTES.md` - Notes for judges
- ✅ `.gitignore` - Updated to include plugin files
- ✅ `LICENSE` - Project license

### DKG Node Plugin (Required)
- ✅ `dkg-node/packages/plugin-parallelpedia/` - Our custom plugin
  - `src/index.ts` - Plugin source code
  - `package.json` - Plugin dependencies
  - `tsconfig.json` - TypeScript config
  - `eslint.config.mjs` - ESLint config
  - `README.md` - Plugin documentation

### DKG Node Modifications (Required)
- ✅ `dkg-node/apps/agent/src/server/index.ts` - Plugin registration
- ✅ `dkg-node/apps/agent/package.json` - Plugin dependency added

## Files to Exclude (gitignored)

- ❌ `dkg-node/node_modules/` - Install with `npm install`
- ❌ `dkg-node/apps/agent/node_modules/` - Install with `npm install`
- ❌ `dkg-node/apps/agent/dist/` - Build artifacts
- ❌ `dkg-node/apps/agent/dkg.db` - Database (created during setup)
- ❌ `dkg-node/apps/agent/.env` - Environment variables (created during setup)
- ❌ `dkg-node/packages/*/node_modules/` - Dependencies
- ❌ `dkg-node/packages/*/dist/` - Build artifacts
- ❌ `dkg-node/dkg-engine/` - Large engine files (not needed)
- ❌ `dkg-node/docs/` - Documentation (not needed for submission)

## Commands to Stage Files

```bash
# Stage all application files
git add backend/ frontend/ README.md INTEGRATION_GUIDE.md SETUP.md SUBMISSION_NOTES.md LICENSE .gitignore

# Stage DKG Node plugin
git add dkg-node/packages/plugin-parallelpedia/

# Stage DKG Node modifications
git add dkg-node/apps/agent/src/server/index.ts
git add dkg-node/apps/agent/package.json

# Verify what will be committed
git status
```

## What Judges Need to Do

1. **Clone the repository**
2. **Install DKG Node dependencies** (if using our pre-configured node):
   ```bash
   cd dkg-node
   npm install
   cd apps/agent
   npm install
   ```
3. **Build the plugin**:
   ```bash
   cd ../../packages/plugin-parallelpedia
   npm install
   npm run build
   ```
4. **Follow SETUP.md** for complete setup instructions

## Alternative: Standalone Plugin Distribution

If you prefer to distribute the plugin separately, you could:

1. Create a separate repository for just the plugin
2. Provide npm package installation instructions
3. Include setup script that copies plugin to DKG Node

But including it in the main repo (as we've done) is simpler for judges.

