# OpenStudy API

Base REST prefix: `/api`  
WebSocket endpoint: `/ws/{room_id}`

Authentication uses HttpOnly cookies. Bearer access tokens are also accepted by protected REST endpoints.

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account and issue cookies |
| POST | `/api/auth/login` | Authenticate and issue cookies |
| POST | `/api/auth/refresh` | Rotate access and refresh cookies |
| POST | `/api/auth/logout` | Clear authentication cookies |

## Users

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/users/me` | Current profile |
| PATCH | `/api/users/me` | Update name, bio, timezone, avatar |
| GET | `/api/users/me/preferences` | Read matching preferences |
| PATCH | `/api/users/me/preferences` | Create or update preferences |
| GET | `/api/users/me/stats` | Streak, focus minutes, goals, rooms, weekly focus |

## Rooms

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/rooms` | Paginated public room list |
| POST | `/api/rooms` | Create a room and join its creator |
| GET | `/api/rooms/{id}` | Room details and memberships |
| PATCH | `/api/rooms/{id}` | Update a creator-owned room |
| DELETE | `/api/rooms/{id}` | Delete a creator-owned room |
| POST | `/api/rooms/{id}/join` | Join with capacity enforcement |
| POST | `/api/rooms/{id}/leave` | Leave a room; creator must delete instead |

## Goals and notes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/goals` | Current user's goals |
| POST | `/api/goals` | Create goal |
| PATCH | `/api/goals/{id}` | Update or toggle goal |
| DELETE | `/api/goals/{id}` | Delete goal |
| GET | `/api/goals/session-notes` | Current user's notes |
| POST | `/api/goals/session-notes` | Add a note to a room session |

Completing a goal updates the streak at most once per calendar day.

## Partner matching

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/matches?limit=10` | Ranked suggestions and reasons |
| POST | `/api/matches/{id}/accept` | Accept a suggestion |

The score combines shared subjects (50%), timezone (20%), preferred study time (15%), and study style (15%).

## AI planner

`POST /api/ai/study-plan`

```json
{
  "exam_name": "Java exam",
  "exam_date": "2026-07-01",
  "topics": ["OOP", "Collections", "Exceptions"],
  "hours_per_day": 2,
  "current_level": "intermediate",
  "constraints": "College until 4 PM"
}
```

The response contains an overview, daily tasks, Pomodoro counts, checkpoints, revision strategy, and risk flags. Without `GROQ_API_KEY`, the backend returns a deterministic local plan.

## WebSocket events

Connect with the access cookie already issued by REST authentication:

```text
ws://localhost:8000/ws/{room_id}
```

Client to server:

```json
{ "event": "join_room" }
{ "event": "pomodoro_start", "duration": 25 }
{ "event": "pomodoro_pause" }
{ "event": "pomodoro_reset" }
{ "event": "user_typing", "text": "Reviewing graphs" }
```

Server to client:

```json
{
  "event": "room_state",
  "members": [{ "id": "...", "name": "Anmol", "avatar_url": null }],
  "pomodoro": {
    "status": "active",
    "remaining_secs": 1498,
    "duration_secs": 1500,
    "session_id": "..."
  }
}
```

Additional events: `pomodoro_tick`, `pomodoro_done`, `member_joined`, `member_left`, and `user_typing`.

## Errors

Application errors use:

```json
{
  "detail": {
    "message": "Room is full.",
    "code": "room_full"
  }
}
```
