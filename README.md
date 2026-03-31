# APS Informed Design Viewer

Frontend-only React/Vite app with Autodesk Viewer + Informed Design extension UI, using APS PKCE (clientId-only).

## Prerequisites

- Node.js 20+ (Node 22 LTS recommended)
- APS app Client ID
- APS app callback URL set to your frontend URL (for example `http://localhost:8080/`)

## Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Set at least this variable in `frontend/.env`:

```bash
VITE_DEV_SERVER_PORT="8080"
VITE_APS_CLIENT_ID="<your-client-id>"
```

Open the app at `http://localhost:8080`.

## Root-level helper scripts

From the repository root:

```bash
npm run dev:fe       # run frontend
npm run dev:be       # run backend API for terminal commands
npm run dev          # run backend + frontend together
npm run dev:core     # alias for frontend dev
npm run dev:all      # frontend + automated e2e log capture
npm run test         # run frontend tests
npm run test:be      # run backend unit tests
npm run test:watch   # run frontend tests in watch mode
npm run build        # build frontend
npm run build:verify # build frontend
npm run debug:e2e    # open browser and capture console/network errors to artifacts/
```

## Automated browser error capture

```bash
npm run debug:e2e
```

This script will:

- Open the app in a browser window
- Log console errors, page errors, failed requests, and HTTP 4xx/5xx responses
- Save logs to `artifacts/browser-debug-<timestamp>.log`

Optional custom URL:

```bash
DEBUG_APP_URL="http://localhost:5173" npm run debug:e2e
```

## Usage

After login, load a release with query params:

```text
http://localhost:8080?releaseId=<RELEASE_ID>&accessId=<URL_ENCODED_ACCESS_ID>&accessType=<ACCESS_TYPE>
```

Or fill the fields in the app toolbar and click **Open release in viewer**.

## Terminal Drawer (Phase 1)

The app now includes a modal side drawer terminal for strict commands.

1. Start backend and frontend together:

```bash
npm run dev
```

2. Open a release in the viewer.
3. Click **Terminal** in the header.
4. Run supported commands:

```text
help
clear
release list
release use <releaseId>
release tag active
release tag obsolete
release set-default
confirm
cancel
```

Notes:

- `release list` and `release use <releaseId>` execute immediately.
- Mutating commands (`release tag ...`, `release set-default`) require `confirm`.
- Confirmation tokens expire after 2 minutes for safety.
- The backend tries multiple APS payload shapes for state/default updates to handle API variant differences.

## Backend Structure

Server code is now split by responsibility under `server/src`:

```text
server/src/
	app.js                      # Express app composition + middleware + route mounting
	index.js                    # Runtime bootstrap (port + app.listen)
	config/
		constants.js              # API URLs, default port, confirmation TTL
	routes/
		healthRoutes.js           # /api/health
		terminalRoutes.js         # /api/terminal/execute
	terminal/
		commandParser.js          # strict command grammar + context validation
		executor.js               # command orchestration + confirmation lifecycle
		help.js                   # static command help payload
	services/
		apsClient.js              # APS HTTP integration (read + mutation operations)
	utils/
		confirmationStore.js      # in-memory confirmation token store with TTL
		encoding.js               # accessId normalization helpers
```
