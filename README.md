# TaskPulse

A personal productivity dashboard with a GitHub-style activity heatmap, Pomodoro timer, and task completion history.

**Live:** https://d2oabhwmkkcnog.cloudfront.net

---

## Stack

| Layer    | Technology                |
| -------- | ------------------------- |
| Frontend | React + Tailwind CSS      |
| Backend  | Python + FastAPI + Mangum |
| Database | PostgreSQL (AWS RDS)      |
| Hosting  | AWS S3 + CloudFront       |
| API      | AWS Lambda + API Gateway  |
| CI/CD    | GitHub Actions            |

---

## Features

- Add and complete tasks with persistent storage
- GitHub-style heatmap showing daily activity over 365 days
- 25-minute Pomodoro countdown timer
- Daily Bible verse for motivation
- Completed tasks log with timestamps

---

## Local Development

**Prerequisites:** Docker, Python 3.11, Node 18

```bash
# 1. Start the database
docker start taskpulse-db

# 2. Start the backend (Terminal 1)
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# 3. Start the frontend (Terminal 2)
cd frontend
npm run dev
```

App runs at `http://localhost:5173` — API docs at `http://localhost:8000/docs`

---

## Database Migrations

```bash
# Run against local Docker
docker exec -i taskpulse-db psql -U taskpulse -d taskpulse < infra/migrations/001_create_tasks.sql
docker exec -i taskpulse-db psql -U taskpulse -d taskpulse < infra/migrations/002_create_quotes.sql
docker exec -i taskpulse-db psql -U taskpulse -d taskpulse < infra/migrations/003_seed_quotes.sql
```

---

## Deployment

Deployments to `main` trigger automatically via GitHub Actions — backend via AWS SAM, frontend via S3 sync + CloudFront cache invalidation.

To deploy manually:

```bash
# Backend
sam build -t infra/template.yaml
sam deploy --no-confirm-changeset -t infra/template.yaml

# Frontend
cd frontend && npm run build
aws s3 sync dist/ s3://$S3_BUCKET_NAME --delete
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
```

---

## Project Structure

```
taskpulse/
├── frontend/         # React app
├── backend/          # FastAPI app
├── infra/
│   ├── template.yaml         # AWS SAM template
│   └── migrations/           # SQL migration files
└── .github/workflows/        # CI/CD pipeline
```

---

## API Endpoints

| Method | Endpoint               | Description                        |
| ------ | ---------------------- | ---------------------------------- |
| GET    | `/tasks`               | Fetch active tasks                 |
| POST   | `/tasks`               | Create a task                      |
| PATCH  | `/tasks/{id}/complete` | Complete a task                    |
| GET    | `/tasks/completed`     | Fetch completed tasks              |
| GET    | `/heatmap`             | Daily completion counts (365 days) |
| GET    | `/quotes`              | Fetch a motivational quote         |
