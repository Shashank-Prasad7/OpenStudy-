# OpenStudy Architecture

OpenStudy is a self-hostable collaborative study platform built around real-time rooms, shared Pomodoro sessions, goals, accountability matching, and an optional AI planner.

## System overview

```text
React + Vite (Vercel)
  ├─ React Router
  ├─ TanStack Query
  ├─ Zustand
  └─ Tailwind UI
         │ REST/HTTPS + WebSocket/WSS
         ▼
FastAPI (Render)
  ├─ JWT in HttpOnly cookies
  ├─ REST routers
  ├─ WebSocket connection manager
  └─ background cleanup
      │                    │
      ▼                    ▼
PostgreSQL              Redis
users, rooms,           room presence,
goals, notes,           Pomodoro state,
preferences, matches    cross-instance sync
      │
      ▼
Groq API (optional)
structured study plans
```

The AI planner has a deterministic local fallback, so the core app remains usable without a Groq key.

## Frontend boundaries

- `src/pages`: routed screens.
- `src/components/rooms`: room discovery, creation, and member UI.
- `src/components/pomodoro`: synchronized timer and session-note prompt.
- `src/components/goals`: goal creation and completion UI.
- `src/components/matching`: accountability partner cards.
- `src/hooks`: REST and WebSocket integration.
- `src/store`: small client state for authentication and room presence.
- `src/api`: Axios client, cookie refresh, and normalized errors.

Page routes are lazy-loaded to keep the initial bundle smaller.

## Backend boundaries

- `app/routers`: HTTP endpoints and authorization boundaries.
- `app/models`: SQLAlchemy entities.
- `app/schemas`: Pydantic request and response contracts.
- `app/services`: authentication, matching, and Groq planning logic.
- `app/websocket`: room presence and Redis-backed timer synchronization.
- `app/tasks`: Redis state cleanup.
- `alembic`: PostgreSQL migrations.

## Authentication

Registration and login issue short-lived access and longer-lived refresh tokens as HttpOnly cookies. The frontend retries one failed request through `/api/auth/refresh`; if refresh fails, local user state is cleared and the user returns to login.

Production must use HTTPS with `COOKIE_SECURE=true`, a strong `JWT_SECRET_KEY`, and an explicit frontend origin in `CORS_ORIGINS`.

## Pomodoro synchronization

Each room has one Redis hash:

```text
room:{room_id}:pomodoro
status, start_time, duration, remaining, session_id, completed_at
```

The server calculates remaining time from authoritative timestamps and broadcasts it once per second. A Redis claim key ensures the database session is marked complete only once, even if multiple backend instances observe the timer ending.

## Data model

- `users`: profile, timezone, streak, last study date.
- `study_rooms`: room metadata, tags, visibility, capacity.
- `room_members`: unique user-to-room membership.
- `goals`: intentions, completion state, deadlines.
- `preferences`: subjects, study time, collaboration style.
- `pomodoro_sessions`: persisted room timer history.
- `session_notes`: one-line reflections after sessions.
- `partner_matches`: scored accountability suggestions.

## Reliability decisions

- Redis is optional for ordinary REST startup, but WebSocket/Pomodoro connections return a retry-later close code when Redis is unavailable.
- Authentication rate limiting gracefully skips when Redis is offline instead of breaking login.
- Database and Redis are reported separately by `/health`.
- CI validates TypeScript, linting, production build, Python imports, and tests.
