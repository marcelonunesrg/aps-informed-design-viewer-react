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
npm run dev:core     # alias for frontend dev
npm run dev:all      # frontend + automated e2e log capture
npm run test         # run frontend tests
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
