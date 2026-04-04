"""
Streamline — Personal Video Downloader
A Streamlit UI for yt-dlp with shadcn/ui dark theme.
"""

import streamlit as st
import asyncio
import threading
import uuid
import time
from datetime import datetime
from pathlib import Path

st.set_page_config(
    page_title="Streamline — Personal Video Downloader",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="collapsed",
)


def inject_design_system():
    """Inject shadcn/ui default dark theme tokens, Geist fonts, and Streamlit widget overrides."""
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');

    :root {
      --background:             0 0% 3.9%;
      --foreground:             0 0% 98%;
      --card:                   0 0% 3.9%;
      --card-foreground:        0 0% 98%;
      --popover:                0 0% 3.9%;
      --popover-foreground:     0 0% 98%;
      --primary:                0 0% 98%;
      --primary-foreground:     0 0% 9%;
      --secondary:              0 0% 14.9%;
      --secondary-foreground:   0 0% 98%;
      --muted:                  0 0% 14.9%;
      --muted-foreground:       0 0% 63.9%;
      --accent:                 0 0% 14.9%;
      --accent-foreground:      0 0% 98%;
      --destructive:            0 62.8% 30.6%;
      --destructive-foreground: 0 0% 98%;
      --border:                 0 0% 14.9%;
      --input:                  0 0% 14.9%;
      --ring:                   0 0% 83.1%;
      --radius:                 0.5rem;
    }

    html, body, [class*="css"] {
      font-family: 'Geist', -apple-system, sans-serif !important;
      -webkit-font-smoothing: antialiased;
    }
    .stApp {
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
    }
    .main .block-container {
      padding: 0 1.5rem 2rem 1.5rem;
      max-width: 1100px;
    }
    header[data-testid="stHeader"] {
      background: hsl(var(--background));
      border-bottom: 1px solid hsl(var(--border));
    }

    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea,
    .stNumberInput > div > div > input {
      background-color: hsl(var(--input)) !important;
      border: 1px solid hsl(var(--border)) !important;
      border-radius: var(--radius) !important;
      color: hsl(var(--foreground)) !important;
      font-family: 'Geist', sans-serif !important;
      font-size: 0.875rem !important;
      height: 36px;
      padding: 0 0.75rem !important;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .stTextArea > div > div > textarea { height: auto; padding: 0.5rem 0.75rem !important; }
    .stTextInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus,
    .stNumberInput > div > div > input:focus {
      border-color: hsl(var(--ring)) !important;
      box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2) !important;
      outline: none !important;
    }
    .stTextInput label, .stTextArea label, .stNumberInput label,
    .stSelectbox label, .stMultiSelect label, .stSlider label,
    .stDateInput label, .stFileUploader label, .stCheckbox label,
    .stRadio label span, .stToggle label {
      color: hsl(var(--muted-foreground)) !important;
      font-size: 0.75rem !important;
      font-weight: 500 !important;
      letter-spacing: 0.025em !important;
    }

    .stSelectbox > div > div,
    .stMultiSelect > div > div {
      background-color: hsl(var(--input)) !important;
      border: 1px solid hsl(var(--border)) !important;
      border-radius: var(--radius) !important;
      color: hsl(var(--foreground)) !important;
      font-size: 0.875rem !important;
      min-height: 36px !important;
    }
    .stSelectbox > div > div:focus-within,
    .stMultiSelect > div > div:focus-within {
      border-color: hsl(var(--ring)) !important;
    }

    .stButton > button {
      font-family: 'Geist', sans-serif !important;
      font-size: 0.875rem !important;
      font-weight: 500 !important;
      height: 36px;
      padding: 0 1rem !important;
      border-radius: var(--radius) !important;
      transition: opacity 0.15s, background-color 0.15s !important;
      cursor: pointer;
    }
    .stButton > button[kind="primary"] {
      background-color: hsl(var(--primary)) !important;
      color: hsl(var(--primary-foreground)) !important;
      border: none !important;
    }
    .stButton > button[kind="primary"]:hover { opacity: 0.9 !important; }
    .stButton > button[kind="secondary"],
    .stButton > button:not([kind]) {
      background-color: hsl(var(--secondary)) !important;
      color: hsl(var(--secondary-foreground)) !important;
      border: 1px solid hsl(var(--border)) !important;
    }
    .stButton > button[kind="secondary"]:hover,
    .stButton > button:not([kind]):hover {
      background-color: hsl(var(--accent)) !important;
    }

    [data-baseweb="tab-list"] {
      background: transparent !important;
      border-bottom: 1px solid hsl(var(--border)) !important;
      gap: 0 !important;
    }
    [data-baseweb="tab"] {
      background: transparent !important;
      color: hsl(var(--muted-foreground)) !important;
      font-family: 'Geist', sans-serif !important;
      font-size: 0.875rem !important;
      font-weight: 500 !important;
      padding: 0.625rem 1rem !important;
      border-bottom: 2px solid transparent !important;
      transition: color 0.15s, border-color 0.15s !important;
    }
    [data-baseweb="tab"]:hover { color: hsl(var(--foreground)) !important; }
    [aria-selected="true"][data-baseweb="tab"] {
      color: hsl(var(--foreground)) !important;
      border-bottom-color: hsl(var(--foreground)) !important;
    }

    .streamlit-expanderHeader {
      background-color: hsl(var(--card)) !important;
      border: 1px solid hsl(var(--border)) !important;
      border-radius: var(--radius) !important;
      color: hsl(var(--foreground)) !important;
      font-family: 'Geist', sans-serif !important;
      font-size: 0.875rem !important;
      font-weight: 500 !important;
      padding: 0.625rem 1rem !important;
    }
    .streamlit-expanderContent {
      border: 1px solid hsl(var(--border)) !important;
      border-top: none !important;
      border-radius: 0 0 var(--radius) var(--radius) !important;
      background-color: hsl(var(--card)) !important;
      padding: 1rem !important;
    }

    .stProgress > div > div {
      background-color: hsl(var(--secondary)) !important;
      border-radius: 9999px !important;
      height: 6px !important;
    }
    .stProgress > div > div > div {
      background-color: hsl(var(--foreground)) !important;
      border-radius: 9999px !important;
    }

    .stCheckbox > label > div:first-child { border-radius: calc(var(--radius) / 2) !important; }
    .stAlert {
      border-radius: var(--radius) !important;
      border-width: 1px !important;
      font-size: 0.875rem !important;
    }
    .stDataFrame { border: 1px solid hsl(var(--border)) !important; border-radius: var(--radius) !important; }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: hsl(var(--background)); }
    ::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }

    .stFileUploader > div {
      background-color: hsl(var(--card)) !important;
      border: 1px dashed hsl(var(--border)) !important;
      border-radius: var(--radius) !important;
    }

    hr { border-color: hsl(var(--border)) !important; margin: 1.5rem 0 !important; }
    code, .stCode {
      font-family: 'Geist Mono', monospace !important;
      font-size: 0.8125rem !important;
      background-color: hsl(var(--secondary)) !important;
      border-radius: calc(var(--radius) / 2) !important;
      padding: 0.125rem 0.375rem !important;
    }
    .stCodeBlock {
      background-color: hsl(var(--card)) !important;
      border: 1px solid hsl(var(--border)) !important;
      border-radius: var(--radius) !important;
    }

    .mono { font-family: 'Geist Mono', monospace !important; }

    .sl-card {
      background-color: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
    }
    .sl-badge {
      display: inline-flex; align-items: center;
      border-radius: 9999px;
      font-family: 'Geist Mono', monospace;
      font-size: 0.6875rem; font-weight: 500;
      padding: 0.125rem 0.625rem;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .sl-badge-default  { background: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); }
    .sl-badge-success  { background: hsl(142 76% 10%); color: hsl(142 76% 60%); border: 1px solid hsl(142 76% 20%); }
    .sl-badge-error    { background: hsl(var(--destructive) / 0.15); color: hsl(0 80% 65%); border: 1px solid hsl(var(--destructive)); }
    .sl-badge-warning  { background: hsl(38 92% 10%); color: hsl(38 92% 60%); border: 1px solid hsl(38 92% 20%); }
    .sl-badge-running  { background: hsl(217 91% 10%); color: hsl(217 91% 65%); border: 1px solid hsl(217 91% 20%); }
    .sl-section {
      font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.1em;
      text-transform: uppercase; color: hsl(var(--muted-foreground));
      display: flex; align-items: center; gap: 0.75rem;
      margin: 1.25rem 0 0.875rem 0;
    }
    .sl-section::after {
      content: ''; flex: 1; height: 1px; background: hsl(var(--border));
    }
    .sl-code-preview {
      font-family: 'Geist Mono', monospace; font-size: 0.78125rem;
      background: hsl(var(--card)); border: 1px solid hsl(var(--border));
      border-radius: var(--radius); padding: 0.875rem 1rem;
      color: hsl(var(--muted-foreground)); line-height: 1.6;
      white-space: pre-wrap; word-break: break-all;
    }
    .sl-code-preview .hl { color: hsl(var(--foreground)); }
    .sl-job-card {
      background: hsl(var(--card)); border: 1px solid hsl(var(--border));
      border-radius: var(--radius); padding: 1rem 1.25rem;
      margin-bottom: 0.625rem;
      transition: border-color 0.15s;
    }
    .sl-job-card:hover { border-color: hsl(var(--ring) / 0.5); }
    .sl-job-title {
      font-size: 0.9375rem; font-weight: 600;
      color: hsl(var(--foreground));
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }
    .sl-job-meta {
      font-family: 'Geist Mono', monospace;
      font-size: 0.6875rem; color: hsl(var(--muted-foreground));
      display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;
      margin-bottom: 0.625rem;
    }
    .sl-progress-detail {
      font-family: 'Geist Mono', monospace;
      font-size: 0.6875rem; color: hsl(var(--muted-foreground));
      margin-top: 0.375rem;
      display: flex; gap: 1.25rem;
    }
    .sl-wordmark {
      font-family: 'Geist', sans-serif;
      font-size: 1.25rem; font-weight: 700;
      letter-spacing: -0.025em;
      color: hsl(var(--foreground));
    }
    .sl-empty-state {
      text-align: center; padding: 3rem 1rem;
      color: hsl(var(--muted-foreground));
    }
    .sl-empty-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .sl-empty-title {
      font-size: 0.875rem; font-weight: 600;
      letter-spacing: 0.025em; margin-bottom: 0.25rem;
      color: hsl(var(--muted-foreground));
    }
    .sl-empty-sub { font-size: 0.75rem; color: hsl(var(--border)); }
    </style>
    """, unsafe_allow_html=True)


inject_design_system()


def init_state():
    defaults = {
        "token": None,
        "email": None,
        "jobs": {},
        "preview_info": None,
        "cookie_status": None,
        "dl_opts": {
            "format": "mp4",
            "quality": "best",
            "playlist": False,
            "embed_metadata": False,
            "embed_thumbnail": False,
            "write_subs": False,
            "write_auto_subs": False,
            "subtitles_langs": [],
            "extract_audio": False,
            "sponsorblock": None,
            "rate_limit": None,
            "proxy_url": None,
        },
        "defaults": {},
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


init_state()


API_BASE = "http://localhost:8000"


def run_async(coro):
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


def _mock_job_runner(job_id: str):
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
        return {
            "title": "Demo Video Title (Backend Offline)",
            "uploader": "Demo Channel",
            "duration": 245,
            "thumbnail": "https://picsum.photos/seed/ytvid/640/360",
        }, None


def api_start_download(url, opts):
    import requests
    if not st.session_state.token:
        return None, "Not authenticated"
    try:
        r = requests.post(
            f"{API_BASE}/api/download",
            json={"url": url, **opts},
            headers={"Authorization": f"Bearer {st.session_state.token}"},
            timeout=10,
        )
        if r.status_code == 200:
            return r.json(), None
        return None, r.json().get("detail", "Failed to start download")
    except Exception:
        job_id = str(uuid.uuid4())
        job = {
            "id": job_id,
            "url": url,
            "format": opts.get("format", "mp4"),
            "quality": opts.get("quality", "best"),
            "playlist": opts.get("playlist", False),
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


def fmt_bytes(n):
    if not n:
        return "—"
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def fmt_speed(bps):
    if not bps:
        return "—"
    return fmt_bytes(int(bps)) + "/s"


def fmt_duration(secs):
    if not secs:
        return "—"
    secs = int(secs)
    h, m, s = secs // 3600, (secs % 3600) // 60, secs % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def card(content, cls=""):
    return f'<div class="sl-card {cls}">{content}</div>'


def badge(text, variant="default"):
    return f'<span class="sl-badge sl-badge-{variant}">{text}</span>'


def status_badge(status):
    icons = {"queued": "○", "running": "◉", "done": "●", "error": "✕", "cancelled": "⊘", "finished": "●"}
    variant_map = {"queued": "default", "running": "running", "done": "success", "finished": "success", "error": "error", "cancelled": "default"}
    icon = icons.get(status, "○")
    variant = variant_map.get(status, "default")
    return badge(f"{icon} {status}", variant)


def section_heading(text):
    st.markdown(f'<div class="sl-section">{text}</div>', unsafe_allow_html=True)


def wordmark():
    return '<span class="sl-wordmark">Streamline</span>'


def empty_state(icon, title, subtitle=""):
    st.markdown(f"""
    <div class="sl-empty-state">
      <div class="sl-empty-icon">{icon}</div>
      <div class="sl-empty-title">{title}</div>
      <div class="sl-empty-sub">{subtitle}</div>
    </div>
    """, unsafe_allow_html=True)


def live_queue_jobs():
    return [j for j in st.session_state.jobs.values()
            if j.get("status") in ("queued", "running")]


def render_auth():
    _, col, _ = st.columns([1, 1.2, 1])
    with col:
        st.markdown("<br><br>", unsafe_allow_html=True)
        st.markdown(f'{wordmark()}', unsafe_allow_html=True)
        st.markdown(
            '<p style="color:hsl(var(--muted-foreground));font-size:0.875rem;margin:0.25rem 0 1.5rem">Personal video downloader</p>',
            unsafe_allow_html=True
        )

        tab = st.tabs(["Sign in", "Register"])

        with tab[0]:
            st.markdown("<br>", unsafe_allow_html=True)
            email = st.text_input("Email", placeholder="you@example.com", key="auth_email_login")
            password = st.text_input("Password", type="password", placeholder="Password", key="auth_pw_login")
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("Sign in →", key="login_btn", use_container_width=True, type="primary"):
                if email and password:
                    with st.spinner(""):
                        token, err = api_login(email, password)
                    if err and "demo" not in err.lower():
                        st.error(err)
                    else:
                        st.session_state.token = token or "demo-token"
                        st.session_state.email = email
                        st.rerun()

        with tab[1]:
            st.markdown("<br>", unsafe_allow_html=True)
            email = st.text_input("Email", placeholder="you@example.com", key="auth_email_reg")
            password = st.text_input("Password", type="password", placeholder="Choose a password", key="auth_pw_reg")
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("Create account →", key="reg_btn", use_container_width=True, type="primary"):
                if email and password:
                    with st.spinner(""):
                        token, err = api_register(email, password)
                    if err and "demo" not in err.lower():
                        st.error(err)
                    else:
                        st.session_state.token = token or "demo-token"
                        st.session_state.email = email
                        st.rerun()

        st.markdown(
            '<p style="font-size:0.75rem;color:hsl(var(--border));margin-top:1.5rem;text-align:center">Backend offline? Use any credentials — demo mode.</p>',
            unsafe_allow_html=True
        )


def render_app():
    c1, c2, c3 = st.columns([2, 6, 2])
    with c1:
        st.markdown(f'<div style="padding:1rem 0 0.5rem">{wordmark()}</div>', unsafe_allow_html=True)
    with c3:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Sign out", key="logout_btn"):
            for k in ["token", "email", "jobs", "preview_info", "cookie_status", "dl_opts", "format_data"]:
                st.session_state.pop(k, None)
            st.rerun()

    if st.session_state.email:
        mode = "demo" if st.session_state.token == "demo-token" else "live"
        st.markdown(
            f'<div style="font-family:\'Geist Mono\',monospace;font-size:0.6875rem;color:hsl(var(--muted-foreground));padding-bottom:0.5rem">● {st.session_state.email} <span style="opacity:0.5">· {mode} mode</span></div>',
            unsafe_allow_html=True
        )

    st.markdown("<hr>", unsafe_allow_html=True)

    active_count = len([j for j in st.session_state.jobs.values() if j.get("status") in ("queued", "running")])
    queue_label = f"Queue ({active_count})" if active_count else "Queue"

    tabs = st.tabs(["Download", queue_label, "Formats", "History", "Settings"])

    with tabs[0]:
        render_download_tab()
    with tabs[1]:
        render_queue_tab()
    with tabs[2]:
        render_formats_tab()
    with tabs[3]:
        render_history_tab()
    with tabs[4]:
        render_settings_tab()


def render_download_tab():
    section_heading("Video URL")

    url = st.text_input(
        "URL",
        placeholder="https://youtube.com/watch?v=  or playlist URL…",
        key="dl_url",
    )

    col1, col2, col3 = st.columns([1, 1, 1])
    with col1:
        fmt = st.selectbox(
            "Format",
            options=["mp4", "webm", "mkv", "mp3", "m4a", "best"],
            key="dl_format",
        )
    with col2:
        is_audio = fmt in ("mp3", "m4a")
        quality_opts = ["audio"] if is_audio else ["best", "4k", "1440p", "1080p", "720p", "480p"]
        quality = st.selectbox(
            "Quality",
            options=quality_opts,
            key="dl_quality",
        )
    with col3:
        st.markdown("<br>", unsafe_allow_html=True)
        playlist = st.checkbox("Playlist mode", key="playlist_toggle")

    with st.expander("Advanced Options", expanded=False):
        col1, col2 = st.columns(2)
        with col1:
            embed_metadata = st.checkbox("Embed metadata", key="opt_embed_metadata")
            embed_thumbnail = st.checkbox("Embed thumbnail", key="opt_embed_thumbnail")
            write_subs = st.checkbox("Write subtitles", key="opt_write_subs")
            extract_audio = st.checkbox("Extract audio only", key="opt_extract_audio")
        with col2:
            sponsorblock = st.selectbox(
                "SponsorBlock",
                options=[None, "mark", "remove"],
                format_func=lambda x: "None" if x is None else x.capitalize(),
                key="opt_sponsorblock",
            )
            rate_limit = st.text_input("Rate limit (e.g. 1M)", key="opt_rate_limit")
            proxy_url = st.text_input("Proxy URL", key="opt_proxy_url")

    st.markdown("<br>", unsafe_allow_html=True)

    btn_col1, btn_col2, btn_col3 = st.columns([1, 1, 2])
    with btn_col1:
        preview_clicked = st.button("Preview", key="preview_btn", use_container_width=True)
    with btn_col2:
        formats_clicked = st.button("List Formats", key="formats_btn", use_container_width=True)
    with btn_col3:
        dl_clicked = st.button("⬇ Download", key="dl_btn", use_container_width=True, type="primary")

    if preview_clicked:
        if not url:
            st.error("Please enter a URL.")
        else:
            with st.spinner("Fetching video info…"):
                info, err = api_get_info(url)
            if err:
                st.error(f"Error: {err}")
            else:
                st.session_state.preview_info = info

    if st.session_state.preview_info:
        info = st.session_state.preview_info
        st.markdown('<div class="sl-section">Preview</div>', unsafe_allow_html=True)
        p_col1, p_col2 = st.columns([1, 2])
        with p_col1:
            thumb = info.get("thumbnail")
            if thumb:
                st.image(thumb, use_container_width=True)
        with p_col2:
            st.markdown(f"""
            <div class="sl-card" style="padding:0">
                <div class="sl-job-title">{info.get('title','Unknown')}</div>
                <div class="sl-job-meta">
                    {info.get('uploader','—')} &nbsp;·&nbsp; {fmt_duration(info.get('duration'))}
                </div>
            </div>
            """, unsafe_allow_html=True)

    if dl_clicked:
        if not url:
            st.error("Please enter a URL.")
        else:
            opts = {
                "format": fmt,
                "quality": quality,
                "playlist": playlist,
                "embed_metadata": embed_metadata,
                "embed_thumbnail": embed_thumbnail,
                "write_subs": write_subs,
                "extract_audio": extract_audio,
                "sponsorblock": sponsorblock,
                "rate_limit": rate_limit if rate_limit else None,
                "proxy_url": proxy_url if proxy_url else None,
            }
            with st.spinner("Queuing download…"):
                job, err = api_start_download(url, opts)
            if err:
                st.error(f"Error: {err}")
            else:
                if job and isinstance(job, dict) and "id" in job:
                    st.session_state.jobs[job["id"]] = {**job, "_cancel": False}
                st.success("Download queued! Check the **Queue** tab.")
                st.session_state.preview_info = None


def render_queue_tab():
    active = live_queue_jobs()

    if not active:
        empty_state("⬜", "Queue empty", "Start a download from the Download tab")
        return

    section_heading(f"{len(active)} active download{'s' if len(active)>1 else ''}")

    for job in active:
        jid = job["id"]
        status = job.get("status", "queued")
        progress = job.get("progress", 0.0)
        detail = job.get("progress_detail", {})

        meta_parts = [
            status_badge(status),
            badge(job.get("format", "?").upper()),
            badge(job.get("quality", "?")),
        ]
        if job.get("playlist"):
            meta_parts.append(badge("playlist", "warning"))

        st.markdown(f"""
        <div class="sl-job-card">
          <div class="sl-job-title">{job.get('title') or 'Fetching title…'}</div>
          <div class="sl-job-meta">
            {''.join(meta_parts)}
            <span style="opacity:0.5">{(job.get('url',''))[:60]}…</span>
          </div>
        </div>
        """, unsafe_allow_html=True)

        if status == "running":
            st.progress(min(int(progress), 100))
            speed = fmt_speed(detail.get("speed"))
            eta_raw = detail.get("eta")
            eta = f"{int(eta_raw//60)}:{int(eta_raw%60):02d}" if eta_raw else "—"
            downloaded = fmt_bytes(detail.get("downloaded_bytes"))
            total = fmt_bytes(detail.get("total_bytes") or detail.get("total_bytes_estimate"))
            st.markdown(f"""
            <div class="sl-progress-detail">
              <span>↓ {speed}</span>
              <span>ETA {eta}</span>
              <span>{downloaded} / {total}</span>
            </div>
            """, unsafe_allow_html=True)
        elif status == "queued":
            st.progress(0, text="Waiting…")

        c1, c2 = st.columns([1, 5])
        with c1:
            if st.button("Cancel", key=f"cancel_{jid}", use_container_width=True):
                api_cancel_job(jid)
                st.rerun()

    running = any(j.get("status") == "running" for j in active)
    if running:
        time.sleep(1.5)
        st.rerun()


def render_formats_tab():
    section_heading("Inspect Formats")

    url = st.text_input("URL to inspect", placeholder="https://youtube.com/watch?v=...", key="formats_url")

    if st.button("Fetch Formats", key="fetch_formats_btn"):
        if not url:
            st.error("Please enter a URL.")
        else:
            with st.spinner("Fetching formats…"):
                try:
                    import requests
                    r = requests.get(
                        f"{API_BASE}/api/formats",
                        params={"url": url},
                        headers={"Authorization": f"Bearer {st.session_state.token}"},
                        timeout=30,
                    )
                    if r.status_code == 200:
                        data = r.json()
                        st.session_state.format_data = data
                    else:
                        st.error(f"Error: {r.json().get('detail', 'Failed')}")
                except Exception as e:
                    st.error(f"Error: {e}")

    if st.session_state.get("format_data"):
        data = st.session_state.format_data
        st.markdown(f"**{data.get('title', 'Unknown')}**")
        st.markdown(f"_{data.get('uploader', '—')} · {fmt_duration(data.get('duration'))}_")

        formats = data.get("formats", [])
        video_fmts = [f for f in formats if f.get("is_video")]
        audio_fmts = [f for f in formats if f.get("is_audio")]

        if video_fmts:
            section_heading("Video Formats")
            st.dataframe(video_fmts, use_container_width=True)

        if audio_fmts:
            section_heading("Audio Formats")
            st.dataframe(audio_fmts, use_container_width=True)


def render_history_tab():
    section_heading("Download history")

    jobs = api_get_history()

    if not jobs:
        empty_state("📂", "No history yet", "Downloads will appear here")
        return

    for job in reversed(jobs):
        status = job.get("status", "done")
        title = job.get("title") or job.get("url", "Unknown")
        created = job.get("created_at", "")[:16].replace("T", " ")
        finished = (job.get("finished_at") or "")[:16].replace("T", " ")

        st.markdown(f"""
        <div class="sl-job-card">
            <div class="sl-job-title">{title}</div>
            <div class="sl-job-meta">
                {status_badge(status)}
                <span class="sl-badge sl-badge-default">{job.get('format','?').upper()}</span>
                <span class="sl-badge sl-badge-default">{job.get('quality','?')}</span>
                <span style="opacity:0.5">{created}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

        if job.get("error_msg"):
            with st.expander("Error details"):
                st.code(job["error_msg"], language=None)


