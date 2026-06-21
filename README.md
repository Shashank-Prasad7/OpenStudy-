# OpenStudy

OpenStudy is an MIT-licensed collaborative study platform for students who need consistency, accountability, and compatible study partners—not another resource library.

It includes:

- Live study rooms with real-time presence.
- One Redis-synchronized Pomodoro per room.
- Goals, streaks, and post-session notes.
- Partner matching by subject, timezone, study time, and style.
- An optional Groq-powered study planner with a local fallback.
- Responsive React UI, FastAPI API, PostgreSQL migrations, and CI.

## Architecture

```text
React + Vite + Tailwind + Zustand + TanStack Query
              │ REST + WebSocket
              ▼
        FastAPI application
          │             │
          ▼             ▼
     PostgreSQL       Redis
          │
          ▼
       Groq API (optional)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/API.md](docs/API.md).

## Quick start with Docker

Requirements: Docker and Docker Compose.

```bash
cp backend/.env.example backend/.env
# Set a strong JWT_SECRET_KEY in backend/.env. GROQ_API_KEY is optional.
docker compose up --build
```

Open:

- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

The API container runs Alembic migrations before starting.

## Local development

### Backend

Requirements: Python 3.11+ and running PostgreSQL/Redis services.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

Requirements: Node.js 22+.

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

The supplied values connect directly to the local API. You may also leave both variables blank to use the built-in Vite proxy. For separate deployments, set:

```env
VITE_API_URL=https://your-api.example.com
VITE_WS_URL=wss://your-api.example.com
```

## Validation

```bash
cd frontend
npm run lint
npm run typecheck
npm run build

cd ../backend
python -m compileall -q app
python -m pytest -q
```

## Production deployment

### Frontend on Vercel

Set the project root to `frontend`, build command to `npm run build`, and output directory to `dist`. Add `VITE_API_URL` and `VITE_WS_URL`. `frontend/vercel.json` preserves client-side routes on refresh.

### Backend on Render

Use `render.yaml` or deploy `backend/Dockerfile`. Provide:

- `DATABASE_URL` and `ALEMBIC_DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET_KEY`
- `COOKIE_SECURE=true`
- `CORS_ORIGINS` with the exact Vercel origin
- optional `GROQ_API_KEY` and `GROQ_MODEL`

## Repository structure

```text
frontend/            React application
backend/             FastAPI application and migrations
docs/                Architecture and API reference
.github/workflows/   Frontend and backend CI
render.yaml          Render deployment blueprint
docker-compose.yml   Local full-stack environment
LICENSE              MIT license
```

## Demo path

1. Register and reach the dashboard.
2. Create a room and copy its link.
3. Open the link in a second signed-in browser window.
4. Start the Pomodoro and show synchronized countdowns.
5. Finish/reset the timer and save a session note.
6. Create and complete a goal.
7. Save matching preferences and show suggestions.
8. Generate an exam plan.

## License

MIT — see [LICENSE](LICENSE).
