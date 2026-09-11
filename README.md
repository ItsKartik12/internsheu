# internsheu — Academia-Industry Collaboration Portal

Monorepo workspace for the SIH project: a React (Vite) frontend and an
Express backend, developed and deployed as separate services.

```
.
├── frontend/    React + Vite + Tailwind SPA (see frontend/README.md)
└── backend/     Express API (see backend/README.md)
```

## Running locally

Each half runs independently — open two terminals:

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:5000

# Terminal 2 — frontend
cd frontend
cp .env.example .env
npm install
npm run dev         # http://localhost:5173
```

The frontend works fine with the backend not running — `src/services/api.js`
falls back to the local mock data in `src/data/mockDatabase.js` whenever a
backend call fails, so you can develop either side independently.

## Why two folders instead of one

Splitting into `/frontend` and `/backend` lets each half:

- ship with its own `package.json`, dependencies, and `.env`
- deploy to different targets (e.g. frontend to Vercel/Netlify, backend to
  Render/Railway/a VPS) without one's build config leaking into the other
- be handed to different people to own without stepping on each other's
  toolchain

Neither folder depends on the other at build time — they only talk over
HTTP at runtime, via `VITE_API_BASE_URL`.
