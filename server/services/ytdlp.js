import { resolveYtdlpBin, resolveFFmpegLocation, resolveBunBin } from "./environment.js";
import { getCookieArgs } from "./cookies.js";
import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, statSync } from "fs";

const YOUTUBE_AUTH_HINT =
  "YouTube is asking for a fresh signed-in session. In Settings > Cookie authentication, upload a YouTube cookies.txt exported from a private/incognito YouTube session. Normal browser import may not work for YouTube.";
const SUBTITLE_RATE_LIMIT_HINT =
  "YouTube rate-limited the subtitle request. Turn off Options > Subtitles and retry the video, or wait a while and retry subtitles with fewer subtitle languages.";
const METADATA_CACHE_TTL_MS = 5 * 60 * 1000;
const metadataCache = new Map();

function getProbeArgs() {
  return ["--socket-timeout", "10", "--retries", "2", "--extractor-retries", "2"];
}

function getJsRuntimeArgs() {
  const bunBin = resolveBunBin();
  return bunBin ? ["--js-runtimes", `bun:${bunBin}`] : [];
}

function normalizeYtdlpError(message) {
  const text = String(message || "").trim();
  if (/Unable to download video subtitles/i.test(text) || (/subtitles?/i.test(text) && /HTTP Error 429/i.test(text))) {
    return `${SUBTITLE_RATE_LIMIT_HINT} ${text}`;
  }
  if (/sign in to confirm you.?re not a bot/i.test(text) || /LOGIN_REQUIRED/i.test(text)) {
    return YOUTUBE_AUTH_HINT;
  }
  return text;
}

function ensureDirectory(path) {
  if (!path) return;

  if (existsSync(path)) {
    if (!statSync(path).isDirectory()) {
      throw new Error(`Expected a directory but found a file: ${path}`);
    }
    return;
  }

  mkdirSync(path, { recursive: true });
}

function getCacheKey(kind, url) {
  return JSON.stringify({ kind, url, cookies: getCookieArgs() });
}

function getCached(kind, url) {
  const entry = metadataCache.get(getCacheKey(kind, url));
  if (!entry || Date.now() - entry.createdAt > METADATA_CACHE_TTL_MS) {
    metadataCache.delete(getCacheKey(kind, url));
    return null;
  }
  return structuredClone(entry.value);
}

function setCached(kind, url, value) {
  if (metadataCache.size > 100) {
    const oldestKey = metadataCache.keys().next().value;
    metadataCache.delete(oldestKey);
  }
  metadataCache.set(getCacheKey(kind, url), {
    createdAt: Date.now(),
    value: structuredClone(value),
  });
}

export function isLikelyPlaylistUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    const host = parsed.hostname.toLowerCase();

    return (
      parsed.searchParams.has("list") ||
      path.includes("playlist") ||
      path.includes("/sets/") ||
      path.includes("/albums/") ||
      path.includes("/album/") ||
      (host.includes("bandcamp.") && path.includes("/album/"))
    );
  } catch {
    return false;
  }
}

function parseCustomFlags(input) {
  const args = [];
  let current = "";
  let quote = null;
  let escaping = false;

  for (const char of String(input || "")) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === "\\") {
      escaping = true;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }

  if (current) args.push(current);
  return args.filter((arg) => arg !== "--exec" && !arg.startsWith("--exec="));
}

/**
 * Detect whether a URL is a playlist.
 * Uses --flat-playlist --dump-json which outputs one JSON line per entry.
 */
export async function detectPlaylist(url) {
  const cached = getCached("detectPlaylist", url);
  if (cached !== null) return cached;

  const ytdlpBin = resolveYtdlpBin();

  // Quick check: use --flat-playlist to see if multiple entries exist
  const args = [ytdlpBin, "--flat-playlist", "--dump-json", "--no-warnings", ...getProbeArgs(), ...getJsRuntimeArgs(), ...getCookieArgs()];
  args.push(url);

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
  }
  );

  const stdout = await new Response(proc.stdout).text();
  await new Response(proc.stderr).text();
  await proc.exited;

  const lines = stdout.trim().split("\n").filter(Boolean);
  if (lines.length <= 1) {
    setCached("detectPlaylist", url, false);
    return false;
  }

  // Check if first entry has playlist metadata
  try {
    const first = JSON.parse(lines[0]);
    const result = !!(first._type === "url" || first.ie_key || lines.length > 1);
    setCached("detectPlaylist", url, result);
    return result;
  } catch {
    setCached("detectPlaylist", url, false);
    return false;
  }
}

