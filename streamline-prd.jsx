import { useState } from "react";

const sections = [
  {
    id: "overview",
    label: "Overview",
    icon: "◈",
    content: {
      type: "overview",
    },
  },
  {
    id: "personas",
    label: "Users & Personas",
    icon: "◉",
    content: { type: "personas" },
  },
  {
    id: "install",
    label: "Installation Flow",
    icon: "◎",
    content: { type: "install" },
  },
  {
    id: "setup",
    label: "Environment Panel",
    icon: "◌",
    content: { type: "setup" },
  },
  {
    id: "webui",
    label: "WebUI Features",
    icon: "▣",
    content: { type: "webui" },
  },
  {
    id: "download",
    label: "Download Engine",
    icon: "↓",
    content: { type: "download" },
  },
  {
    id: "auth",
    label: "Auth & Cookies",
    icon: "⚿",
    content: { type: "auth" },
  },
  {
    id: "tech",
    label: "Tech Stack",
    icon: "⬡",
    content: { type: "tech" },
  },
  {
    id: "milestones",
    label: "Milestones",
    icon: "◷",
    content: { type: "milestones" },
  },
  {
    id: "openqs",
    label: "Open Questions",
    icon: "?",
    content: { type: "openqs" },
  },
];

const Badge = ({ children, color = "default" }) => {
  const colors = {
    default: { bg: "rgba(142,142,160,0.12)", text: "#8e8ea0" },
    green: { bg: "rgba(16,185,129,0.12)", text: "#10b981" },
    orange: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
    red: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
    blue: { bg: "rgba(99,102,241,0.12)", text: "#818cf8" },
    sand: { bg: "rgba(212,196,166,0.15)", text: "#d4c4a6" },
  };
  const c = colors[color] || colors.default;
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.02em",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {children}
    </span>
  );
};

const Tag = ({ children }) => (
  <span
    style={{
      display: "inline-block",
      background: "rgba(212,196,166,0.08)",
      border: "1px solid rgba(212,196,166,0.15)",
      color: "#a89880",
      padding: "2px 7px",
      borderRadius: "3px",
      fontSize: "11px",
      fontFamily: "'DM Mono', monospace",
      marginRight: "4px",
      marginBottom: "4px",
    }}
  >
    {children}
  </span>
);

