"""
yt-Z Downloader — Streamlit UI powered by streamlit-shadcn-ui
"""

import streamlit as st
import streamlit_shadcn_ui as ui
import asyncio
import threading
import uuid
import time
from datetime import datetime
from pathlib import Path

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="yt-Z Downloader",
    page_icon="⬇️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Custom CSS for dark, refined aesthetic ────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

/* Global reset */
html, body, [class*="css"] {
    font-family: 'Syne', sans-serif !important;
}

/* Dark background */
.stApp {
    background: #0c0c0f;
}

/* Main container */
.main .block-container {
    padding: 0 2rem 2rem 2rem;
    max-width: 900px;
    margin: 0 auto;
}

/* Remove default Streamlit chrome padding */
header[data-testid="stHeader"] {
    background: transparent;
    border-bottom: 1px solid #1e1e26;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0c0c0f; }
::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 2px; }

/* Headings */
h1, h2, h3 {
    font-family: 'Syne', sans-serif !important;
    letter-spacing: -0.02em;
}

/* Tabs override */
[data-baseweb="tab-list"] {
    background: #13131a !important;
    border-bottom: 1px solid #1e1e28 !important;
    gap: 0 !important;
}
[data-baseweb="tab"] {
    background: transparent !important;
    color: #666 !important;
    font-family: 'Syne', sans-serif !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.05em !important;
    text-transform: uppercase !important;
    padding: 0.75rem 1.5rem !important;
    border-bottom: 2px solid transparent !important;
    transition: all 0.2s ease !important;
}
[data-baseweb="tab"]:hover {
    color: #e0e0e8 !important;
    background: rgba(255,255,255,0.03) !important;
}
[aria-selected="true"][data-baseweb="tab"] {
    color: #a78bfa !important;
    border-bottom: 2px solid #a78bfa !important;
    background: transparent !important;
}

/* Input styles */
.stTextInput > div > div > input {
    background: #13131a !important;
    border: 1px solid #1e1e28 !important;
    color: #e0e0e8 !important;
    font-family: 'DM Mono', monospace !important;
    font-size: 0.88rem !important;
    border-radius: 6px !important;
    transition: border-color 0.2s ease !important;
}
.stTextInput > div > div > input:focus {
    border-color: #a78bfa !important;
    box-shadow: 0 0 0 3px rgba(167,139,250,0.1) !important;
}

/* Selectbox */
.stSelectbox > div > div {
    background: #13131a !important;
    border: 1px solid #1e1e28 !important;
    color: #e0e0e8 !important;
    border-radius: 6px !important;
}

/* File uploader */
.stFileUploader {
    background: #13131a !important;
    border: 1px dashed #2a2a35 !important;
    border-radius: 8px !important;
}

/* Cards/metric containers */
div[data-testid="metric-container"] {
    background: #13131a;
    border: 1px solid #1e1e28;
    border-radius: 8px;
    padding: 1rem;
}

/* Progress bar */
.stProgress > div > div > div {
    background: linear-gradient(90deg, #7c3aed, #a78bfa) !important;
    border-radius: 4px !important;
}
.stProgress > div > div {
    background: #1e1e28 !important;
    border-radius: 4px !important;
}

/* Alerts */
.stAlert {
    border-radius: 8px !important;
    border: none !important;
    font-size: 0.88rem !important;
}

/* Checkbox */
.stCheckbox label {
    color: #aaa !important;
    font-size: 0.88rem !important;
}

/* Expander */
.streamlit-expanderHeader {
    background: #13131a !important;
    border: 1px solid #1e1e28 !important;
    border-radius: 6px !important;
    color: #888 !important;
    font-size: 0.85rem !important;
}

/* Labels */
.stTextInput label, .stSelectbox label, .stFileUploader label {
    color: #888 !important;
    font-size: 0.78rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    margin-bottom: 0.3rem !important;
}

/* Divider */
hr {
    border-color: #1e1e28 !important;
    margin: 1.5rem 0 !important;
}

/* Mono badge */
.badge-mono {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    background: #1e1e28;
    color: #888;
    padding: 0.2em 0.5em;
    border-radius: 4px;
    display: inline-block;
}

/* Status pill */
.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    font-weight: 500;
    padding: 0.25em 0.65em;
    border-radius: 99px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}
