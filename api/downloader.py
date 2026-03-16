from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Callable, Optional

import yt_dlp

from .config import settings
from .models import Format, Quality


def _format_string(fmt: Format, quality: Quality) -> str:
    if fmt in (Format.mp3, Format.m4a) or quality == Quality.audio:
        return "bestaudio/best"
    if quality == Quality.best:
        return "bestvideo+bestaudio/best"
    h = quality.value  # "1080", "720", etc.
    return f"bestvideo[height<={h}]+bestaudio/best[height<={h}]"


def _postprocessors(fmt: Format) -> list[dict]:
    if fmt == Format.mp3:
        return [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
    if fmt == Format.m4a:
        return [{"key": "FFmpegExtractAudio", "preferredcodec": "m4a"}]
    return []


def _base_opts() -> dict:
    opts: dict = {"quiet": True, "no_warnings": True, "retries": settings.max_retries}
    cookie_file = Path(settings.cookies_path) / "cookies.json"
    if cookie_file.exists():
        opts["cookiefile"] = str(cookie_file)
    return opts


async def fetch_metadata(url: str) -> dict:
    opts = {**_base_opts(), "skip_download": True}

    def _run() -> dict:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
        return {
            "title": info.get("title", ""),
            "channel": info.get("uploader"),
            "duration": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "upload_date": info.get("upload_date"),
            "formats": sorted({f.get("ext", "") for f in info.get("formats", []) if f.get("ext")}),
        }

    return await asyncio.get_event_loop().run_in_executor(None, _run)


async def download(
    url: str,
    fmt: Format,
    quality: Quality,
    on_progress: Callable[[float, Optional[float]], None],
) -> tuple[str, str]:
    """
    Download the URL. Returns (title, file_path).
    on_progress(percent, size_mb) is called from the worker thread — keep it thread-safe.
    """
    output_tmpl = str(
        Path(settings.download_path) / "%(uploader)s" / "%(title)s.%(ext)s"
    )

    def _hook(d: dict) -> None:
        if d["status"] == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            done = d.get("downloaded_bytes", 0)
            pct = (done / total * 100) if total else 0.0
            size_mb = (total / 1_048_576) if total else None
            on_progress(round(pct, 1), size_mb)
        elif d["status"] == "finished":
            on_progress(100.0, None)

    opts = {
        **_base_opts(),
        "format": _format_string(fmt, quality),
        "outtmpl": output_tmpl,
        "merge_output_format": "mp4" if fmt == Format.mp4 else None,
        "postprocessors": _postprocessors(fmt),
        "progress_hooks": [_hook],
        "noplaylist": True,
    }
    opts = {k: v for k, v in opts.items() if v is not None}

    result: dict = {}

    def _run() -> None:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            result["title"] = info.get("title", url)
            result["path"] = ydl.prepare_filename(info)

    await asyncio.get_event_loop().run_in_executor(None, _run)
    return result.get("title", url), result.get("path", "")
