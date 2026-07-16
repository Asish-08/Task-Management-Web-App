from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.config import settings
from app.routers import tasks, heatmap, quotes, startup, folders, auth

app = FastAPI(title="TaskPulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=False,
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(folders.router)
app.include_router(heatmap.router)
app.include_router(quotes.router)
app.include_router(startup.router)


@app.get("/health")
def health():
    return {"status": "ok"}


handler = Mangum(app, lifespan="off")
