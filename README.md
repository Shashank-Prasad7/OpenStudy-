# OpenStudy Backend

Production-ready FastAPI backend for OpenStudy, an open-source collaborative study platform built for the Unbound '26 Hackathon.

## Stack

- FastAPI with async SQLAlchemy 2.0
- PostgreSQL via asyncpg
- Alembic migrations
- Redis for Pomodoro state, rate limiting, and multi-instance consistency
- Pydantic v2 schemas
- JWT auth in HttpOnly cookies with refresh rotation
- FastAPI WebSockets for room presence and synced Pomodoro timers
- Groq SDK with Llama 3 for AI study planning
- structlog JSON logging

## Setup

```powershell
cd backend
Copy-Item .env.example .env
docker compose up --build
docker compose exec api alembic upgrade head
```

API docs will be available at `http://localhost:8000/docs`.

For local Python development without Docker:

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## Core Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `PATCH /api/users/me/preferences`
- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/{room_id}`
- `PATCH /api/rooms/{room_id}`
- `DELETE /api/rooms/{room_id}`
- `POST /api/rooms/{room_id}/join`
- `POST /api/rooms/{room_id}/leave`
- `GET /api/goals`
- `POST /api/goals`
- `PATCH /api/goals/{goal_id}`
- `POST /api/goals/session-notes`
- `GET /api/matches`
- `POST /api/matches/{match_id}/accept`
- `POST /api/ai/study-plan`

## WebSocket

Connect to:

```text
ws://localhost:8000/ws/{room_id}?token={access_jwt}
```

The server also accepts the `access_token` HttpOnly cookie when the browser connects from the frontend.

Client events:

- `join_room`
- `pomodoro_start` with `{ "duration": 25 }`
- `pomodoro_pause`
- `pomodoro_reset`
- `user_typing` with `{ "text": "..." }`

Server events:

- `room_state`
- `pomodoro_tick`
- `pomodoro_done`
- `member_joined`
- `member_left`
- `user_typing`

## Redis Pomodoro State

Pomodoro state is stored in a Redis hash:

```text
room:{room_id}:pomodoro
status=active
start_time=unix_seconds
duration=1500
remaining=1500
session_id={uuid}
```

Each backend instance reads Redis as the source of truth and calculates remaining time from `start_time`, so reconnects and server restarts keep the timer synchronized.
