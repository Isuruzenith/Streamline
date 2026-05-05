# Streamline

Streamline is a FlameonLabs project: an open-source WebUI for `yt-dlp` where you paste a URL, preview the media, choose formats, and download through a local Bun-powered server.

Built with the FlameonLabs carbon and ember brand system: warm technical surfaces, ember accents, and practical local-first tooling for builders.

## Status

Streamline now covers the full PRD phase set:

- M1 Foundation: Bun server, WebUI, provisioning script, environment health and repair.
- M2 Core Download: URL preview, format picker, single-item downloads, progress, logs, default Downloads output.
- M3 Queue and Playlist: sequential queue, reorder, cancel, playlist item selection, history, completion notifications.
- M4 Full Feature Parity: subtitles, thumbnails, metadata, chapters, SponsorBlock, cookies, archive, rate limits, concurrent fragments, filename templates, and custom `yt-dlp` flags.
- M5 Launch: README, docs landing page, CI, and publish workflow.

## Install

```bash
bun install
bun run build
bun start
```

For the CLI package flow:

```bash
bun install -g streamline
streamline
```

The app opens a local server, defaulting to [http://localhost:7979](http://localhost:7979). If the port is busy, the CLI tries the next available port.

## Development

```bash
bun install --ignore-scripts
bun run dev
```

The Vite frontend runs on `5173`, and the Bun/Elysia backend runs on `7979`.

## Provisioning

`scripts/provision.js` creates `~/.streamline` with:

- `python-build-standalone` Python 3.11
- an isolated virtual environment
- `yt-dlp[default,curl-cffi]`
- `imageio[ffmpeg]`
- an `env.json` manifest consumed by the server

Run this manually to repair a local environment:

```bash
bun scripts/provision.js
```

## Cookie Authentication

Authenticated downloads can use either an uploaded `cookies.txt` file or the browser import control in Settings. Cookies stay local under `~/.streamline/cookies.txt` and are passed directly to `yt-dlp`.

## Advanced Downloads

Streamline exposes common `yt-dlp` power features in the WebUI:

- audio extraction format and quality
- manual and automatic subtitles
- thumbnail saving and embedded cover art
- metadata and chapters
- SponsorBlock segment removal
- download archive
- bandwidth limit and concurrent fragments
- custom `yt-dlp` flags for expert workflows

## Docs

Open [docs/index.html](docs/index.html) for the launch landing page content.
