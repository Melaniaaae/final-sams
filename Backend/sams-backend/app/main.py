from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings

# ── Import all models so Alembic/SQLAlchemy can discover them ────────────
from app.database.base import Base
from app.database.connection import engine
import app.models  # noqa: F401  — registers all ORM models

# ── Import routers ────────────────────────────────────────────────────────
from app.routes import auth, students, logs, supervisors, companies, analytics, reports, field_visits

# ── Create tables (development only — use Alembic in production) ──────────
# In production comment this out and use: alembic upgrade head
Base.metadata.create_all(bind=engine)

# ── FastAPI app ───────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "REST API for the Student Attachment Management System. "
        "Provides authentication, student tracking, weekly logs, "
        "placement management, and coordinator analytics."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────
# Allows Angular dev server (localhost:4200) to communicate with this API.
# app/main.py — find this block and replace it entirely

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ── Serve uploaded files as static assets ────────────────────────────────
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# ── Register all routes under /api/v1 ─────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router,        prefix=API_PREFIX)
app.include_router(students.router,    prefix=API_PREFIX)
app.include_router(logs.router,        prefix=API_PREFIX)
app.include_router(supervisors.router, prefix=API_PREFIX)
app.include_router(companies.router,   prefix=API_PREFIX)
app.include_router(analytics.router,   prefix=API_PREFIX)
app.include_router(reports.router,     prefix=API_PREFIX)
app.include_router(field_visits.router, prefix=API_PREFIX)


# ── Health check ──────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/api/v1/health", tags=["Health"])
def health():
    return {"status": "healthy"}
