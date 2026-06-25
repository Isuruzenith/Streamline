# Streamline

### **A gorgeous, high-performance WebUI for yt-dlp**

  Download high-fidelity video and audio from 1000+ platforms — YouTube, TikTok, Instagram, Twitter/X, Facebook, SoundCloud, and more.

  [![npm version](https://img.shields.io/npm/v/streamline-md?color=ff5733&style=flat-square)](https://www.npmjs.com/package/streamline-md)
  [![License](https://img.shields.io/npm/l/streamline-md?color=33ff57&style=flat-square)](LICENSE)
  [![Bun Version](https://img.shields.io/badge/runtime-Bun-%23000000.svg?style=flat-square&logo=bun&logoColor=white)](https://bun.sh)
  [![Node Compatibility](https://img.shields.io/badge/node-%3E%3D%2018.0.0-blue.svg?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
  [![GitHub stars](https://img.shields.io/github/stars/flameonlabs/streamline?style=flat-square&color=gold)](https://github.com/flameonlabs/streamline/stargazers)

<br />



</div>

---

## ✨ Features

- **1000+ Platforms Supported** — Powered by `yt-dlp` to download content from YouTube, TikTok, Instagram, Twitter/X, SoundCloud, Bandcamp, and hundreds of others.
- **Smart Format Picker** — Quickly select target resolution (4K, 1080p, 720p, 480p) or extract audio-only; defaults to the best available MP4.
- **Interactive Download Queue** — Real-time sequential queue management with drag-to-reorder, pause/resume, and retry capabilities.
- **Live Streamed Logs** — Keep track of active downloads with live stdout/stderr logs streamed via WebSockets to a sleek terminal panel.
- **Persistent History** — A local download history index with direct shortcuts to open downloaded files in your OS file manager.
- **Playlist Downloader** — Paste playlist links, preview all entries, checklist-select specific tracks, and download them in batch.
- **Advanced Post-Processing** — Embedded subtitles, cover art/thumbnails, SponsorBlock skip integration, download speed limiting, and custom yt-dlp arguments.
- **Cookie Authentication** — Drag-and-drop or upload your browser `cookies.txt` file to bypass age restriction gates or fetch member-only videos.
- **Adaptive Theme Engine** — Toggle fluidly between dark and light modes, with system preference synced to `localStorage`.
- **System Notifications** — Stay informed with desktop/browser notifications when background downloads complete.

---

## 🚀 Quick Start

### Prerequisites

Streamline manages its own isolated dependencies (Python, yt-dlp, and ffmpeg) automatically on the first start. You only need a few base tools:

| Requirement               | Supported Version | Role in Streamline                                                            |
|:------------------------- |:----------------- |:----------------------------------------------------------------------------- |
| **[Bun](https://bun.sh)** | `>= 1.1`          | Recommended high-performance JS runtime & package manager                     |
| **Python**                | `>= 3.9`          | Required backend parser tool for running `yt-dlp` subprocesses                |
| **yt-dlp**                | `latest`          | Auto-installed and self-updated inside the app's isolated virtual environment |
| **ffmpeg**                | `bundled`         | Auto-downloaded during provisioning to handle stream merges and conversions  |

### Install & Run

You can run Streamline instantly without a manual clone, or install it globally on your system.

> [!NOTE]
> Make sure to use the correct **`streamline-md`** package name.

#### Run instantly (No install needed)
```bash
npx streamline-md
```

#### Option A: Install globally via Bun
```bash
bun add -g streamline-md
```
```bash
streamline-md
```

#### Option B: Install globally via npm
```bash
npm install -g streamline-md
```
```bash
streamline-md
```

Once started, the application will automatically launch your default browser and open at **[http://localhost:7979](http://localhost:7979)**.

### 🧹 Uninstalling

If you ever need to clean up and remove the global installation:

#### Remove via npm
```bash
npm uninstall -g streamline-md
```

#### Remove via Bun
```bash
bun remove -g streamline-md
```

### Development Setup

To modify Streamline or run from source:

```bash
# 1. Clone the repository
git clone https://github.com/flameonlabs/streamline.git
cd streamline

# 2. Install dev and runtime dependencies
bun install

# 3. Start development servers concurrently
bun run dev
```

- **Frontend Hot-Reloading:** [http://localhost:5200](http://localhost:5200)
- **Backend API Server:** [http://localhost:7979](http://localhost:7979)
- **WebSocket Gateway:** `ws://localhost:7979/ws`

---

## 🖥️ Usage Walkthrough

1. **Paste a Link:** Drop any video or audio URL into the main input bar. Streamline will automatically query the link and parse available formats.
2. **Configure Settings:** Choose your preferred video resolution, toggle audio-only mode, or customize filenames in the right sidebar.
3. **Queue it Up:** Click **Download** to instantly push the item into the queue.
4. **Monitor Real-time:** Watch progress percentages, speed metrics, and estimated time of arrival (ETA) update in the queue. Expand the logs panel to see raw yt-dlp process outputs.
5. **Open & Enjoy:** When complete, click the folder icon next to the item to open the downloaded file directly on your computer.

### Batch Downloads

Toggle the **Batch** option next to the URL input to paste multiple video links at once (one per line). Click **Download All** to push all entries into the processing queue.

### Downloading Playlists

When a playlist URL (e.g., YouTube playlist, Album) is detected, Streamline displays a checklist of all contained tracks. Choose which videos you want to keep, customize individual formats, and click **Download Selected**.

---

## ⚙️ Settings Directory

### General Customization

| Configuration         | Default Value            | Description                                            |
|:--------------------- |:------------------------ |:------------------------------------------------------ |
| **Output directory**  | `~/Downloads/Streamline` | Absolute destination folder for completed media files. |
| **Filename template** | `%(title)s.%(ext)s`      | Standard `yt-dlp` output formatting template.          |

### Technical Download Flags

| Flag / Option            | Default     | Purpose / Details                                                       |
|:------------------------ |:----------- |:----------------------------------------------------------------------- |
| **Video format**         | `MP4`       | Primary format target container for video streams.                      |
| **Audio format**         | `MP3`       | Output audio format target (when downloading audio-only).               |
| **Subtitles**            | `Off`       | Auto-extracts and embeds subtitle tracks into the file.                 |
| **Embed metadata**       | `Off`       | Saves artist, description, cover art, and upload dates into media tags. |
| **SponsorBlock**         | `Off`       | Skips sponsor ads, intros, and outros automatically.                    |
| **Concurrent fragments** | `8`         | Number of simultaneous network connections for faster downloads.        |
| **Rate limit**           | `Unlimited` | Throttle maximum download speed to save bandwidth.                      |
| **Custom flags**         | `-`         | Append arbitrary `yt-dlp` command-line flags.                           |

### Cookie Authentication

For age-gated, private, or members-only videos, export your browser session cookies using a browser extension (such as *Get cookies.txt* in Netscape format) and upload them under **Settings → Cookie Authentication**. Streamline loads them securely for authorized yt-dlp calls.

### Isolated Environment

If any binary is reported missing or becomes corrupted, go to **Settings → Environment** and click **Repair**. This will clean and re-install local Python environments and CLI helpers.

---

## 🏗️ Architecture Design

```text
streamline/
├── server/                  # Bun + Elysia API server
│   ├── index.js             # Entrypoint & websocket registration
│   ├── routes/              # Express-like REST controllers
│   │   ├── download.js      # Queue control and interaction
│   │   ├── formats.js       # yt-dlp metadata parser
│   │   ├── env.js           # Sandbox health & repairs
│   │   ├── history.js       # Download registry
│   │   └── cookies.js       # Cookie file manager
│   ├── services/            # Core business logic layer
│   │   ├── ytdlp.js         # Spawns & monitors yt-dlp sub-processes
│   │   ├── queue.js         # Sequential download queue pipeline
│   │   ├── environment.js   # Python venv & dependency provisioner
│   │   ├── history.js       # JSON history reader/writer
│   │   ├── cookies.js       # Netscape cookies parser
│   │   └── temp.js          # Temporary files garbage collector
│   └── ws/
│       └── handler.js       # WebSocket multiplexer & subscriber list
│
├── src/                     # React Single Page App (Vite)
│   ├── App.jsx              # App layout shell
│   ├── pages/               # Route views (Downloads, History, Settings)
│   ├── components/          # Reusable UI widgets
│   ├── hooks/               # State hooks (Zustand store & WebSockets)
│   └── lib/utils.js         # Spacing, formatting, CSS utils
│
├── bin/streamline.js        # Executable binary for npx / global installs
├── scripts/
│   └── provision.js         # Sandboxed dependency setup script
└── dist/                    # Static built assets (built via Vite)
```

### Data Pipeline Overview

```
[User Action: Paste URL] ──> GET /api/formats ──> [yt-dlp --dump-json] ──> Return Media Info
                                                                                 │
[User Action: Download] <────────────────────────────────────────────────────────┘
  │
  └──> POST /api/download ──> [DownloadQueue.add()] ──> [processNext()]
                                                               │
     ┌─────────────────────────────────────────────────────────┘
     ▼
[ytdlp.startDownload()] ──> stdout/stderr piped ──> parseProgress()
                                                        │
     ┌──────────────────────────────────────────────────┘
     ▼
[queue.emit('progress'|'log')] ──> [wsManager.broadcast()] ──> [WebSocket client]
                                                                        │
     ┌──────────────────────────────────────────────────────────────────┘
     ▼
[Zustand useStore] ──> State Mutation ──> React virtual DOM re-render
```

---

## 🔌 API Reference Guide

### REST API Endpoints

| HTTP Method | Route path                  | Purpose / Details                                     |
|:----------- |:--------------------------- |:----------------------------------------------------- |
| `GET`       | `/api/formats?url=...`      | Fetches parsed video/audio options and metadata.      |
| `POST`      | `/api/download`             | Appends a URL format selection to the download queue. |
| `GET`       | `/api/download/status`      | Queries current queue size and status of each item.   |
| `DELETE`    | `/api/download/:id`         | Cancels an active download or removes a queued item.  |
| `POST`      | `/api/download/retry`       | Re-queues a previously failed download task.          |
| `PATCH`     | `/api/download/reorder`     | Update index positions of queued tasks.               |
| `POST`      | `/api/download/open-folder` | Opens the output folder in OS Finder/Explorer.        |
| `GET`       | `/api/history`              | Fetches the full download history array.              |
| `DELETE`    | `/api/history`              | Clears all records from history.json.                 |
| `GET`       | `/api/env`                  | Checks the status of Python, yt-dlp, and ffmpeg.      |
| `POST`      | `/api/env/repair`           | Triggers a background environment repair job.         |
| `WS`        | `/ws`                       | WebSocket route for real-time progress and logs.      |

### WebSocket Payload Spec (Server ──> Client)

| Event Key        | Payload Properties                                     | When is it sent?                                                |
|:---------------- |:------------------------------------------------------ |:--------------------------------------------------------------- |
| `started`        | `{ downloadId }`                                       | When the yt-dlp child process has successfully spawned.         |
| `progress`       | `{ downloadId, progress, speed, eta, filesize, line }` | Incremental download updates parsed from stdout.                |
| `merging`        | `{ downloadId, line }`                                 | Sent when ffmpeg begins merging high-quality video and audio.   |
| `complete`       | `{ downloadId, filepath, title }`                      | File is finalized and moved to the destination folder.          |
| `error`          | `{ downloadId, error }`                                | The download failed or was interrupted by a subprocess crash.   |
| `log`            | `{ downloadId, line }`                                 | Raw output lines emitted by yt-dlp (for the Live Logs console). |
| `paused`         | `{ downloadId, progress }`                             | Task is temporarily paused in the queue.                        |
| `env_status`     | `{ data }`                                             | Current provisioning status updates.                            |
| `provision_log`  | `{ line }`                                             | Raw stdout/stderr lines from the provision script.              |
| `provision_done` | `{ success }`                                          | Sent when environment repair or installation is completed.      |

---

## 🛠️ Diagnostics & Troubleshooting

#### Downloads are frozen at 0%

- Inspect **Settings → Environment** to ensure all tool status dots are green.
- Fragmented video files (e.g. YouTube 1080p and higher) require merging separate video and audio tracks. Progress will jump in blocks once segments finish caching.
- Click the terminal icon next to the downloading item to read raw `yt-dlp` logs.

#### "Sign in to confirm you're not a bot"

- Drop netscape cookies file into **Settings → Cookie Authentication**.
- Make sure to export cookies while logged out or from an active Private/Incognito browser window.

#### WebSocket is disconnected

- Streamline will automatically try to reconnect with exponential backoff.
- Check if your server port is occupied or if a browser extension is blocking socket traffic.

#### yt-dlp / ffmpeg is missing

- Open settings and execute **Repair Environment**. Streamline downloads self-contained binaries to your user directory (`~/.streamline/`).

---

## 🤝 Contributing Guidelines

We welcome pull requests and issues! Please follow standard practices:

```bash
# Run the test suite
bun run test

# Run server-side unit tests
bun run test:server

# Build production client bundle
bun run build
```

---

## 📄 License

Licensed under the [MIT License](LICENSE) © [FlameonLabs](https://flameonlabs.com).

<br />

<div align="center">
  <sub>Made with ♥ by <a href="https://flameonlabs.com">FlameonLabs</a></sub>
</div>


