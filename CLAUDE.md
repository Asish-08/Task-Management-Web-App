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

| Variable            | Where set             | Purpose                           |
| ------------------- | --------------------- | --------------------------------- |
| `DATABASE_URL`      | `backend/.env.local`  | PostgreSQL connection string      |
| `CORS_ORIGINS`      | `backend/.env.local`  | Comma-separated allowed origins   |
| `VITE_API_BASE_URL` | `frontend/.env.local` | Backend base URL for axios client |

Production values are injected via SAM `--parameter-overrides` (backend) and set as GitHub Actions secrets during `npm run build` (frontend).

---

## Production infrastructure

| Resource                   | Value                                                         |
| -------------------------- | ------------------------------------------------------------- |
| API Gateway endpoint       | `https://i3tl59i1eh.execute-api.us-east-1.amazonaws.com`      |
| CloudFront URL (live app)  | `https://d2oabhwmkkcnog.cloudfront.net`                       |
| S3 bucket (frontend)       | `taskpulse-frontend-678412441430`                             |
| CloudFront distribution ID | `E14ZNJOE92IGUH`                                              |
| CloudFormation stack       | `taskpulse-backend` (us-east-1)                               |
| RDS endpoint               | `taskpulse-db.csnao2i84gz1.us-east-1.rds.amazonaws.com`       |
| SAM artifact bucket        | `aws-sam-cli-managed-default-samclisourcebucket-c8brpxqx64qb` |
| IAM deploy user            | `taskpulse-admin`                                             |

### Manual re-deploy (if needed)

```bash

# After deploy: update frontend/.env.production with ApiEndpoint output, then:
cd frontend && npm run build

aws s3 sync frontend/dist/ s3://taskpulse-frontend-678412441430 \
  --delete --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

aws s3 cp frontend/dist/index.html s3://taskpulse-frontend-678412441430/index.html \
  --cache-control "no-cache,no-store,must-revalidate" --content-type "text/html"

aws cloudfront create-invalidation \
  --distribution-id E14ZNJOE92IGUH --paths "/*"
```

---

## CI/CD pipeline

Two GitHub Actions workflows in `.github/workflows/`:

| Workflow              | Trigger                               | Does                                                |
| --------------------- | ------------------------------------- | --------------------------------------------------- |
| `backend-deploy.yml`  | `backend/**` or `infra/**`            | Runs tests → SAM deploy                             |
| `frontend-deploy.yml` | `frontend/**`                         | Builds → S3 sync (two-step cache) → CF invalidation |

### Required GitHub repository secrets

Set at: repo → Settings → Secrets and variables → Actions → Repository secrets

| Secret name                  | Value                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`          | Access key ID for `taskpulse-admin` IAM user                     |
| `AWS_SECRET_ACCESS_KEY`      | Secret key for `taskpulse-admin` IAM user                        |
| `DATABASE_URL`               | Full PostgreSQL connection string (see RDS endpoint above)       |
| `CORS_ORIGINS`               | `*`                                                              |
| `VITE_API_BASE_URL`          | API Gateway endpoint URL (no trailing slash)                     |
| `S3_BUCKET_NAME`             | `taskpulse-frontend-678412441430` (bare name, no `s3://` prefix) |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E14ZNJOE92IGUH`                                                 |

### Known gotchas — do not repeat these mistakes

**Python version** — Lambda runtime is `python3.11`. CI workflows must also use `python-version: '3.11'`. Mismatching versions (e.g. 3.12) lets tests pass locally but hides runtime incompatibilities.

**DATABASE_URL in CI tests** — `app/config.py` instantiates `Settings()` at import time. If `DATABASE_URL` is not set, pydantic-settings raises a validation error before pytest collects a single test. Always set it in the test step env block:

```yaml
env:
  DATABASE_URL: "sqlite:///:memory:" # must be quoted — trailing colon breaks YAML
```

**Quote all SAM parameter overrides** — In a bash `run:` block, an unquoted `*` glob-expands to filenames. `CorsOrigins=*` becomes `CorsOrigins=.aws-sam .github backend ...` and CloudFormation rejects the changeset. Always quote:

```yaml
--parameter-overrides \
"Environment=production" \
"DatabaseUrl=${{ secrets.DATABASE_URL }}" \
"CorsOrigins=*"
```

**`--resolve-s3` is required when running `sam deploy` outside `infra/`** — `samconfig.toml` lives in `infra/`. If `sam deploy` runs from the repo root without `--config-file infra/samconfig.toml`, the config is not picked up and SAM has no S3 bucket for artifact upload. Always either run from `infra/` or pass `--resolve-s3` explicitly.

**Node version** — Vite v8 requires Node.js 20.19+ or 22.12+. Node 18 (EOL) crashes with `ReferenceError: CustomEvent is not defined`. Use `node-version: '22'` in all frontend build steps.

**AWS_REGION is not a secret** — Region is not sensitive. Storing it as a GitHub secret means a missing/empty secret silently breaks all `aws-actions/configure-aws-credentials` steps with "Could not load credentials from any providers". Hardcode `us-east-1` directly in workflow files.

**S3_BUCKET_NAME is the bare bucket name** — The workflow constructs `s3://${{ secrets.S3_BUCKET_NAME }}`. If the secret value includes `s3://`, the result is `s3://s3://...` and the sync fails. Value must be `taskpulse-frontend-678412441430` with no prefix.

**Do not add a catch-all workflow with no `paths:` filter** — A workflow that fires on every push to `main` with no path filter will race any path-filtered workflow that covers the same stack. Two concurrent SAM deploys to the same CloudFormation stack causes "Stack is in UPDATE_IN_PROGRESS" failures. Always use path filters and keep one workflow per concern.

**`confirm_changeset = false` in `infra/samconfig.toml` is intentional** — SAM's `confirm_changeset = true` causes it to print the changeset and wait for `y/N` input. In CI there is no TTY, so SAM gets no input and aborts with exit code 1. The setting is `false` to match the `--no-confirm-changeset` flag already in the workflow. Do not change it back to `true`.

**Re-running a failed GitHub Actions job uses the workflow from the original triggering commit** — clicking "Re-run failed jobs" replays the workflow YAML that was in place when the job first ran, not the current HEAD. If you fix a workflow file in a commit that doesn't match any path filter (e.g. only `.github/workflows/` changed), the fix will never be exercised by a re-run. To pick up a workflow fix, push a new commit that touches a path covered by the filter (`backend/**` or `infra/**`).