const Card = ({ children, accent = false, style = {} }) => (
  <div
    style={{
      background: accent
        ? "rgba(212,196,166,0.04)"
        : "rgba(255,255,255,0.02)",
      border: `1px solid ${accent ? "rgba(212,196,166,0.18)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: "10px",
      padding: "18px 20px",
      marginBottom: "12px",
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <div
    style={{
      fontSize: "11px",
      fontFamily: "'DM Mono', monospace",
      color: "#8e8ea0",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "16px",
      marginTop: "28px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
  >
    <span
      style={{
        display: "inline-block",
        width: "20px",
        height: "1px",
        background: "rgba(142,142,160,0.4)",
      }}
    />
    {children}
  </div>
);

const Pill = ({ label, value, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 14px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "8px",
    }}
  >
    <span style={{ color: "#8e8ea0", fontSize: "12px", fontFamily: "'DM Mono', monospace" }}>
      {label}
    </span>
    <span style={{ marginLeft: "auto" }}>
      <Badge color={color}>{value}</Badge>
    </span>
  </div>
);

function FlowStep({ number, title, description, tags = [], status }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        marginBottom: "4px",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "rgba(212,196,166,0.1)",
            border: "1px solid rgba(212,196,166,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontFamily: "'DM Mono', monospace",
            color: "#d4c4a6",
            flexShrink: 0,
          }}
        >
          {number}
        </div>
        <div
          style={{
            width: "1px",
            flex: 1,
            background: "rgba(212,196,166,0.1)",
            marginTop: "4px",
            marginBottom: "4px",
            minHeight: "16px",
          }}
        />
      </div>
      <Card style={{ flex: 1, marginBottom: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#e8e3db",
              fontFamily: "'Crimson Pro', Georgia, serif",
            }}
          >
            {title}
          </span>
          {status && <Badge color={status.color}>{status.label}</Badge>}
        </div>
        <p
          style={{
            fontSize: "12.5px",
            color: "#9a9494",
            lineHeight: "1.6",
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {description}
        </p>
        {tags.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

const featureGroups = [
  {
    group: "URL Input & Preview",
    features: [
      { name: "Paste any URL", desc: "YouTube, Vimeo, Twitter/X, SoundCloud, 1000+ sites via yt-dlp extractors", priority: "P0" },
      { name: "Media preview card", desc: "Thumbnail, title, duration, uploader, upload date rendered before download", priority: "P0" },
      { name: "Format picker", desc: "All available video/audio formats with codec, resolution, bitrate, file size estimate", priority: "P0" },
      { name: "Playlist detection", desc: "Auto-detect playlists, show item count, allow select-all or individual item picking", priority: "P0" },
    ],
  },
  {
    group: "Download Options",
    features: [
      { name: "Video quality selector", desc: "Best, 4K, 1080p, 720p, 480p, 360p or custom format string", priority: "P0" },
      { name: "Audio-only extraction", desc: "MP3, AAC, FLAC, Opus, M4A with quality setting", priority: "P0" },
      { name: "Subtitle download", desc: "Auto-subs + manual subs, language selection, SRT/VTT/ASS formats", priority: "P1" },
      { name: "Thumbnail download", desc: "Save cover art / video thumbnail as JPG/PNG", priority: "P1" },
      { name: "Embed metadata", desc: "Title, artist, album, year embedded into file", priority: "P1" },
      { name: "Chapters", desc: "Split video into chapters or embed chapter markers", priority: "P1" },
      { name: "Download archive", desc: "yt-dlp --download-archive to avoid re-downloading", priority: "P2" },
      { name: "Rate limiting", desc: "Configurable bandwidth throttle", priority: "P2" },
      { name: "SponsorBlock", desc: "Skip or cut sponsor segments via SponsorBlock API", priority: "P2" },
    ],
  },
  {
    group: "Queue & Progress",
    features: [
      { name: "Queue panel", desc: "Add multiple URLs, process one by one, reorder via drag", priority: "P0" },
      { name: "Rich progress", desc: "Speed, ETA, file size, % bar per item", priority: "P0" },
      { name: "Collapsible log", desc: "Raw yt-dlp stderr/stdout toggle for power users", priority: "P0" },
      { name: "Completion toast", desc: "Desktop notification + in-app toast on finish", priority: "P1" },
      { name: "History tab", desc: "List of completed downloads with open-in-folder button", priority: "P1" },
    ],
  },
  {
    group: "Settings",
    features: [
      { name: "Output path", desc: "System Downloads default, overridable globally or per-download", priority: "P0" },
      { name: "Filename template", desc: "yt-dlp output template with live preview", priority: "P1" },
      { name: "Cookie passthrough", desc: "Browser cookie import for authenticated content (see Auth section)", priority: "P0" },
      { name: "ffmpeg path", desc: "Auto-detected from Python env, manual override available", priority: "P1" },
      { name: "Concurrent fragments", desc: "yt-dlp --concurrent-fragments setting for faster downloads", priority: "P2" },
      { name: "Custom yt-dlp flags", desc: "Advanced free-text field for raw yt-dlp arguments", priority: "P2" },
    ],
  },
];

const techStack = [
  { layer: "Runtime", tech: "Bun", role: "Single install command, cross-platform JS runtime", color: "sand" },
  { layer: "Backend server", tech: "Bun HTTP / Elysia", role: "Local HTTP server serving the WebUI + API routes", color: "sand" },
  { layer: "Python env", tech: "python-build-standalone 3.11", role: "Self-contained Python binary downloaded to ~/.streamline/python/. No system Python needed. Same approach as uv/Rye.", color: "orange" },
  { layer: "Downloader", tech: "yt-dlp", role: "pip install yt-dlp inside venv", color: "orange" },
  { layer: "Media processing", tech: "ffmpeg", role: "pip install imageio[ffmpeg] OR system binary detection", color: "orange" },
  { layer: "Frontend", tech: "React + Vite", role: "Served by Bun from /public, hot-reload in dev mode", color: "blue" },
  { layer: "Styling", tech: "Tailwind CSS + shadcn/ui", role: "Matches Claude-style clean UI", color: "blue" },
  { layer: "IPC", tech: "WebSocket (Bun native)", role: "Real-time yt-dlp progress streaming to WebUI", color: "green" },
  { layer: "Process management", tech: "Bun.spawn()", role: "Spawns yt-dlp subprocess, pipes stdout/stderr", color: "green" },
];

const milestones = [
  {
    phase: "M1 — Foundation",
    duration: "Week 1–2",
    goals: [
      "bun install -g streamline downloads python-build-standalone 3.11 + provisions venv, yt-dlp, ffmpeg",
      "postinstall script: OS/arch detection → download PBS → create venv → pip install → write env.json",
      "WebUI Environment panel in Settings: green/red bulb per dependency, Repair button with live log",
      "Basic URL input → yt-dlp --dump-json preview",
    ],
    status: { label: "Start here", color: "green" },
  },
  {
    phase: "M2 — Core Download",
    duration: "Week 3–4",
    goals: [
      "Format picker from dump-json output",
      "Single video download with progress via WebSocket",
      "Rich progress bar + collapsible log",
      "Saves to ~/Downloads",
    ],
    status: { label: "Core value", color: "blue" },
  },
  {
    phase: "M3 — Queue & Playlist",
    duration: "Week 5–6",
    goals: [
      "Queue panel with drag reorder",
      "Playlist detection + item selection",
      "Download history tab",
      "Completion notifications",
    ],
    status: { label: "UX polish", color: "orange" },
  },
  {
    phase: "M4 — Full Feature Parity",
    duration: "Week 7–9",
    goals: [
      "Subtitles, thumbnails, metadata embedding",
      "Cookie passthrough / browser auth",
      "Chapters, SponsorBlock",
      "Custom yt-dlp flags input",
      "Filename template editor",
    ],
    status: { label: "Power features", color: "sand" },
  },
  {
    phase: "M5 — Open Source Launch",
    duration: "Week 10",
    goals: [
      "README + docs site",
      "GitHub Actions CI (macOS, Windows, Linux)",
      "npm / bun publish pipeline",
      "Demo GIF + landing page",
    ],
    status: { label: "Ship it", color: "green" },
  },
];

const openQuestions = [
  {
    q: "Python provisioning strategy",
    detail:
      "RESOLVED: Streamline downloads python-build-standalone (indygreg) into ~/.streamline/python/ during bun install. No system Python required. No admin rights. System Python is always ignored. The only open sub-question is the GitHub release download URL strategy — should Streamline pin to a specific Python 3.11.x patch version or always resolve latest 3.11.x from the releases API?",
    options: ["Pin to Python 3.11.9 (stable, predictable)", "Always resolve latest 3.11.x from GitHub releases API", "Pin major.minor (3.11), auto-resolve patch on install"],
    priority: "P1",
  },
  {
    q: "ffmpeg acquisition on Windows",
    detail:
      "imageio[ffmpeg] via pip works cross-platform but gives an older ffmpeg build. Alternatively, download the official static binary from ffmpeg.org. Which takes priority?",
    options: ["imageio[ffmpeg] via pip (simple)", "Download official static binary (better quality)", "Detect system ffmpeg first, fallback to pip"],
    priority: "P0",
  },
  {
    q: "WebUI port conflict handling",
    detail: "Streamline will default to localhost:7979. What happens if that port is taken? Auto-increment? Let user configure?",
    options: ["Auto-increment port (7979 → 7980 → ...)", "Show error with manual --port flag hint", "Configurable via streamline.config.json"],
    priority: "P1",
  },
  {
    q: "yt-dlp update strategy",
    detail: "yt-dlp releases frequently (sites break often). Should Streamline auto-update yt-dlp on launch, or notify the user?",
    options: ["Auto-update yt-dlp silently on every launch", "Check weekly, notify user", "Manual 'Update' button in Settings"],
    priority: "P1",
  },
  {
    q: "Browser cookie passthrough security",
    detail: "Extracting cookies from Chrome/Firefox requires filesystem access to the cookie database. This is sensitive. How is this communicated to the user?",
    options: ["Show clear privacy notice before enabling", "Only support cookie file import (safer)", "Both: file import + browser extract with warning"],
    priority: "P1",
  },
];

function OverviewContent() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
          <Badge color="green">v0.1 — Draft</Badge>
          <Badge color="sand">Open Source</Badge>
          <Badge color="blue">Cross-platform</Badge>
          <Badge color="orange">Bun-powered</Badge>
        </div>
        <p style={{ fontSize: "15px", color: "#b8b0a6", lineHeight: "1.75", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          <strong style={{ color: "#e8e3db", fontFamily: "'Crimson Pro', serif", fontWeight: 600 }}>Streamline</strong> is an open-source, locally-run WebUI for{" "}
          <code style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#d4c4a6", background: "rgba(212,196,166,0.08)", padding: "1px 5px", borderRadius: "3px" }}>yt-dlp</code> — built on Bun so it installs with a single command on macOS, Windows, and Linux. Casual users get a beautiful paste-and-download experience. Power users get full yt-dlp feature access through an advanced settings panel.
        </p>
      </div>

      <SectionTitle>Key decisions</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <Pill label="Audience" value="Casual users" color="green" />
        <Pill label="Platforms" value="macOS · Windows · Linux" color="blue" />
        <Pill label="Runtime" value="Bun.js" color="sand" />
        <Pill label="UI style" value="Claude-inspired" color="default" />
        <Pill label="Downloads" value="System Downloads folder" color="default" />
        <Pill label="Queue mode" value="Sequential queue" color="orange" />
        <Pill label="Progress" value="Rich stats + log" color="green" />
        <Pill label="Auth" value="Browser cookie passthrough" color="red" />
        <Pill label="yt-dlp features" value="Full (everything)" color="blue" />
        <Pill label="Python" value="python-build-standalone (bundled)" color="green" />
      </div>

      <SectionTitle>Problem statement</SectionTitle>
      <Card accent>
        <p style={{ fontSize: "13px", color: "#9a9494", lineHeight: "1.7", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          yt-dlp is the most powerful media downloader available, but its CLI is intimidating for casual users. Existing WebUI wrappers require Docker, Python expertise, or complex setup. Streamline makes yt-dlp accessible to anyone with a single terminal command — then gets out of the way.
        </p>
      </Card>

      <SectionTitle>Success metrics</SectionTitle>
      {[
        { metric: "Time to first download", target: "< 3 minutes from bun install to first completed download", color: "green" },
        { metric: "Setup failure rate", target: "< 5% on supported OS + Python combinations", color: "green" },
        { metric: "Supported sites", target: "All yt-dlp extractors (~1800+ sites) work without config", color: "blue" },
        { metric: "Open source traction", target: "100 GitHub stars within 30 days of launch", color: "sand" },
      ].map((m) => (
        <div key={m.metric} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
          <div style={{ width: "3px", background: "rgba(212,196,166,0.2)", borderRadius: "2px", alignSelf: "stretch", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#c8c0b6", fontFamily: "'DM Mono', monospace", marginBottom: "2px" }}>{m.metric}</div>
            <div style={{ fontSize: "12.5px", color: "#8a8480", fontFamily: "'DM Sans', sans-serif" }}>{m.target}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PersonasContent() {
  const personas = [
    {
      name: "Maya",
      role: "Casual downloader",
      desc: "Downloads YouTube tutorials, music, and lecture videos for offline use. Not a developer. Has never used a terminal beyond copy-pasting commands from Stack Overflow.",
      needs: ["One command to install", "Paste URL → download, done", "No config files", "Clear error messages"],
      color: "green",
      icon: "◉",
    },
    {
      name: "Dev",
      role: "Power user / developer",
      desc: "Uses yt-dlp daily in scripts. Wants a GUI for quick one-offs without typing flags. Appreciates the raw log toggle and custom flag input.",
      needs: ["Full format control", "Custom yt-dlp flags", "Playlist management", "Cookie / auth support"],
      color: "blue",
      icon: "◈",
    },
    {
      name: "Kai",
      role: "Content researcher",
      desc: "Archives social media content, needs subtitle and metadata preservation, often downloads age-restricted or member-only content.",
      needs: ["Cookie passthrough / auth", "Subtitle + metadata embedding", "Download archive (no re-download)", "Batch playlist downloads"],
      color: "orange",
      icon: "◎",
    },
  ];
  return (
    <div>
      <p style={{ fontSize: "13px", color: "#9a9494", lineHeight: "1.7", fontFamily: "'DM Sans', sans-serif", marginBottom: "20px" }}>
        Primary audience is <strong style={{ color: "#c8c0b6" }}>casual users</strong>. The UI defaults are tuned for them. Power features exist but live behind a secondary layer.
      </p>
      {personas.map((p) => (
        <Card key={p.name} accent style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span style={{ fontSize: "18px", color: "#d4c4a6" }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#e8e3db", fontFamily: "'Crimson Pro', serif" }}>{p.name}</div>
              <div style={{ fontSize: "11px", color: "#8e8ea0", fontFamily: "'DM Mono', monospace" }}>{p.role}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><Badge color={p.color}>{p.color === "green" ? "Primary" : p.color === "blue" ? "Secondary" : "Tertiary"}</Badge></div>
          </div>
          <p style={{ fontSize: "12.5px", color: "#9a9494", lineHeight: "1.6", margin: "0 0 12px", fontFamily: "'DM Sans', sans-serif" }}>{p.desc}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {p.needs.map((n) => <Tag key={n}>{n}</Tag>)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function InstallContent() {
  return (
    <div>
      <SectionTitle>Install command</SectionTitle>
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(212,196,166,0.15)", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", fontFamily: "'DM Mono', monospace", fontSize: "14px" }}>
        <span style={{ color: "#8e8ea0" }}>$ </span>
        <span style={{ color: "#d4c4a6" }}>bun install</span>
        <span style={{ color: "#e8e3db" }}> -g streamline</span>
      </div>
      <p style={{ fontSize: "12.5px", color: "#9a9494", fontFamily: "'DM Sans', sans-serif", marginBottom: "20px", lineHeight: "1.6" }}>
        This installs the <code style={{ fontFamily: "'DM Mono', monospace", color: "#d4c4a6", fontSize: "12px" }}>streamline</code> global binary via Bun's package registry. No npm, no pip, no Homebrew required upfront. Bun handles the cross-platform binary distribution.
      </p>

      <SectionTitle>What happens during bun install -g streamline</SectionTitle>
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(212,196,166,0.15)", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", fontFamily: "'DM Mono', monospace", fontSize: "12px", lineHeight: "1.9" }}>
        <div><span style={{ color: "#8e8ea0" }}>$ </span><span style={{ color: "#d4c4a6" }}>bun install</span><span style={{ color: "#e8e3db" }}> -g streamline</span></div>
        <div style={{ marginTop: "8px", color: "#5a5a6a" }}>
          <div>▸ Installing streamline...</div>
          <div style={{ color: "#10b981" }}>✓ Streamline binary installed</div>
          <div style={{ color: "#5a5a6a" }}>▸ Downloading Python 3.11.9 (python-build-standalone)...</div>
          <div style={{ color: "#5a5a6a" }}>  → https://github.com/indygreg/python-build-standalone/releases/...</div>
          <div style={{ color: "#10b981" }}>✓ Python 3.11.9 installed at ~/.streamline/python/</div>
          <div style={{ color: "#5a5a6a" }}>▸ Creating isolated venv at ~/.streamline/venv/</div>
          <div style={{ color: "#10b981" }}>✓ venv created</div>
          <div style={{ color: "#5a5a6a" }}>▸ Installing yt-dlp...</div>
          <div style={{ color: "#10b981" }}>✓ yt-dlp 2024.11.18 installed</div>
          <div style={{ color: "#5a5a6a" }}>▸ Installing ffmpeg via imageio...</div>
          <div style={{ color: "#10b981" }}>✓ ffmpeg 6.1 installed</div>
          <div style={{ color: "#5a5a6a" }}>▸ Writing ~/.streamline/env.json...</div>
          <div style={{ color: "#818cf8", marginTop: "6px" }}>✓ All dependencies ready — no Python install required. Run: streamline</div>
        </div>
      </div>

      <Card accent style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "12.5px", color: "#9a9494", lineHeight: "1.6", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          <strong style={{ color: "#d4c4a6" }}>Key principle:</strong> Streamline uses <strong style={{ color: "#d4c4a6" }}>python-build-standalone</strong> — a self-contained Python binary downloaded directly into <code style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#d4c4a6" }}>~/.streamline/python/</code>. No system Python required. No admin rights. No PATH changes. No "Add Python to PATH" checkbox disasters on Windows. The same approach used by <code style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#d4c4a6" }}>uv</code> and <code style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#d4c4a6" }}>Rye</code>. System Python is always ignored — Streamline only ever uses its own bundled Python for 100% reproducibility.
        </p>
      </Card>

      <SectionTitle>What the postinstall script does</SectionTitle>
      {[
        {
          step: "1",
          title: "Detect OS + architecture",
          desc: "Bun reads process.platform and process.arch to determine the correct python-build-standalone release asset: e.g. cpython-3.11.9+20241016-x86_64-pc-windows-msvc-install_only.tar.gz for Windows x64, or the equivalent for macOS arm64, Linux x86_64, etc.",
          tags: ["windows x64/arm64", "macOS x64/arm64", "linux x86_64"],
        },
        {
          step: "2",
          title: "Download Python 3.11 standalone binary",
          desc: "Fetches the release asset from the indygreg/python-build-standalone GitHub releases API. Verifies SHA256 checksum against the published .sha256 file. Extracts to ~/.streamline/python/. No installation, no registry, no PATH modification — just files in a folder.",
          tags: ["~60MB download", "SHA256 verified", "no admin rights"],
        },
        {
          step: "3",
          title: "Create isolated venv",
          desc: "Runs ~/.streamline/python/bin/python3 -m venv ~/.streamline/venv — using Streamline's own Python exclusively. Completely isolated from anything else on the system.",
          tags: ["~/.streamline/venv"],
        },
        {
          step: "4",
          title: "Install yt-dlp",
          desc: "Runs ~/.streamline/venv/bin/pip install yt-dlp. Version recorded in ~/.streamline/env.json for update tracking.",
          tags: ["yt-dlp latest stable"],
        },
        {
          step: "5",
          title: "Install ffmpeg",
          desc: "Runs pip install imageio[ffmpeg] inside the venv. imageio downloads a pre-built static ffmpeg binary for the current OS/arch and stores it inside the venv. Zero system dependency.",
          tags: ["imageio[ffmpeg]", "static binary", "cross-platform"],
        },
        {
          step: "6",
          title: "Write env manifest",
          desc: "Writes ~/.streamline/env.json: { pythonPath, venvPath, ytdlpVersion, ffmpegPath, installedAt, platform, arch }. This file is the single source of truth for the WebUI Environment panel.",
          tags: ["~/.streamline/env.json"],
        },
      ].map((s) => (
        <FlowStep key={s.step} number={s.step} title={s.title} description={s.desc} tags={s.tags || []} />
      ))}

      <SectionTitle>Then launch</SectionTitle>
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(212,196,166,0.15)", borderRadius: "8px", padding: "16px 20px", fontFamily: "'DM Mono', monospace", fontSize: "12px", lineHeight: "1.9" }}>
        <div><span style={{ color: "#8e8ea0" }}>$ </span><span style={{ color: "#e8e3db" }}>streamline</span></div>
        <div style={{ marginTop: "8px", color: "#5a5a6a" }}>
          <div>▸ Reading ~/.streamline/env.json</div>
          <div style={{ color: "#10b981" }}>✓ Environment healthy</div>
          <div style={{ color: "#818cf8" }}>→ Server running at http://localhost:7979</div>
        </div>
      </div>
    </div>
  );
}

function EnvRow({ label, icon, okState, failState, noteOk, noteFail }) {
  const [sim, setSim] = useState("ok");
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", marginBottom: "8px" }}>
      <span style={{ fontSize: "16px", marginTop: "1px" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#d8d0c8", fontFamily: "'Crimson Pro', serif" }}>{label}</span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={() => setSim(sim === "ok" ? "fail" : "ok")} style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#5a5a6a", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "2px 7px", cursor: "pointer" }}>
              preview: {sim}
            </button>
            {sim === "ok"
              ? <span style={{ fontSize: "16px" }}>🟢</span>
              : <span style={{ fontSize: "16px" }}>🔴</span>
            }
          </div>
        </div>
        <div style={{ fontSize: "12px", color: sim === "ok" ? "#10b981" : "#ef4444", fontFamily: "'DM Mono', monospace", marginBottom: "4px" }}>
          {sim === "ok" ? okState : failState}
        </div>
        <div style={{ fontSize: "11.5px", color: "#7a7470", fontFamily: "'DM Sans', sans-serif", lineHeight: "1.5" }}>
          {sim === "ok" ? noteOk : noteFail}
        </div>
      </div>
    </div>
  );
}

function SetupContent() {
  return (
    <div>
      <Card accent style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "12.5px", color: "#9a9494", lineHeight: "1.6", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Because <code style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#d4c4a6" }}>bun install -g streamline</code> handles all provisioning automatically, there is <strong style={{ color: "#d4c4a6" }}>no setup wizard</strong>. The WebUI opens directly to the download UI. The Environment panel lives in <strong style={{ color: "#d4c4a6" }}>Settings → Environment</strong> and is always accessible — primarily for users who need to debug, repair, or manually update a dependency.
        </p>
      </Card>

      <SectionTitle>Environment management panel — design spec</SectionTitle>
      <p style={{ fontSize: "12.5px", color: "#9a9494", fontFamily: "'DM Sans', sans-serif", lineHeight: "1.6", marginBottom: "16px" }}>
        Each dependency is a self-contained row with a status indicator. <strong style={{ color: "#c8c0b6" }}>Green bulb = healthy, no action needed.</strong> Red bulb = broken, with a specific error and fix action. Toggle the preview state on each row below to see both states.
      </p>

      <EnvRow
        label="Python (bundled)"
        icon="🐍"
        okState="Python 3.11.9 · ~/.streamline/python/ · python-build-standalone"
        failState="Python binary missing or corrupt at ~/.streamline/python/"
        noteOk="Streamline's own isolated Python. System Python is never used. Fully sandboxed."
        noteFail="The bundled Python is missing or damaged. Click Repair to re-download python-build-standalone (~60MB)."
      />
      <EnvRow
        label="yt-dlp"
        icon="⬇"
        okState="yt-dlp 2024.11.18 · ~/.streamline/venv · up to date"
        failState="yt-dlp not installed or corrupt"
        noteOk="Installed inside Streamline's venv. Last checked for updates: today."
        noteFail="Click Repair to reinstall yt-dlp inside ~/.streamline/venv."
      />
      <EnvRow
        label="ffmpeg"
        icon="🎞"
        okState="ffmpeg 6.1.0 · ~/.streamline/venv · via imageio (bundled)"
        failState="ffmpeg binary not found"
        noteOk="Static binary bundled via imageio[ffmpeg]. Used for merging streams, format conversion, and chapter splitting."
        noteFail="Click Repair to reinstall ffmpeg via imageio[ffmpeg] inside the venv."
      />

      <SectionTitle>Repair flow</SectionTitle>
      <p style={{ fontSize: "12.5px", color: "#9a9494", fontFamily: "'DM Sans', sans-serif", lineHeight: "1.6", marginBottom: "14px" }}>
        When any row shows red, a single <strong style={{ color: "#d4c4a6" }}>Repair</strong> button appears at the top of the Environment panel. It re-runs the same provisioning script that ran during <code style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#d4c4a6" }}>bun install</code>. A live log streams the output via WebSocket so technically-minded users can see exactly what's happening.
      </p>
      {[
        { step: "1", title: "User clicks Repair", desc: "Frontend calls POST /api/env/repair. Backend re-runs the full provisioning script: check ~/.streamline/python/ → re-download python-build-standalone if missing or corrupt → venv check → pip install yt-dlp → pip install imageio[ffmpeg]." },
        { step: "2", title: "Live log stream", desc: "Download progress and pip output stream to a collapsible log textarea in the panel via WebSocket. Useful for users who want to understand what's happening." },
        { step: "3", title: "Re-probe after repair", desc: "On script exit 0, backend re-reads env.json and pushes updated status for each row. Rows turn green one by one as each dependency is confirmed." },
        { step: "4", title: "Partial failure", desc: "If the python-build-standalone download fails (e.g. no internet), only the Python row stays red with a specific network error. yt-dlp and ffmpeg rows stay green if they were already healthy." },
      ].map((s) => (
        <FlowStep key={s.step} number={s.step} title={s.title} description={s.desc} />
      ))}

      <SectionTitle>Update controls</SectionTitle>
      {[
        { name: "Update yt-dlp", desc: "pip install --upgrade yt-dlp inside venv. Shows new version number when done. yt-dlp releases weekly so this is the most-used action in the panel.", badge: "P0" },
        { name: "Update ffmpeg", desc: "pip install --upgrade imageio[ffmpeg]. Rarely needed but available for users hitting codec issues.", badge: "P1" },
        { name: "Check for updates", desc: "Compares installed versions against PyPI latest. Shows a subtle orange dot on the Settings icon in the sidebar when updates are available.", badge: "P1" },
      ].map((u) => (
        <Card key={u.name}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#d8d0c8", fontFamily: "'Crimson Pro', serif" }}>{u.name}</span>
            <Badge color={u.badge === "P0" ? "red" : "orange"}>{u.badge}</Badge>
          </div>
          <p style={{ fontSize: "12px", color: "#8a8480", margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: "1.5" }}>{u.desc}</p>
        </Card>
      ))}

      <SectionTitle>Design principles for this panel</SectionTitle>
      <Card accent>
        <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
          {[
            "Green bulb = healthy. No button shown. No noise. Nothing to do.",
            "Red bulb = broken. One specific error message. One clear fix action.",
            "No 'Retry' button on healthy rows — it implies something might be wrong when nothing is.",
            "The panel is in Settings, not the main UI. Casual users never need to see it.",
            "System Python is never shown or referenced — Streamline owns its entire Python stack.",
            "Technically savvy users get the full pip + download log — they know what to do with it.",
          ].map((p) => (
            <li key={p} style={{ fontSize: "12.5px", color: "#8a8480", lineHeight: "1.8", fontFamily: "'DM Sans', sans-serif" }}>{p}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function WebuiContent() {
  const priorityColor = { P0: "red", P1: "orange", P2: "default" };
  return (
    <div>
      <p style={{ fontSize: "13px", color: "#9a9494", lineHeight: "1.7", fontFamily: "'DM Sans', sans-serif", marginBottom: "8px" }}>
        All yt-dlp features are exposed. Core features are front-and-center; advanced features live in an expandable panel.
      </p>
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        <Badge color="red">P0 — Launch blocker</Badge>
        <Badge color="orange">P1 — Launch target</Badge>
        <Badge color="default">P2 — Post-launch</Badge>
      </div>
      {featureGroups.map((g) => (
        <div key={g.group} style={{ marginBottom: "24px" }}>
          <SectionTitle>{g.group}</SectionTitle>
          {g.features.map((f) => (
            <Card key={f.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#d8d0c8", fontFamily: "'Crimson Pro', serif" }}>{f.name}</span>
                <Badge color={priorityColor[f.priority]}>{f.priority}</Badge>
              </div>
              <p style={{ fontSize: "12px", color: "#8a8480", margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: "1.5" }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

function DownloadContent() {
  return (
    <div>
      <SectionTitle>Queue architecture</SectionTitle>
      <Card accent>
        <p style={{ fontSize: "12.5px", color: "#9a9494", lineHeight: "1.7", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Downloads are processed <strong style={{ color: "#d4c4a6" }}>sequentially</strong> (one at a time). Users can queue many URLs; each waits until the previous completes. This keeps bandwidth predictable and avoids yt-dlp subprocess conflicts on slower machines.
        </p>
      </Card>

      <SectionTitle>IPC — progress streaming</SectionTitle>
      {[
        { step: "1", title: "User clicks Download", desc: "Frontend sends POST /api/download with URL + options JSON to the Bun HTTP server." },
        { step: "2", title: "Backend spawns yt-dlp", desc: "Bun.spawn(['python', '-m', 'yt_dlp', ...args]) inside the venv. stdout and stderr are piped." },
        { step: "3", title: "Progress via WebSocket", desc: "Bun backend parses yt-dlp's [download] XX.X% output lines and emits structured JSON events to the WebSocket client." },
        { step: "4", title: "Frontend renders progress", desc: "React state updates in real time: percentage, speed (MiB/s), ETA, filename. Log lines appended to collapsible textarea." },
        { step: "5", title: "Completion event", desc: "Backend emits {status: 'done', filepath: '...'} on process exit 0. Frontend shows toast, moves item to history." },
        { step: "6", title: "Error handling", desc: "Non-zero exit: backend emits {status: 'error', stderr: '...'}. Frontend shows error card with log. Queue continues to next item." },
      ].map((s) => (
        <FlowStep key={s.step} number={s.step} title={s.title} description={s.desc} />
      ))}

      <SectionTitle>Output path</SectionTitle>
      <Card>
        <p style={{ fontSize: "12.5px", color: "#9a9494", lineHeight: "1.6", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Default: <code style={{ fontFamily: "'DM Mono', monospace", color: "#d4c4a6", fontSize: "12px" }}>~/Downloads/</code> resolved via <code style={{ fontFamily: "'DM Mono', monospace", color: "#d4c4a6", fontSize: "12px" }}>os.homedir()</code> in Bun. Overridable globally in Settings. Per-download override available in the expanded options drawer on each queue item.
        </p>
      </Card>
    </div>
  );
}

function AuthContent() {
  return (
    <div>
      <Card accent style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "16px" }}>⚿</span>
          <p style={{ fontSize: "12.5px", color: "#9a9494", lineHeight: "1.6", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Streamline supports authenticated content (age-restricted, member-only, private) via <strong style={{ color: "#d4c4a6" }}>browser cookie passthrough</strong> — the same mechanism yt-dlp uses natively with <code style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#d4c4a6" }}>--cookies-from-browser</code>.
          </p>
        </div>
      </Card>

      <SectionTitle>How it works</SectionTitle>
      {[
        { step: "1", title: "User enables cookie auth in Settings", desc: "Toggle: 'Use browser cookies for authenticated content'. Default OFF. Clear privacy notice shown before enabling." },
        { step: "2", title: "Browser selection", desc: "Dropdown: Chrome, Firefox, Safari, Edge, Brave, Opera. Streamline passes --cookies-from-browser <browser> to yt-dlp." },
        { step: "3", title: "yt-dlp reads browser cookies", desc: "yt-dlp accesses the browser's cookie database on disk (OS-level path). No credentials are stored by Streamline." },
        { step: "4", title: "Optional: cookie file import", desc: "Advanced alternative — user exports cookies.txt via browser extension and points Streamline to the file. Passed as --cookies <path>." },
        { step: "5", title: "Privacy notice", desc: "Streamline displays: 'Cookie access is used only for yt-dlp downloads. No data leaves your machine.' Shown once on enable." },
      ].map((s) => (
        <FlowStep key={s.step} number={s.step} title={s.title} description={s.desc} />
      ))}

      <SectionTitle>Security considerations</SectionTitle>
      {[
        { t: "No credential storage", d: "Streamline never stores passwords, tokens, or cookies. It only passes --cookies-from-browser to yt-dlp at download time." },
        { t: "Local only", d: "The entire stack runs on localhost. No data leaves the machine. No telemetry." },
        { t: "Browser lock", d: "Chrome/Chromium locks its cookie DB while running. yt-dlp handles this; Streamline surfaces any resulting errors clearly." },
        { t: "Open source audit", d: "All cookie-related code paths are clearly documented and auditable on GitHub." },
      ].map((item) => (
        <Card key={item.t}>
          <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#c8c0b6", fontFamily: "'DM Mono', monospace", marginBottom: "4px", fontSize: "12px" }}>{item.t}</div>
          <div style={{ fontSize: "12.5px", color: "#8a8480", fontFamily: "'DM Sans', sans-serif", lineHeight: "1.5" }}>{item.d}</div>
        </Card>
      ))}
    </div>
  );
}

function TechContent() {
  return (
    <div>
      <p style={{ fontSize: "13px", color: "#9a9494", lineHeight: "1.7", fontFamily: "'DM Sans', sans-serif", marginBottom: "20px" }}>
        The entire stack runs locally. No cloud services. No Docker. No root access needed.
      </p>
      {techStack.map((t) => (
        <Card key={t.layer}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", flexWrap: "wrap", gap: "6px" }}>
            <div style={{ display: "flex", align: "center", gap: "10px" }}>
              <span style={{ fontSize: "11px", color: "#5a5a6a", fontFamily: "'DM Mono', monospace", minWidth: "110px" }}>{t.layer}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#d8d0c8", fontFamily: "'Crimson Pro', serif" }}>{t.tech}</span>
            </div>
            <Badge color={t.color}>{t.color}</Badge>
          </div>
          <p style={{ fontSize: "12px", color: "#8a8480", margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: "1.5", paddingLeft: "120px" }}>{t.role}</p>
        </Card>
      ))}

      <SectionTitle>Architecture diagram</SectionTitle>
      <div style={{ background: "#0a0a0a", border: "1px solid rgba(212,196,166,0.1)", borderRadius: "8px", padding: "20px", fontFamily: "'DM Mono', monospace", fontSize: "11.5px", color: "#5a6a5a", lineHeight: "1.9" }}>
        <div style={{ color: "#8e8ea0" }}>USER TERMINAL</div>
        <div>  └── <span style={{ color: "#d4c4a6" }}>bun streamline</span></div>
        <div>        └── <span style={{ color: "#a8c4a8" }}>Bun HTTP Server</span> :7979</div>
        <div>              ├── <span style={{ color: "#818cf8" }}>Serves React WebUI</span> (static)</div>
        <div>              ├── <span style={{ color: "#818cf8" }}>REST API</span>  /api/download, /api/formats, /api/queue</div>
        <div>              └── <span style={{ color: "#818cf8" }}>WebSocket</span>  ws://localhost:7979/ws</div>
        <div>                    └── <span style={{ color: "#f59e0b" }}>Bun.spawn()</span> → yt-dlp process</div>
        <div>                          └── <span style={{ color: "#10b981" }}>~/.streamline/venv</span></div>
        <div>                                ├── yt-dlp</div>
        <div>                                └── ffmpeg (via imageio)</div>
      </div>
    </div>
  );
}

function MilestonesContent() {
  return (
    <div>
      {milestones.map((m, i) => (
        <Card key={m.phase} accent={i === 0} style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#e8e3db", fontFamily: "'Crimson Pro', serif" }}>{m.phase}</span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Badge color="default">{m.duration}</Badge>
              <Badge color={m.status.color}>{m.status.label}</Badge>
            </div>
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
            {m.goals.map((g) => (
              <li key={g} style={{ fontSize: "12.5px", color: "#8a8480", lineHeight: "1.7", fontFamily: "'DM Sans', sans-serif" }}>{g}</li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function OpenQsContent() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <p style={{ fontSize: "13px", color: "#9a9494", lineHeight: "1.7", fontFamily: "'DM Sans', sans-serif", marginBottom: "20px" }}>
        These decisions need to be made before or during M1. Click each to expand options.
      </p>
      {openQuestions.map((q, i) => (
        <div key={q.q} style={{ marginBottom: "8px" }}>
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              width: "100%",
              background: expanded === i ? "rgba(212,196,166,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${expanded === i ? "rgba(212,196,166,0.2)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: expanded === i ? "10px 10px 0 0" : "10px",
              padding: "14px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "left",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#d8d0c8", fontFamily: "'Crimson Pro', serif" }}>{q.q}</span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
              <Badge color={q.priority === "P0" ? "red" : "orange"}>{q.priority}</Badge>
              <span style={{ color: "#8e8ea0", fontSize: "12px" }}>{expanded === i ? "▲" : "▼"}</span>
            </div>
          </button>
          {expanded === i && (
            <div style={{ background: "rgba(212,196,166,0.03)", border: "1px solid rgba(212,196,166,0.15)", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "14px 16px" }}>
              <p style={{ fontSize: "12.5px", color: "#9a9494", lineHeight: "1.6", margin: "0 0 12px", fontFamily: "'DM Sans', sans-serif" }}>{q.detail}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {q.options.map((opt, j) => (
                  <div key={opt} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#5a5a6a" }}>0{j + 1}</span>
                    <span style={{ fontSize: "12.5px", color: "#a8a098", fontFamily: "'DM Sans', sans-serif" }}>{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const contentMap = {
  overview: OverviewContent,
  personas: PersonasContent,
  install: InstallContent,
  setup: SetupContent,
  webui: WebuiContent,
  download: DownloadContent,
  auth: AuthContent,
  tech: TechContent,
  milestones: MilestonesContent,
  openqs: OpenQsContent,
};

export default function StreamlinePRD() {
  const [active, setActive] = useState("overview");
  const ActiveContent = contentMap[sections.find((s) => s.id === active)?.content.type] || (() => null);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#141414", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,196,166,0.15); border-radius: 2px; }
        button { background: none; border: none; cursor: pointer; color: inherit; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: "220px", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 0", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "0 16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "16px", color: "#d4c4a6" }}>◈</span>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#e8e3db", fontFamily: "'Crimson Pro', serif", letterSpacing: "-0.02em" }}>Streamline</span>
          </div>
          <div style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "#5a5a6a", letterSpacing: "0.06em" }}>PRODUCT REQUIREMENTS</div>
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0 0 12px" }} />

        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              width: "100%",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              borderRadius: "0",
              background: active === s.id ? "rgba(212,196,166,0.08)" : "transparent",
              borderLeft: active === s.id ? "2px solid rgba(212,196,166,0.5)" : "2px solid transparent",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "12px", color: active === s.id ? "#d4c4a6" : "#5a5a6a", width: "14px", textAlign: "center" }}>{s.icon}</span>
            <span style={{ fontSize: "12.5px", color: active === s.id ? "#d8d0c8" : "#6a6a7a", fontWeight: active === s.id ? 500 : 400 }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px 80px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "20px", color: "#d4c4a6" }}>{sections.find((s) => s.id === active)?.icon}</span>
              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#e8e3db", fontFamily: "'Crimson Pro', serif", margin: 0, letterSpacing: "-0.02em" }}>
                {sections.find((s) => s.id === active)?.label}
              </h1>
            </div>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
          </div>

          <ActiveContent />
        </div>
      </div>
    </div>
  );
}
