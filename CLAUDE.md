# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

TaskPulse is a personal productivity web app: task tracker + GitHub-style activity heatmap + Pomodoro timer + daily motivational quotes.

- **Frontend** — React + Tailwind CSS (Vite), deployed to S3 + CloudFront
- **Backend** — Python FastAPI + Mangum adapter, deployed to AWS Lambda via API Gateway
- **Database** — PostgreSQL (AWS RDS free tier); SQLite in-memory for tests
- **Infra** — AWS SAM (`infra/template.yaml`)
- **CI/CD** — GitHub Actions (`.github/workflows/`)

---

## Development commands

All backend commands must be run from the `backend/` directory (pydantic-settings reads `.env.local` from the working directory).

### Backend

```bash
cd backend

# First-time setup
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Start local dev server (requires local Postgres — see below)
uvicorn app.main:app --reload --port 8000

# Run all tests (SQLite in-memory, no Postgres needed)
python -m pytest tests/ -v

# Run a single test file
python -m pytest tests/test_tasks.py -v

# Run a single test by name
python -m pytest tests/test_tasks.py::test_complete_task -v
```

### Frontend

```bash
cd frontend

npm install        # first-time only
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run lint       # eslint
```

### Local Postgres (Docker)

```bash
docker run -d --name taskpulse-db \
  -e POSTGRES_USER=taskpulse -e POSTGRES_PASSWORD=taskpulse -e POSTGRES_DB=taskpulse \
  -p 5432:5432 postgres:16-alpine

# Run migrations (first time or after docker restart)
psql postgresql://taskpulse:taskpulse@localhost:5432/taskpulse \
  -f infra/migrations/001_create_tasks.sql \
  -f infra/migrations/002_create_quotes.sql \
  -f infra/migrations/003_seed_quotes.sql

# Stop/start later
docker stop taskpulse-db
docker start taskpulse-db
```

---

## Architecture notes

### Data flow: heatmap

The heatmap has a deliberate two-layer design to handle timezone correctness:

1. **`GET /heatmap`** returns raw UTC ISO-8601 timestamp strings (not pre-aggregated counts). This prevents off-by-one errors for users in UTC± timezones.
2. **`useHeatmap.js`** (`frontend/src/hooks/useHeatmap.js`) groups timestamps into local calendar dates and builds the 52-week grid client-side. Count = -1 means invisible Monday-alignment padding; count = 0 means future or empty day.
3. **`incrementToday()`** on `useHeatmap` is called after `markComplete` in `App.jsx` to update the heatmap square immediately without a refetch.

### Backend config

`app/config.py` uses `pydantic-settings`. Locally it reads `backend/.env.local`; in Lambda it reads real environment variables. The `cors_origins_list` property splits a comma-separated `CORS_ORIGINS` env var. The settings singleton is instantiated at module load — the working directory must be `backend/` when running.

### Lambda compatibility

`app/main.py` exports `handler = Mangum(app, lifespan="off")` — this is the Lambda entry point. `lifespan="off"` disables FastAPI startup/shutdown events which don't map to Lambda invocations. Running locally uses `uvicorn` directly; `Mangum` is only exercised in Lambda.

### Test fixture pattern

`tests/conftest.py` uses SQLite in-memory with `StaticPool` (single connection). Each test gets its own `TestingSessionLocal` session via `override_get_db` — sessions are not shared across requests because SQLAlchemy sessions are not thread-safe with `TestClient`. The `autouse` `setup_db` fixture recreates all tables before each test and drops them after.

### Selected-date flow (CompletedLog)

`App.jsx` owns `selectedDate` state (defaults to today). Clicking a heatmap block calls `onDaySelect` → `setSelectedDate`. `completed` tasks from `useTasks` are filtered in `App.jsx` by `selectedDate` before being passed to `CompletedLog`. Timestamps from the API are treated as UTC (appending `Z` if absent) before converting to local date for comparison.

### No Alembic

Migrations are plain SQL files in `infra/migrations/`. Run them in order. The schema is stable; add Alembic if it grows complex.

---

## Key environment variables

| Variable | Where set | Purpose |
|---|---|---|
| `DATABASE_URL` | `backend/.env.local` | PostgreSQL connection string |
| `CORS_ORIGINS` | `backend/.env.local` | Comma-separated allowed origins |
| `VITE_API_BASE_URL` | `frontend/.env.local` | Backend base URL for axios client |

Production values are injected via SAM `--parameter-overrides` (backend) and set as GitHub Actions secrets during `npm run build` (frontend).
