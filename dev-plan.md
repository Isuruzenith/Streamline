# yt-Z-Downloader — Development Plan

---

## Design Philosophy

> One screen. One action. No noise.

Strict minimalism — every element earns its place.
Remove before adding. Space is not emptiness, it is clarity.

### Core Principles

| Principle        | Rule                                                    |
| ---------------- | ------------------------------------------------------- |
| Single focus     | Each screen has exactly one primary action              |
| No decoration    | No gradients, no icons for aesthetics, no card shadows  |
| Typography first | Layout is driven by text hierarchy, not chrome          |
| Monochrome base  | Black / White / one neutral gray — one accent only      |
| Mobile first     | Every layout works at 320px wide                        |
| Instant feedback | Every user action gets a visible response in < 100ms    |

### Design Tokens

```
Background   #0f0f0f   (near-black)
Surface      #1a1a1a   (card / input bg)
Border       #2a2a2a   (subtle divider)
Text primary #f0f0f0   (headings, labels)
Text muted   #6b6b6b   (secondary, hints)
Accent       #e8ff47   (yellow-green — one CTA color only)
Danger       #ff4d4d   (errors only)
Success      #4dff91   (done state only)

Font         Inter / system-ui, monospace for URLs and codes
Base size    15px
Line height  1.6
Radius       4px (inputs), 0px (buttons)
```

---

## UI Screens

### Screen 1 — Download (Home)

```
┌─────────────────────────────────────────┐
│                                         │
│  yt-Z                          [queue 2]│
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Paste video URL...              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Format  [Best ▾]   Quality  [4K  ▾]   │
│                                         │
│  [  Download  ]                         │
│                                         │
└─────────────────────────────────────────┘
```

- URL input autofocused on load
- Format and quality dropdowns collapsed by default
- One button — no secondary actions
- Header: logo left, live queue count right (links to queue screen)

---

### Screen 2 — Queue

```
┌─────────────────────────────────────────┐
│                                         │
│  yt-Z  /  Queue                         │
│                                         │
│  Running ──────────────────────────     │
│                                         │
│  How to Train Your Dragon 2             │
│  MP4 · 1.4 GB                           │
│  ████████████░░░░░░  67%                │
│                                         │
│  Pending ──────────────────────────     │
│                                         │
│  Rick Astley - Never Gonna Give You Up  │
│  MP3 · queued                      [×]  │
│                                         │
└─────────────────────────────────────────┘
```

- No cards — plain list with section dividers
- Progress bar in accent color
- Cancel button only on pending jobs
- Auto-refreshes every 2 seconds via polling

---

### Screen 3 — History

```
┌─────────────────────────────────────────┐
│                                         │
│  yt-Z  /  History                       │
│                                         │
│  Title                    Format  Date  │
│  ─────────────────────────────────────  │
│  Dragon 2                 MP4     03-15 │
│  Never Gonna Give You Up  MP3     03-14 │
│  Lo-Fi Study Beats        MP3     03-12 │
│                                         │
│  [Load more]                            │
│                                         │
└─────────────────────────────────────────┘
```

- Plain table, no borders or zebra stripes
- Row click opens detail / re-download option
- Pagination via "Load more" — no page numbers

---

### Screen 4 — Settings

```
┌─────────────────────────────────────────┐
│                                         │
│  yt-Z  /  Settings                      │
│                                         │
│  Cookies                                │
│  ────────────────────                   │
│  cookies.json    last updated 3 days ago│
│  [Replace file]                         │
│                                         │
│  Default format                         │
│  ────────────────────                   │
│  [Best quality ▾]                       │
│                                         │
│  Storage path                           │
│  ────────────────────                   │
│  /downloads                             │
│                                         │
└─────────────────────────────────────────┘
```

- No modal dialogs — inline editing
- File upload via drag-and-drop or click
- Save is automatic on change (no save button)

---

### Screen 5 — Landing Page (public-facing)

```
┌─────────────────────────────────────────┐
│                                         │
│  yt-Z                    [GitHub ↗]     │
│                                         │
│  Self-hosted video downloader.          │
│  Powered by yt-dlp. Free forever.       │
│                                         │
│  docker compose up                      │  ← copyable code block
│                                         │
│  [  View on GitHub  ]                   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Works with YouTube, TikTok, Vimeo      │
│  and 1000+ platforms.                   │
│                                         │
│  Cookie auth · Queue system · Web UI    │
│                                         │
└─────────────────────────────────────────┘
```