/**
 * Fetch playlist info with all entries.
 * Returns: { is_playlist, playlist_title, playlist_count, entries[] }
 */
export async function getPlaylistInfo(url) {
  const cached = getCached("playlistInfo", url);
  if (cached) return cached;

  const ytdlpBin = resolveYtdlpBin();

  const args = [ytdlpBin, "--flat-playlist", "--dump-json", "--no-warnings", ...getProbeArgs(), ...getJsRuntimeArgs(), ...getCookieArgs()];
  args.push(url);

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
  }
  );

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const errorLines = stderr
      .split("\n")
      .filter((l) => l.includes("ERROR"))
      .join("; ");
    throw new Error(normalizeYtdlpError(errorLines || stderr.trim() || "yt-dlp failed"));
  }

  const lines = stdout.trim().split("\n").filter(Boolean);
  const entries = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      entries.push({
        id: entry.id || null,
        title: entry.title || "Untitled",
        url: entry.url || entry.webpage_url || null,
        duration: entry.duration || 0,
        thumbnail: entry.thumbnails?.[0]?.url || entry.thumbnail || null,
        uploader: entry.uploader || entry.channel || null,
      });
    } catch {
      // skip malformed lines
    }
  }

  // Try to extract playlist title from the URL itself
  let playlistTitle = "Playlist";
  if (entries.length > 0) {
    // Use first entry's playlist_title if available
    try {
      const first = JSON.parse(lines[0]);
      playlistTitle = first.playlist_title || first.playlist || "Playlist";
    } catch { /* use default */ }
  }

  const result = {
    is_playlist: true,
    playlist_title: playlistTitle,
    playlist_count: entries.length,
    entries,
  };
  setCached("playlistInfo", url, result);
  return result;
}

/**
 * Fetch media info / formats for a given URL using yt-dlp --dump-json.
 * Returns parsed JSON with title, thumbnail, duration, formats array, etc.
 */
export async function getFormats(url) {
  const cached = getCached("formats", url);
  if (cached) return cached;

  const ytdlpBin = resolveYtdlpBin();

  const args = [ytdlpBin, "--dump-json", "--no-warnings", "--no-playlist", ...getProbeArgs(), ...getJsRuntimeArgs(), ...getCookieArgs()];
  args.push(url);

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
  }
  );

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    // Include WARNING lines too — they often explain the real problem
    const errorLines = stderr
      .split("\n")
      .filter((l) => l.includes("ERROR") || l.includes("WARNING"))
      .map(l => l.replace(/^\s*\[.*?\]\s*/, "").trim())
      .filter(Boolean)
      .join(" | ");
    const message = normalizeYtdlpError(errorLines || stderr.trim() || "yt-dlp failed with no output");
    const err = new Error(message);
    err.stderr = stderr;
    err.exitCode = exitCode;
    throw err;
  }

  try {
    const data = JSON.parse(stdout);
    const result = {
      is_playlist: false,
      title: data.title || null,
      thumbnail: data.thumbnail || null,
      duration: data.duration || 0,
      uploader: data.uploader || data.channel || null,
      upload_date: data.upload_date || null,
      webpage_url: data.webpage_url || url,
      extractor_key: data.extractor_key || data.extractor || null,
      view_count: data.view_count || null,
      like_count: data.like_count || null,
      description: data.description || null,
      formats: (data.formats || []).map((f) => ({
        format_id: f.format_id,
        ext: f.ext,
        height: f.height || null,
        width: f.width || null,
        vcodec: f.vcodec || "none",
        acodec: f.acodec || "none",
        abr: f.abr || null,
        vbr: f.vbr || null,
        tbr: f.tbr || null,
        filesize: f.filesize || null,
        filesize_approx: f.filesize_approx || null,
        fps: f.fps || null,
        format_note: f.format_note || null,
      })),
    };
    setCached("formats", url, result);
    return result;
  } catch {
    throw new Error("Failed to parse yt-dlp output");
  }
}

