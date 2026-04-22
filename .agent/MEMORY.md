# Streamline Agent Memory

## PRD Reference
- **Always use** `c:\Projects\Streamline\streamline-prd.jsx` as the canonical Product Requirements Document (PRD).
- The PRD is a React JSX component that visually documents the full product spec.

## Product Summary
**Streamline** is an open-source, locally-run WebUI for `yt-dlp` — built on Bun so it installs with a single command on macOS, Windows, and Linux.

### Key Decisions
- **Audience**: Casual users (primary), power users (secondary)
- **Runtime**: Bun.js
- **Backend**: Bun HTTP / Elysia
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS + shadcn/ui (Claude-inspired aesthetic)
- **Python**: python-build-standalone 3.11 (bundled at ~/.streamline/python/)
- **Downloader**: yt-dlp (pip installed in isolated venv)
- **Media processing**: ffmpeg (via imageio[ffmpeg])
- **IPC**: WebSocket (Bun native) for real-time progress
- **Process management**: Bun.spawn() for yt-dlp subprocess
- **Default port**: localhost:7979
- **Download path**: ~/Downloads (overridable)
- **Queue mode**: Sequential (one at a time)

### Milestones
- M1 (Week 1-2): Foundation — install, Python provisioning, env panel, basic URL preview
- M2 (Week 3-4): Core Download — format picker, download with progress, rich progress bar
- M3 (Week 5-6): Queue & Playlist — queue panel, playlist detection, history, notifications
- M4 (Week 7-9): Full Feature Parity — subtitles, auth, chapters, SponsorBlock, custom flags
- M5 (Week 10): Open Source Launch — docs, CI, publish, demo
