from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader

from .config import settings
from .history import HistoryStore
from .models import DownloadJob, DownloadRequest, MetaResponse, Status
from .queue import JobQueue
from . import downloader as dl

# ---------------------------------------------------------------------------
# State singletons
# ---------------------------------------------------------------------------

history = HistoryStore()
queue = JobQueue(history)

# ---------------------------------------------------------------------------
# Auth (optional — skip if API_KEY is not set)
# ---------------------------------------------------------------------------

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _check_key(key: Optional[str] = Security(_api_key_header)) -> None:
    if settings.api_key and key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    queue.start()
    yield
    await queue.stop()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="yt-Z-Downloader",
    description="Self-hosted video downloader powered by yt-dlp.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/info", response_model=MetaResponse, dependencies=[Depends(_check_key)])
async def info(url: str = Query(..., description="Video URL to inspect")) -> MetaResponse:
    try:
        meta = await dl.fetch_metadata(url)
        return MetaResponse(**meta)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@app.post("/api/download", response_model=DownloadJob, dependencies=[Depends(_check_key)])
async def submit(req: DownloadRequest) -> DownloadJob:
    if not req.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=422, detail="URL must start with http:// or https://")
    return await queue.enqueue(req)


@app.get("/api/queue", response_model=list[DownloadJob], dependencies=[Depends(_check_key)])
async def get_queue() -> list[DownloadJob]:
    active = [Status.queued, Status.running]
    return [j for j in queue.all_jobs() if j.status in active]


@app.delete("/api/queue/{job_id}", dependencies=[Depends(_check_key)])
async def cancel_job(job_id: str) -> dict:
    if not queue.cancel(job_id):
        raise HTTPException(status_code=404, detail="Job not found or already running")
    return {"cancelled": job_id}


@app.get("/api/downloads", response_model=list[DownloadJob], dependencies=[Depends(_check_key)])
async def get_history(limit: int = Query(50, ge=1, le=200)) -> list[DownloadJob]:
    records = await history.all()
    return records[:limit]


@app.get("/api/downloads/{job_id}", response_model=DownloadJob, dependencies=[Depends(_check_key)])
async def get_download(job_id: str) -> DownloadJob:
    job = queue.get_job(job_id) or await history.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
