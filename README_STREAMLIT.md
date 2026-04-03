# yt-Z Downloader — Streamlit UI

A polished **Streamlit + shadcn/ui** frontend for the yt-Z downloader backend.

## Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | Streamlit |
| Component Library | `streamlit-shadcn-ui` |
| Backend | FastAPI + yt-dlp (unchanged) |
| Auth | JWT Bearer tokens |

## Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the FastAPI backend (optional — app runs in demo mode without it)
```bash
uvicorn api.main:app --reload --port 8000
```

### 3. Run the Streamlit UI
```bash
streamlit run streamlit_app.py
```

Open http://localhost:8501

## Demo Mode
If the FastAPI backend is not running, the app automatically enters **demo mode**:
- Any email/password combination is accepted
- Downloads are simulated with animated progress bars
- All UI features are fully explorable

## Features

### Download Tab
- URL input with video preview (thumbnail, title, uploader, duration)
- Format selector: MP4, WebM, MKV, MP3, M4A, Best
- Quality selector: Best, 4K, 1440p, 1080p, 720p, 480p, Audio
- Playlist mode toggle

### Queue Tab
- Live progress bars with auto-refresh
- Cancel queued jobs
- Status badges: queued / running / done / error / cancelled

### History Tab
- Paginated download history
- Error detail expanders for failed jobs

### Settings Tab
- `cookies.txt` upload (Netscape format)
- YouTube bookmarklet for auto cookie sync
- Session metrics card

## shadcn/ui Components Used
- `ui.tabs` — navigation & auth tabs  
- `ui.button` — all CTAs  
- `ui.input` — URL, email, password fields  
- `ui.select` — format & quality pickers  
- `ui.switch` — playlist toggle  
- `ui.alert_dialog` — error & confirmation dialogs  
- `ui.metric_card` — session stats  