.status-queued   { background: #1e1e28; color: #888; }
.status-running  { background: #1a1a2e; color: #a78bfa; }
.status-done     { background: #0f2a1a; color: #4ade80; }
.status-error    { background: #2a1010; color: #f87171; }
.status-cancelled { background: #1e1e28; color: #666; }

/* Job card */
.job-card {
    background: #13131a;
    border: 1px solid #1e1e28;
    border-radius: 10px;
    padding: 1rem 1.2rem;
    margin-bottom: 0.75rem;
    transition: border-color 0.2s ease;
}
.job-card:hover { border-color: #2a2a40; }
.job-title {
    font-weight: 700;
    font-size: 0.92rem;
    color: #e0e0e8;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.job-url {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    color: #555;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.5rem;
}
.job-meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
}

/* Thumbnail */
.thumb-wrap {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 8px;
    overflow: hidden;
    background: #1e1e28;
    margin-bottom: 1rem;
}
.thumb-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Wordmark */
.wordmark {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: #e0e0e8;
    display: flex;
    align-items: baseline;
    gap: 0.1em;
    padding: 1.5rem 0 0.75rem 0;
}
.wordmark span {
    color: #7c3aed;
}

/* Info preview card */
.preview-card {
    background: #13131a;
    border: 1px solid #1e1e28;
    border-radius: 10px;
    overflow: hidden;
    margin-top: 1rem;
}
.preview-body {
    padding: 1rem 1.2rem;
}
.preview-title {
    font-size: 1rem;
    font-weight: 700;
    color: #e0e0e8;
    margin-bottom: 0.25rem;
    line-height: 1.3;
}
.preview-sub {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: #666;
}

/* Section heading */
.section-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 1rem;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #1e1e28;
}

/* Cookie card */
.cookie-note {
    background: #0e1520;
    border: 1px solid #1a2540;
    border-radius: 8px;
    padding: 0.9rem 1.1rem;
    font-size: 0.82rem;
    color: #6b8cba;
    line-height: 1.6;
}
</style>
""", unsafe_allow_html=True)

# ── Session state defaults ────────────────────────────────────────────────────
def init_state():
    defaults = {
        "token": None,
        "email": None,
        "jobs": {},           # job_id -> job dict
        "preview_info": None,
        "auth_tab": "Login",
        "active_tab": "Download",
        "cookie_status": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

init_state()

# ── Async helpers ─────────────────────────────────────────────────────────────
def run_async(coro):
    """Run a coroutine synchronously from Streamlit's thread."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result(timeout=30)
        else:
            return loop.run_until_complete(coro)
    except Exception:
        return asyncio.run(coro)

# ── Fake job runner (mirrors queue.py logic for local Streamlit demo) ─────────
def _mock_job_runner(job_id: str):
    """Background thread that simulates download progress."""
    import random
    job = st.session_state.jobs.get(job_id)
    if not job:
        return
    job["status"] = "running"
    progress = 0.0
    while progress < 100.0:
        time.sleep(0.4)
        progress = min(100.0, progress + random.uniform(4, 12))
        job["progress"] = round(progress, 1)
        if job.get("_cancel"):
            job["status"] = "cancelled"
            return
    job["status"] = "done"
    job["progress"] = 100.0
    job["finished_at"] = datetime.utcnow().isoformat()

# ── Auth helpers (calls real FastAPI when backend is running) ─────────────────
API_BASE = "http://localhost:8000"

def api_login(email: str, password: str):
    import requests
    try:
        r = requests.post(f"{API_BASE}/auth/login",
                          json={"email": email, "password": password}, timeout=5)
        if r.status_code == 200:
            return r.json()["access_token"], None
        return None, r.json().get("detail", "Login failed")
    except Exception as e:
        return None, f"Backend offline — running in demo mode. ({e})"

def api_register(email: str, password: str):
    import requests
    try:
        r = requests.post(f"{API_BASE}/auth/register",
                          json={"email": email, "password": password}, timeout=5)
        if r.status_code == 200:
            return r.json()["access_token"], None
        return None, r.json().get("detail", "Registration failed")
    except Exception as e:
        return None, f"Backend offline — demo mode. ({e})"

def api_get_info(url: str):
    import requests
    if not st.session_state.token:
        return None, "Not authenticated"
    try:
        r = requests.get(f"{API_BASE}/api/info",
                         params={"url": url},
                         headers={"Authorization": f"Bearer {st.session_state.token}"},
                         timeout=20)
        if r.status_code == 200:
            return r.json(), None
        return None, r.json().get("detail", "Failed to fetch info")
    except Exception:
        # Demo mode: return fake info
        return {
            "title": "Demo Video Title (Backend Offline)",
            "uploader": "Demo Channel",
            "duration": 245,
            "thumbnail": "https://picsum.photos/seed/ytvid/640/360",
        }, None

def api_start_download(url, fmt, quality, playlist):
    import requests
    if not st.session_state.token:
        return None, "Not authenticated"
    try:
        r = requests.post(
            f"{API_BASE}/api/download",
            json={"url": url, "format": fmt, "quality": quality, "playlist": playlist},
            headers={"Authorization": f"Bearer {st.session_state.token}"},
            timeout=10,
        )
        if r.status_code == 200:
            return r.json(), None
        return None, r.json().get("detail", "Failed to start download")
    except Exception:
        # Demo mode: create a local mock job
        job_id = str(uuid.uuid4())
        job = {
            "id": job_id,
            "url": url,
            "format": fmt,
            "quality": quality,
            "playlist": playlist,
            "status": "queued",
            "progress": 0.0,
            "title": st.session_state.preview_info.get("title", url) if st.session_state.preview_info else url,
            "created_at": datetime.utcnow().isoformat(),
            "finished_at": None,
            "filepath": None,
            "error_msg": None,
            "_cancel": False,
        }
        st.session_state.jobs[job_id] = job
        t = threading.Thread(target=_mock_job_runner, args=(job_id,), daemon=True)
        t.start()
        return job, None

def api_cancel_job(job_id):
    import requests
    # Try local first
    if job_id in st.session_state.jobs:
        st.session_state.jobs[job_id]["_cancel"] = True
        st.session_state.jobs[job_id]["status"] = "cancelled"
        return True
    try:
        r = requests.delete(
            f"{API_BASE}/api/queue/{job_id}",
            headers={"Authorization": f"Bearer {st.session_state.token}"},
            timeout=5,
        )
        return r.status_code == 200
    except Exception:
        return False

def api_get_history():
    import requests
    try:
        r = requests.get(
            f"{API_BASE}/api/downloads",
            headers={"Authorization": f"Bearer {st.session_state.token}"},
            timeout=5,
        )
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    # Return done/cancelled local jobs
    return [j for j in st.session_state.jobs.values()
            if j.get("status") in ("done", "cancelled", "error")]

def api_upload_cookies(file_bytes):
    import requests
    try:
        r = requests.post(
            f"{API_BASE}/api/settings/cookies/upload",
            files={"file": ("cookies.txt", file_bytes, "text/plain")},
            headers={"Authorization": f"Bearer {st.session_state.token}"},
            timeout=10,
        )
        return r.status_code == 200, r.json().get("message", "Unknown response")
    except Exception as e:
        return False, f"Demo mode — cookie upload simulated. ({e})"

# ── Utility ───────────────────────────────────────────────────────────────────
def fmt_duration(secs):
    if not secs:
        return "—"
    secs = int(secs)
    h, m, s = secs // 3600, (secs % 3600) // 60, secs % 60
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"

def status_pill(status):
    icons = {"queued": "○", "running": "◉", "done": "●", "error": "✕", "cancelled": "⊘"}
    icon = icons.get(status, "○")
    return f'<span class="status-pill status-{status}">{icon} {status}</span>'

def live_queue_jobs():
    """Get jobs that are still active (queued or running)."""
    return [j for j in st.session_state.jobs.values()
            if j.get("status") in ("queued", "running")]

# ════════════════════════════════════════════════════════════════════════════
#  PAGE: AUTH
# ════════════════════════════════════════════════════════════════════════════
def render_auth():
    st.markdown('<div class="wordmark">yt-<span>Z</span></div>', unsafe_allow_html=True)
    st.markdown("##### Download anything. Fast.")

    col, _ = st.columns([1.2, 1])
    with col:
        tab = ui.tabs(
            options=["Login", "Register"],
            default_value=st.session_state.auth_tab,
            key="auth_tab_widget",
        )

        st.markdown("<br>", unsafe_allow_html=True)

        email = ui.input(
            default_value="",
            placeholder="you@example.com",
            type="text",
            key="auth_email",
        )
        password = ui.input(
            default_value="",
            placeholder="Password",
            type="password",
            key="auth_password",
        )

        st.markdown("<br>", unsafe_allow_html=True)

        if tab == "Login":
            clicked = ui.button("Sign in →", key="login_btn", variant="default", class_name="w-full")
            if clicked and email and password:
                with st.spinner("Signing in…"):
                    token, err = api_login(email, password)
                if err and "demo" not in err.lower():
                    ui.alert_dialog(
                        show=True,
                        title="Login failed",
                        description=err,
                        confirm_label="OK",
                        cancel_label="",
                        key="login_err_dialog",
                    )
                else:
                    if token:
                        st.session_state.token = token
                    else:
                        # Demo mode auto-login
                        st.session_state.token = "demo-token"
                    st.session_state.email = email
                    st.rerun()
        else:
            clicked = ui.button("Create account →", key="reg_btn", variant="default", class_name="w-full")
            if clicked and email and password:
                with st.spinner("Creating account…"):
                    token, err = api_register(email, password)
                if err and "demo" not in err.lower():
                    ui.alert_dialog(
                        show=True,
                        title="Registration failed",
                        description=err,
                        confirm_label="OK",
                        cancel_label="",
                        key="reg_err_dialog",
                    )
                else:
                    st.session_state.token = token or "demo-token"
                    st.session_state.email = email
                    st.rerun()

        st.markdown("""
        <p style="font-size:0.75rem;color:#444;margin-top:1.5rem;line-height:1.6;">
        Backend offline? The app runs in <strong style="color:#666;">demo mode</strong> — 
        use any credentials to explore the UI.
        </p>
        """, unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════════════════
#  PAGE: MAIN APP
# ════════════════════════════════════════════════════════════════════════════
def render_app():
    # ── Top bar ──────────────────────────────────────────────────────────────
    c1, c2, c3 = st.columns([1, 4, 1])
    with c1:
        st.markdown('<div class="wordmark" style="padding:1rem 0 0.5rem">yt-<span>Z</span></div>',
                    unsafe_allow_html=True)
    with c3:
        st.markdown("<br>", unsafe_allow_html=True)
        logout = ui.button("Logout", key="logout_btn", variant="outline")
        if logout:
            for k in ["token", "email", "jobs", "preview_info", "cookie_status"]:
                if k in st.session_state:
                    del st.session_state[k]
            st.rerun()

    # User badge
    if st.session_state.email:
        st.markdown(
            f'<span class="badge-mono">⬤&nbsp; {st.session_state.email}</span>',
            unsafe_allow_html=True,
        )

    st.markdown("<hr>", unsafe_allow_html=True)

    # ── Nav tabs ─────────────────────────────────────────────────────────────
    active_jobs = live_queue_jobs()
    tab_options = [
        "Download",
        f"Queue ({len(active_jobs)})" if active_jobs else "Queue",
        "History",
        "Settings",
    ]
    tab = ui.tabs(
        options=tab_options,
        default_value=tab_options[0],
        key="main_tabs",
    )

    st.markdown("<br>", unsafe_allow_html=True)

    if "Download" in (tab or ""):
        render_download_tab()
    elif "Queue" in (tab or ""):
        render_queue_tab()
    elif "History" in (tab or ""):
        render_history_tab()
    elif "Settings" in (tab or ""):
        render_settings_tab()


# ── Download tab ──────────────────────────────────────────────────────────────
def render_download_tab():
    st.markdown('<div class="section-label">Video URL</div>', unsafe_allow_html=True)

    url = ui.input(
        default_value="",
        placeholder="https://youtube.com/watch?v=  or playlist URL…",
        type="text",
        key="dl_url",
    )

    col1, col2, col3 = st.columns([1, 1, 1])
    with col1:
        fmt = ui.select(
            options=["mp4", "webm", "mkv", "mp3", "m4a", "best"],
            label="Format",
            key="dl_format",
        ) or "mp4"
    with col2:
        is_audio = fmt in ("mp3", "m4a")
        quality_opts = (
            ["audio"] if is_audio
            else ["best", "4k", "1440p", "1080p", "720p", "480p"]
        )
        quality = ui.select(
            options=quality_opts,
            label="Quality",
            key="dl_quality",
        ) or quality_opts[0]
    with col3:
        st.markdown("<br>", unsafe_allow_html=True)
        playlist = ui.switch(
            default_checked=False,
            label="Playlist mode",
            key="playlist_toggle",
        )

    st.markdown("<br>", unsafe_allow_html=True)

    btn_col1, btn_col2, _ = st.columns([1, 1, 2])
    with btn_col1:
        preview_clicked = ui.button("Preview", key="preview_btn", variant="outline")
    with btn_col2:
        dl_clicked = ui.button("⬇ Download", key="dl_btn", variant="default")

    # ── Preview ───────────────────────────────────────────────────────────────
    if preview_clicked:
        if not url:
            ui.alert_dialog(
                show=True, title="URL required",
                description="Please enter a video URL first.",
                confirm_label="OK", cancel_label="", key="url_required_dlg",
            )
        else:
            with st.spinner("Fetching video info…"):
                info, err = api_get_info(url)
            if err:
                st.error(f"Error: {err}")
            else:
                st.session_state.preview_info = info

    if st.session_state.preview_info:
        info = st.session_state.preview_info
        st.markdown('<div class="section-label" style="margin-top:1.5rem">Preview</div>',
                    unsafe_allow_html=True)
        p_col1, p_col2 = st.columns([1, 2])
        with p_col1:
            thumb = info.get("thumbnail")
            if thumb:
                st.image(thumb, use_container_width=True)
        with p_col2:
            st.markdown(f"""
            <div class="preview-body" style="padding:0">
                <div class="preview-title">{info.get('title','Unknown')}</div>
                <div class="preview-sub">
                    {info.get('uploader','—')} &nbsp;·&nbsp; {fmt_duration(info.get('duration'))}
                </div>
            </div>
            """, unsafe_allow_html=True)
            # Format badges
            fmts = info.get("formats", [])
            if fmts:
                heights = sorted(
                    set(f["height"] for f in fmts if f.get("height")),
                    reverse=True,
                )[:6]
                badges = " ".join(
                    f'<span class="badge-mono">{h}p</span>' for h in heights
                )
                st.markdown(f"<br>{badges}", unsafe_allow_html=True)

    # ── Start download ─────────────────────────────────────────────────────────
    if dl_clicked:
        if not url:
            st.error("Please enter a URL.")
        else:
            with st.spinner("Queuing download…"):
                job, err = api_start_download(url, fmt, quality, bool(playlist))
            if err:
                st.error(f"Error: {err}")
            else:
                if job and isinstance(job, dict) and "id" in job:
                    st.session_state.jobs[job["id"]] = {**job, "_cancel": False}
                st.success("Download queued! Check the **Queue** tab.")
                st.session_state.preview_info = None


# ── Queue tab ─────────────────────────────────────────────────────────────────
def render_queue_tab():
    active = live_queue_jobs()

    if not active:
        st.markdown("""
        <div style="text-align:center;padding:3rem 0;color:#444">
            <div style="font-size:2rem;margin-bottom:0.5rem">⬜</div>
            <div style="font-size:0.88rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Queue empty</div>
            <div style="font-size:0.78rem;margin-top:0.25rem;color:#333">Start a download from the Download tab</div>
        </div>
        """, unsafe_allow_html=True)
        return

    st.markdown(f'<div class="section-label">{len(active)} active job{"s" if len(active)!=1 else ""}</div>',
                unsafe_allow_html=True)

    for job in active:
        jid = job["id"]
        status = job.get("status", "queued")
        progress = job.get("progress", 0.0)

        with st.container():
            st.markdown(f"""
            <div class="job-card">
                <div class="job-title">{job.get('title') or 'Untitled'}</div>
                <div class="job-url">{job.get('url','')}</div>
                <div class="job-meta">
                    {status_pill(status)}
                    <span class="badge-mono">{job.get('format','?').upper()}</span>
                    <span class="badge-mono">{job.get('quality','?')}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

            if status == "running":
                st.progress(int(progress), text=f"{progress:.1f}%")
            elif status == "queued":
                st.progress(0, text="Waiting…")

            c1, c2 = st.columns([1, 5])
            with c1:
                if ui.button("Cancel", key=f"cancel_{jid}", variant="outline"):
                    api_cancel_job(jid)
                    st.rerun()

    # Auto-refresh while jobs are running
    running = any(j.get("status") == "running" for j in active)
    if running:
        time.sleep(1.5)
        st.rerun()


# ── History tab ───────────────────────────────────────────────────────────────
def render_history_tab():
    st.markdown('<div class="section-label">Download history</div>', unsafe_allow_html=True)

    jobs = api_get_history()

    if not jobs:
        st.markdown("""
        <div style="text-align:center;padding:3rem 0;color:#444">
            <div style="font-size:2rem;margin-bottom:0.5rem">📂</div>
            <div style="font-size:0.88rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">No history yet</div>
        </div>
        """, unsafe_allow_html=True)
        return

    for job in reversed(jobs):
        status = job.get("status", "done")
        title = job.get("title") or job.get("url", "Unknown")
        created = job.get("created_at", "")[:16].replace("T", " ")
        finished = (job.get("finished_at") or "")[:16].replace("T", " ")

        st.markdown(f"""
        <div class="job-card">
            <div class="job-title">{title}</div>
            <div class="job-url">{job.get('url','')}</div>
            <div class="job-meta">
                {status_pill(status)}
                <span class="badge-mono">{job.get('format','?').upper()}</span>
                <span class="badge-mono">{job.get('quality','?')}</span>
                <span class="badge-mono" style="color:#444">{created}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

        if job.get("error_msg"):
            with st.expander("Error details"):
                st.code(job["error_msg"], language=None)


# ── Settings tab ──────────────────────────────────────────────────────────────
def render_settings_tab():
    st.markdown('<div class="section-label">Cookie Authentication</div>', unsafe_allow_html=True)

    st.markdown("""
    <div class="cookie-note">
    🍪 &nbsp;<strong>Why cookies?</strong> Some platforms (YouTube members-only, age-restricted content)
    require authentication. Export your browser cookies as a <code>cookies.txt</code> (Netscape format) 
    using a browser extension like <em>Get cookies.txt</em>, then upload it here.
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<div class="section-label">Upload cookies.txt</div>', unsafe_allow_html=True)

    uploaded = st.file_uploader(
        "cookies.txt",
        type=["txt"],
        key="cookie_upload",
        help="Netscape HTTP Cookie File format",
        label_visibility="collapsed",
    )

    if uploaded:
        col1, _ = st.columns([1, 3])
        with col1:
            if ui.button("Upload cookies", key="upload_cookie_btn", variant="default"):
                ok, msg = api_upload_cookies(uploaded.read())
                st.session_state.cookie_status = (ok, msg)

    if st.session_state.cookie_status:
        ok, msg = st.session_state.cookie_status
        if ok:
            ui.alert_dialog(
                show=True, title="Cookies uploaded",
                description=msg,
                confirm_label="OK", cancel_label="",
                key="cookie_ok_dlg",
            )
            st.session_state.cookie_status = None
        else:
            st.warning(msg)

    st.markdown("<hr>", unsafe_allow_html=True)
    st.markdown('<div class="section-label">Bookmarklet (YouTube auto-sync)</div>', unsafe_allow_html=True)

    bookmarklet_code = """javascript:(function(){
  var cs=document.cookie.split(';').map(c=>{var p=c.trim().split('=');return{name:p[0],value:p.slice(1).join('='),domain:location.hostname,path:'/',secure:true};});
  fetch('http://localhost:8000/api/settings/cookies/youtube',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer TOKEN'},body:JSON.stringify({cookies:cs})}).then(r=>r.json()).then(d=>alert('yt-Z: '+d.message)).catch(e=>alert('Error: '+e));
})();"""

    st.code(bookmarklet_code, language="javascript")
    st.markdown("""
    <p style="font-size:0.78rem;color:#555;line-height:1.6;">
    Replace <code>TOKEN</code> with your Bearer token, then drag this snippet to your bookmarks bar.
    Click it while on YouTube to automatically sync your session cookies.
    </p>
    """, unsafe_allow_html=True)

    st.markdown("<hr>", unsafe_allow_html=True)
    st.markdown('<div class="section-label">Session</div>', unsafe_allow_html=True)

    cols = st.columns(4)
    with cols[0]:
        ui.metric_card(
            title="User",
            content=st.session_state.email or "—",
            description="Logged in",
            key="metric_user",
        )
    with cols[1]:
        total = len(st.session_state.jobs)
        ui.metric_card(
            title="Total jobs",
            content=str(total),
            description="this session",
            key="metric_jobs",
        )
    with cols[2]:
        done = sum(1 for j in st.session_state.jobs.values() if j.get("status") == "done")
        ui.metric_card(
            title="Completed",
            content=str(done),
            description="downloads",
            key="metric_done",
        )
    with cols[3]:
        mode = "Demo" if st.session_state.token == "demo-token" else "Live"
        ui.metric_card(
            title="Mode",
            content=mode,
            description="API connection",
            key="metric_mode",
        )


# ════════════════════════════════════════════════════════════════════════════
#  ROUTER
# ════════════════════════════════════════════════════════════════════════════
if not st.session_state.token:
    render_auth()
else:
    render_app()
