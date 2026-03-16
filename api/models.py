from __future__ import annotations

import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class Format(str, Enum):
    mp4 = "mp4"
    mkv = "mkv"
    mp3 = "mp3"
    m4a = "m4a"
    best = "best"


class Quality(str, Enum):
    q2160 = "2160"
    q1080 = "1080"
    q720 = "720"
    q480 = "480"
    audio = "audio"
    best = "best"


class Status(str, Enum):
    queued = "queued"
    running = "running"
    done = "done"
    failed = "failed"
    cancelled = "cancelled"


class DownloadRequest(BaseModel):
    url: str
    format: Format = Format.mp4
    quality: Quality = Quality.best


class DownloadJob(BaseModel):
    id: str
    url: str
    title: Optional[str] = None
    format: Format
    quality: Quality
    status: Status = Status.queued
    progress: float = 0.0
    size_mb: Optional[float] = None
    error: Optional[str] = None
    path: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None


class MetaResponse(BaseModel):
    title: str
    channel: Optional[str] = None
    duration: Optional[int] = None
    thumbnail: Optional[str] = None
    upload_date: Optional[str] = None
    formats: list[str] = []