/**
 * Spawn a yt-dlp download process.
 * Returns a controller object with methods to read progress events.
 *
 * @param {object} options
 * @param {string} options.url
 * @param {string|null} options.formatId - specific format_id or null for preset
 * @param {string} options.preset - "best" | "1080p" | "720p" | "audio"
 * @param {string} options.outputPath - directory to save to
 * @param {string} options.tempPath - directory for temporary download artifacts
 * @param {string} options.filenameTemplate - yt-dlp output template
 * @param {object} options.options - advanced yt-dlp options from the WebUI
 * @param {function} options.onProgress - callback({progress, speed, eta, filesize, line})
 * @param {function} options.onMerging - called when merging begins
 * @param {function} options.onComplete - callback({filepath})
 * @param {function} options.onError - callback({error, stderr})
 * @param {function} options.onLog - callback(line)
 */
export function startDownload({
  url,
  formatId,
  formatType,
  preset,
  outputPath,
  tempPath,
  filenameTemplate,
  options = {},
  onProgress,
  onMerging,
  onComplete,
  onError,
  onLog,
}) {
  const ytdlpBin = resolveYtdlpBin();
  const ffmpegLocation = resolveFFmpegLocation();

  const args = [
    ytdlpBin,
    "--newline",
    "--no-warnings",
    "--no-mtime",
    "--windows-filenames", // Sanitize filenames for Windows
    "--trim-filenames", "100", // Avoid MAX_PATH issues
    "--retries", "10",
    "--fragment-retries", "10",
    "--continue",
    ...(preset === "audio" ? ["--no-part"] : []),
    "--buffer-size", "16K",
    ...getJsRuntimeArgs(),
    ...getCookieArgs(),
  ];

  // Explicitly tell yt-dlp where ffmpeg is
  if (ffmpegLocation) {
    args.push("--ffmpeg-location", ffmpegLocation);
  }

  // Format selection
  if (formatId) {
    // If the user selected a video-only format, automatically merge with best audio.
    if (formatType === "video") {
      // video-only stream: merge with best available audio
      args.push("-f", `${formatId}+bestaudio/bestvideo+bestaudio/best`);
    } else {
      args.push("-f", formatId);
    }
  } else if (preset) {
    switch (preset) {
      case "best":
        // bestvideo+bestaudio, merge → fallback to single best
        args.push("-f", "bestvideo+bestaudio/best");
        break;
      case "1080p":
        // best video ≤1080p + best audio → fallback to single stream ≤1080p → best
        args.push("-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best");
        break;
      case "720p":
        args.push("-f", "bestvideo[height<=720]+bestaudio/best[height<=720]/best");
        break;
      case "audio":
        args.push(
          "-x",
          "--audio-format",
          options.audioFormat || "mp3",
          "--audio-quality",
          String(options.audioQuality || "0")
        );
        break;
      default:
        args.push("-f", "bestvideo+bestaudio/best");
    }
  }

  // Final output goes to the user's download folder. yt-dlp scratch files go
  // into Streamline's temp folder so accidental cwd downloads do not enter Git.
  if (outputPath) {
    ensureDirectory(outputPath);
    args.push("--paths", `home:${outputPath}`);
  }
  if (tempPath) {
    ensureDirectory(tempPath);
    args.push("--paths", `temp:${tempPath}`);
  }
  args.push("-o", filenameTemplate || "%(title)s.%(ext)s");

  if (options.writeSubtitles) {
    args.push("--write-subs");
    args.push("--sleep-requests", "1", "--sleep-subtitles", "5");
    if (options.writeAutoSubtitles) args.push("--write-auto-subs");
    if (options.subtitleLanguages) {
      args.push("--sub-langs", String(options.subtitleLanguages));
    }
    if (options.subtitleFormat && options.subtitleFormat !== "best") {
      args.push("--sub-format", String(options.subtitleFormat));
    }
  }

  if (options.writeThumbnail) {
    args.push("--write-thumbnail");
  }

  if (options.embedMetadata) {
    args.push("--embed-metadata");
    if (options.writeThumbnail) args.push("--embed-thumbnail");
  }

  if (options.chaptersMode === "split") {
    args.push("--split-chapters");
  } else if (options.chaptersMode === "embed") {
    args.push("--embed-chapters");
  }

  if (options.sponsorBlock) {
    args.push("--sponsorblock-remove", "all");
  }

  if (options.downloadArchive) {
    const streamlineDir = join(homedir(), ".streamline");
    mkdirSync(streamlineDir, { recursive: true });
    args.push("--download-archive", join(streamlineDir, "download-archive.txt"));
  }

  if (options.rateLimit) {
    args.push("--limit-rate", String(options.rateLimit));
  }

  const fragments = Number(options.concurrentFragments || 4);
  if (Number.isFinite(fragments) && fragments > 1) {
    args.push("--concurrent-fragments", String(Math.min(Math.max(Math.floor(fragments), 1), 16)));
  }

  args.push(...parseCustomFlags(options.customFlags));

  args.push("--print", "after_move:filepath");
  args.push(url);

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
  });

  // Stream stdout for progress
  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastFilepath = null;

  const processChunk = (chunk) => {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // keep incomplete last line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      onLog?.(line);

      if (!trimmed.startsWith("[")) {
        lastFilepath = trimmed;
        continue;
      }

      // Parse progress: [download]  25.3% of ~  54.21MiB at    3.45MiB/s ETA 00:12
      const progressMatch = line.match(
        /\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\S+)\s+at\s+([\d.]+\S+)\s+ETA\s+(\S+)/
      );
      if (progressMatch) {
        onProgress?.({
          progress: parseFloat(progressMatch[1]),
          filesize: parseSize(progressMatch[2]),
          speed: parseSize(progressMatch[3]),
          eta: progressMatch[4],
          line,
        });
        continue;
      }

      // Simpler progress: [download]  25.3% of 54.21MiB
      const simpleProgress = line.match(
        /\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\S+)/
      );
      if (simpleProgress) {
        onProgress?.({
          progress: parseFloat(simpleProgress[1]),
          filesize: parseSize(simpleProgress[2]),
          speed: null,
          eta: null,
          line,
        });
        continue;
      }

      // Merging
      if (line.includes("[Merger]") || line.includes("[ffmpeg]")) {
        onMerging?.();
        continue;
      }

      // Destination file
      const destMatch = line.match(/\[download\]\s+Destination:\s+(.+)/);
      if (destMatch) {
        lastFilepath = destMatch[1].trim();
      }

      const mergerMatch = line.match(/\[Merger\].*?into\s+"(.+?)"/);
      if (mergerMatch) {
        lastFilepath = mergerMatch[1].trim();
      }

      // Already downloaded
      const alreadyMatch = line.match(
        /\[download\]\s+(.+)\s+has already been downloaded/
      );
      if (alreadyMatch) {
        lastFilepath = alreadyMatch[1].trim();
      }
    }
  };

  // Read loop
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        processChunk(value);
      }
    } catch {
      // stream closed
    }

    // Also read stderr
    const stderrText = await new Response(proc.stderr).text();
    if (stderrText.trim()) {
      stderrText.split("\n").forEach((l) => l.trim() && onLog?.(l));
    }

    const exitCode = await proc.exited;

    if (exitCode === 0) {
      onComplete?.({ filepath: lastFilepath });
    } else {
      const errorLines = stderrText
        .split("\n")
        .filter((l) => l.includes("ERROR"))
        .join("; ");
      onError?.({
        error: normalizeYtdlpError(errorLines || stderrText || "Download failed with exit code " + exitCode),
        stderr: stderrText,
      });
    }
  })();

  return {
    process: proc,
    kill: () => proc.kill(),
  };
}

/**
 * Parse size strings like "54.21MiB" into bytes (approximate).
 */
function parseSize(str) {
  if (!str) return null;
  const match = str.match(/([\d.]+)\s*(GiB|MiB|KiB|B|MB|GB|KB)/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    b: 1,
    kib: 1024,
    kb: 1000,
    mib: 1024 * 1024,
    mb: 1000 * 1000,
    gib: 1024 * 1024 * 1024,
    gb: 1000 * 1000 * 1000,
  };
  return val * (multipliers[unit] || 1);
}
