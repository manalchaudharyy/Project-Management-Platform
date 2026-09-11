# Voxel — Frontend (React + Vite)

This is the frontend for the Voxel project management platform. See the [root README](../README.md) for the full project overview, features, setup, environment variables, API reference, and deployment instructions.

## Quick start (local dev)

```bash
npm install
npm run dev
```

Requires the backend running at `http://localhost:5000` (see root README) — the Vite dev server proxies `/api` and `/socket.io` to it automatically.

## Production build

```bash
npm run build
```

Set `VITE_API_URL` and `VITE_SOCKET_URL` (see `.env.example`) to your deployed backend's URL before building.