- Static HTML — zero JS on the landing page
- Hosted via GitHub Pages from `/docs` folder
- Single call to action: GitHub repo link
- Feature list is plain text — no icons, no animations

---

### Component Rules

| Component    | Rule                                                      |
| ------------ | --------------------------------------------------------- |
| Button       | Solid fill, accent color, sharp corners, uppercase label  |
| Input        | 1px border, dark bg, no box-shadow on focus — border only |
| Dropdown     | Native `<select>` styled — no custom JS dropdown          |
| Progress bar | Full-width, 4px height, no label inside bar               |
| Status pill  | Text-only with color — no background fill                 |
| Navigation   | Breadcrumb path only — no sidebar, no tabs                |
| Error        | Red text inline below the input — no toast notifications  |
| Success      | Green status text in queue row — no modal                 |

---

## Level 0 — Core Engine

**Goal:** FastAPI + yt-dlp working end-to-end. No UI yet.

### Backend Tasks

- [ ] `api/main.py` — FastAPI app, CORS, lifespan hooks
- [ ] `api/downloader.py` — yt-dlp subprocess wrapper
  - format selection string builder (`bv*+ba/b`, `bestaudio`, etc.)
  - progress hook parsing from yt-dlp stdout
  - cookie file injection (`--cookies /cookies/cookies.json`)
- [ ] `api/queue.py` — async in-memory job queue
  - states: `pending` → `running` → `done` / `failed`
  - max 3 retries on failure with backoff
- [ ] `api/models.py` — Pydantic models for Job, DownloadRequest
- [ ] `api/history.py` — JSON file-based history store (`/data/history.json`)
- [ ] `api/settings.py` — config from environment variables
- [ ] Endpoints
  - `POST /download` — enqueue a job
  - `GET /queue` — list active jobs with progress
  - `GET /history` — list completed downloads
  - `DELETE /queue/{job_id}` — cancel a pending job
  - `GET /health` — liveness probe

### API Response Shapes

```json
// POST /download — request
{ "url": "https://youtube.com/watch?v=...", "format": "mp4", "quality": "best" }

// GET /queue
[
  {
    "id": "abc123",
    "url": "https://youtube.com/watch?v=...",
    "title": "How to Train Your Dragon 2",
    "format": "mp4",
    "status": "running",
    "progress": 67,
    "size_mb": 1400,
    "error": null
  }
]

// GET /history
[
  {
    "id": "abc123",
    "title": "How to Train Your Dragon 2",
    "format": "mp4",
    "size_mb": 1400,
    "path": "/downloads/channel/video.mp4",
    "downloaded_at": "2026-03-15T10:22:00Z"
  }
]
```

### Exit Criteria

- `POST /download` triggers a real yt-dlp download
- `GET /queue` returns live progress
- History survives container restart

---

## Level 1 — Minimal Web UI

**Goal:** Screens 1–4 built as HTML + Tailwind, served by FastAPI.

### Frontend Tasks

- [ ] `frontend/index.html` — Download screen
- [ ] `frontend/queue.html` — Queue screen
- [ ] `frontend/history.html` — History screen
- [ ] `frontend/settings.html` — Settings screen
- [ ] `frontend/assets/style.css` — design tokens + base overrides
- [ ] `frontend/assets/app.js` — fetch wrappers, queue polling, form handling

### JS Rules

- No framework — vanilla ES modules only
- Queue screen polls `GET /queue` every 2 seconds
- URL input validates on submit — inline error for invalid URLs
- Format dropdown updates quality options based on selection
- Cookie upload uses `FormData` + `PUT /settings/cookies`

### New Endpoints for UI

- `GET /meta?url=` — fetch title + available formats before download
- `PUT /settings/cookies` — upload new cookie file
- `GET /settings` — return current settings
- `PUT /settings` — update default format

### FastAPI Static Serving

```python
app.mount("/", StaticFiles(directory="frontend", html=True))
```

### Exit Criteria

- All 4 screens render correctly on mobile and desktop
- Download, queue, history, and settings all work end-to-end
- No JavaScript framework dependencies

---

## Level 2 — Docker + Deployment

