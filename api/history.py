from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import aiofiles

from .config import settings
from .models import DownloadJob


class HistoryStore:
    def __init__(self) -> None:
        self._path = Path(settings.data_path) / "history.json"

    def _ensure(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._path.write_text("[]", encoding="utf-8")

    async def all(self) -> list[DownloadJob]:
        self._ensure()
        async with aiofiles.open(self._path, encoding="utf-8") as f:
            raw = await f.read()
        return [DownloadJob.model_validate(item) for item in json.loads(raw)]

    async def append(self, job: DownloadJob) -> None:
        records = await self.all()
        records.insert(0, job)
        async with aiofiles.open(self._path, "w", encoding="utf-8") as f:
            await f.write(json.dumps([r.model_dump(mode="json") for r in records], indent=2))

    async def get(self, job_id: str) -> Optional[DownloadJob]:
        for job in await self.all():
            if job.id == job_id:
                return job
        return None