def render_settings_tab():
    section_heading("Cookie Authentication")

    st.markdown("""
    <div class="sl-card">
    🍪 Some platforms require authentication cookies. Export your browser cookies as a <code>cookies.txt</code> (Netscape format) using a browser extension like <em>Get cookies.txt</em>, then upload it here.
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    uploaded = st.file_uploader(
        "Upload cookies.txt",
        type=["txt"],
        key="cookie_upload",
        help="Netscape HTTP Cookie File format",
        label_visibility="collapsed",
    )

    if uploaded:
        col1, _ = st.columns([1, 3])
        with col1:
            if st.button("Upload cookies", key="upload_cookie_btn", use_container_width=True, type="primary"):
                ok, msg = api_upload_cookies(uploaded.read())
                if ok:
                    st.success(msg)
                else:
                    st.warning(msg)

    st.markdown("<hr>", unsafe_allow_html=True)
    section_heading("Session")

    cols = st.columns(4)
    with cols[0]:
        st.metric("User", st.session_state.email or "—")
    with cols[1]:
        total = len(st.session_state.jobs)
        st.metric("Total jobs", total)
    with cols[2]:
        done = sum(1 for j in st.session_state.jobs.values() if j.get("status") == "done")
        st.metric("Completed", done)
    with cols[3]:
        mode = "Demo" if st.session_state.token == "demo-token" else "Live"
        st.metric("Mode", mode)


if not st.session_state.token:
    render_auth()
else:
    render_app()