**Goal:** Single `docker compose up` runs the full system.

### Docker Tasks

- [ ] `docker/Dockerfile` — Python 3.11 slim + ffmpeg + yt-dlp
- [ ] `docker-compose.yml`
  - mounts `./downloads:/downloads`
  - mounts `./cookies:/cookies`
  - mounts `./data:/data` (history JSON)
  - exposes port `8080`
- [ ] `.env.example` — document all config vars
- [ ] `docker/healthcheck.sh` — hits `/health` endpoint

### Dockerfile

```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt yt-dlp
COPY . /app
WORKDIR /app
HEALTHCHECK --interval=30s CMD curl -f http://localhost:8080/health || exit 1
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Config via Environment Variables

| Variable         | Default      | Description               |
| ---------------- | ------------ | ------------------------- |
| `DOWNLOAD_PATH`  | `/downloads` | Where files are saved     |
| `COOKIES_PATH`   | `/cookies`   | Cookie file directory     |
| `DATA_PATH`      | `/data`      | History JSON store        |
| `MAX_QUEUE_SIZE` | `50`         | Max concurrent + pending  |
| `MAX_RETRIES`    | `3`          | Retry attempts on failure |
| `DEFAULT_FORMAT` | `mp4`        | Default output format     |
| `API_KEY`        | `` (empty)   | Optional auth key         |

### Exit Criteria

- `docker compose up` starts the system cleanly
- `/downloads` and `/cookies` volumes persist data
- Container restarts without data loss
- Published to Docker Hub as `ghcr.io/owner/yt-z-downloader:latest`

---

## Level 3 — Multi-User + Auth

**Goal:** User accounts, isolated per-user storage, session auth.

### Auth Tasks

- [ ] `api/auth.py` — JWT issue + verify (python-jose)
- [ ] `api/users.py` — user CRUD
- [ ] Switch history store from JSON to SQLite (`/data/db.sqlite`)
- [ ] `db/models.py` — SQLAlchemy models: `User`, `DownloadJob`
- [ ] Per-user download path: `/downloads/{user_id}/`
- [ ] Per-user cookies: `/cookies/{user_id}/cookies.json`
- [ ] Auth middleware on all endpoints except `/health` and `/auth/`
- [ ] `POST /auth/register` — create user
- [ ] `POST /auth/login` — return JWT
- [ ] Login / register screens added to frontend

### Login Screen

```
yt-Z
─────────────────────
Email     [____________]
Password  [____________]

[  Log in  ]

