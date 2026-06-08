# TaskPulse

A personal productivity web app combining task tracking, a GitHub-style activity heatmap, a Pomodoro timer, and a daily motivational quote.

> **Live URL:** _add after deployment_

---

## Features

- **Task tracker** — add tasks, mark them complete, view today's completed tasks
- **Activity heatmap** — 52-week grid showing task completion intensity by day; click any block to see that day's tasks
- **Pomodoro timer** — 25-minute countdown with start/pause/reset; runs entirely client-side
- **Daily quote** — deterministic daily rotation from a seeded quotes table (same quote all day, changes at midnight)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 3, Vite 8 |
| Backend | Python FastAPI, Mangum (ASGI → Lambda) |
| Database | PostgreSQL (AWS RDS db.t3.micro) |
| Infrastructure | AWS SAM (Lambda, API Gateway, S3, CloudFront) |
| CI/CD | GitHub Actions |

---

## Local development

**Prerequisites:** Docker Desktop, Python 3.11+, Node.js 18+

### 1. Start local PostgreSQL

```bash
docker run -d --name taskpulse-db \
  -e POSTGRES_USER=taskpulse \
  -e POSTGRES_PASSWORD=taskpulse \
  -e POSTGRES_DB=taskpulse \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Run database migrations

```bash
psql postgresql://taskpulse:taskpulse@localhost:5432/taskpulse \
  -f infra/migrations/001_create_tasks.sql \
  -f infra/migrations/002_create_quotes.sql \
  -f infra/migrations/003_seed_quotes.sql
```

### 3. Start the backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

Swagger UI available at `http://localhost:8000/docs`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`.

### Run tests

```bash
cd backend
python -m pytest tests/ -v   # no running Postgres needed (uses SQLite in-memory)
```

---

## Project structure

```
taskpulse/
├── backend/     FastAPI app (Lambda-compatible via Mangum)
├── frontend/    React + Tailwind SPA
├── infra/       AWS SAM template + PostgreSQL migration SQL files
└── .github/     GitHub Actions workflows for frontend and backend deploys
```

---

## API routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/tasks` | Create a new task |
| `GET` | `/tasks` | Fetch all active tasks |
| `PATCH` | `/tasks/{id}/complete` | Mark a task complete |
| `GET` | `/tasks/completed` | Fetch completed tasks (last 14 days) |
| `GET` | `/heatmap` | UTC timestamps of completions (last 400 days) |
| `GET` | `/quotes` | Today's motivational quote |

---

## Deployment

Infrastructure is defined in `infra/template.yaml` (AWS SAM). Configuration defaults are in `infra/samconfig.toml`.

GitHub Actions workflows in `.github/workflows/` automatically deploy on push to `main`:
- `frontend-deploy.yml` — builds the React app and syncs to S3, then invalidates the CloudFront cache
- `backend-deploy.yml` — runs the test suite, then runs `sam build` + `sam deploy`

See `CLAUDE.md` for the full list of GitHub Actions secrets required.