No account? Register →
```

- JWT stored in `localStorage`
- Fetch interceptor adds `Authorization: Bearer <token>` header on every request

### Exit Criteria

- Two users can download simultaneously without seeing each other's jobs
- Cookie files are isolated per user
- Auth required on all download and history endpoints

---

## Level 4 — Platform Features

**Goal:** Playlist support, scheduled downloads, API access, media server push.

### Feature Tasks

- [ ] Playlist download — detect playlist URL, enqueue all videos
- [ ] Scheduled downloads — cron-style via APScheduler
- [ ] Subtitle download support (`--write-sub --sub-lang en`)
- [ ] API key management screen in Settings
- [ ] `GET /api/v1/*` — public API with API key auth
- [ ] Plex / Jellyfin post-download hook — trigger library scan via HTTP
- [ ] Channel archive — subscribe to channel URL, poll for new uploads
- [ ] Browser extension stub (manifest + background script)
- [ ] OpenAPI docs auto-served at `/docs`

### Plex Integration (Settings)

```
Media server
────────────────────────
Type      [Plex ▾]
URL       [http://localhost:32400]
Token     [____________________]

[Test connection]   Auto-scan on download [✓]
```

---

## Open Source Infrastructure

**Goal:** Production-quality open source project — easy to fork, contribute, and self-host.

### Repository Files

- [ ] `LICENSE` — MIT
- [ ] `README.md` — install instructions, screenshots, feature list
- [ ] `CONTRIBUTING.md` — how to run locally, PR process, coding style
- [ ] `CHANGELOG.md` — semver entry per release
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md`
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md`
- [ ] `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] `docs/index.html` — landing page (Screen 5), served via GitHub Pages

### README Structure

```
# yt-Z-Downloader

Self-hosted video downloader powered by yt-dlp.

## Quick start
docker compose up

## Features
## Screenshots
## Configuration
## Contributing
## License
```

### CI/CD — GitHub Actions

#### `.github/workflows/ci.yml`
Triggers on: push to `main`, all pull requests

```
Steps:
1. Checkout
2. Set up Python 3.11
3. pip install -r requirements.txt
4. ruff check api/          (lint)
5. pytest tests/ -q         (unit tests)
```

#### `.github/workflows/docker.yml`
Triggers on: push of version tag `v*.*.*`

```
Steps:
1. Checkout
2. Log in to GitHub Container Registry (ghcr.io)
3. docker buildx build --platform linux/amd64,linux/arm64
4. Push as ghcr.io/owner/yt-z-downloader:latest
       and ghcr.io/owner/yt-z-downloader:v1.2.3
```

#### `.github/workflows/pages.yml`
Triggers on: push to `main` (docs/ changes only)

```
Steps:
1. Deploy docs/ to GitHub Pages
```

### Versioning Strategy

- Semantic versioning: `MAJOR.MINOR.PATCH`
- `v0.x` — pre-stable (breaking changes allowed)
- `v1.0.0` — first stable release (Docker + UI complete)
- Git tag triggers Docker Hub + GHCR publish automatically
- CHANGELOG updated manually before each tag

### Tests

- [ ] `tests/test_queue.py` — job state transitions
- [ ] `tests/test_downloader.py` — format string builder, cookie injection
- [ ] `tests/test_api.py` — endpoint smoke tests with `TestClient`
- [ ] `tests/conftest.py` — shared fixtures, tmp directories

### Exit Criteria

- `ruff` passes with zero warnings
- All tests pass in CI
- Docker image builds for `amd64` and `arm64`
- Landing page live on GitHub Pages

---

## Repository Structure

```
yt-Z-downloader/
├── api/
│   ├── main.py          # FastAPI app, routes, static mount
│   ├── downloader.py    # yt-dlp subprocess wrapper
│   ├── queue.py         # Async job queue
│   ├── models.py        # Pydantic request/response models
│   ├── history.py       # History store (JSON → SQLite)
│   ├── auth.py          # JWT auth (Level 3)
│   ├── users.py         # User CRUD (Level 3)
│   └── settings.py      # App settings from env
│
├── frontend/
│   ├── index.html       # Download screen
│   ├── queue.html       # Queue screen
│   ├── history.html     # History screen
│   ├── settings.html    # Settings screen
│   └── assets/
│       ├── style.css    # Design tokens + base styles
│       └── app.js       # Fetch, polling, form logic
│
├── docs/
│   └── index.html       # Landing page → GitHub Pages
│
├── tests/
│   ├── conftest.py
│   ├── test_queue.py
│   ├── test_downloader.py
│   └── test_api.py
│
├── docker/
│   ├── Dockerfile
│   └── healthcheck.sh
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── docker.yml
│   │   └── pages.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── data/                # Gitignored — history DB / JSON
├── downloads/           # Gitignored — downloaded files
├── cookies/             # Gitignored — cookie files
│
├── docker-compose.yml
├── requirements.txt
├── .env.example
├── .gitignore
├── LICENSE              # MIT
├── CHANGELOG.md
├── CONTRIBUTING.md
├── README.md
├── PRD.md
└── dev-plan.md
```

---

## Build Order

```
Level 0   api/ engine + endpoints                     ← downloads work
Level 1   frontend/ all 4 screens + app.js            ← UI works
Level 2   Docker + compose + env config               ← ships
          Open source infra: CI, README, landing page ← community ready
Level 3   auth + users + SQLite                       ← multi-user
Level 4   playlist + schedule + API + integrations    ← platform
```

## Release Milestones

| Tag    | Milestone                                           |
| ------ | --------------------------------------------------- |
| v0.1.0 | Core engine — API + yt-dlp working                  |
| v0.2.0 | Web UI — all 4 screens functional                   |
| v0.3.0 | Docker + one-command deploy                         |
| v0.4.0 | CI/CD + tests + GitHub Pages landing                |
| v1.0.0 | Stable release — single user, fully self-hosted     |
| v1.1.0 | Multi-user auth + per-user isolation                |
| v2.0.0 | Platform features — playlists, schedules, API keys  |

---

*Last updated: 2026-03-16*
