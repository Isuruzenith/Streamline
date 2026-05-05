import { resolveYtdlpBin, resolveFFmpegLocation, resolveBunBin } from "./environment.js";
import { getCookieArgs } from "./cookies.js";
import { homedir } from "os";
import { basename, join, resolve } from "path";
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "fs";

const YOUTUBE_AUTH_HINT =
  "YouTube is asking for a fresh signed-in session. In Settings > Cookie authentication, upload a YouTube cookies.txt exported from a private/incognito YouTube session. Normal browser import may not work for YouTube.";
const SUBTITLE_RATE_LIMIT_HINT =
  "YouTube rate-limited the subtitle request. Turn off Options > Subtitles and retry the video, or wait a while and retry subtitles with fewer subtitle languages.";
const METADATA_CACHE_TTL_MS = 15 * 60 * 1000;
const METADATA_CACHE_MAX_ENTRIES = 250;
const metadataCache = new Map();

function getProbeArgs() {
  return [
    "--socket-timeout", "8",
    "--retries", "2",
    "--extractor-retries", "2",
    "--concurrent-fragments", "1",
    "--no-check-certificates",
  ];
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

function uniqueDestinationPath(outputPath, name) {
  const parsed = /^(.*?)(\.[^.]+)?$/.exec(name);
  const stem = parsed?.[1] || name;
  const ext = parsed?.[2] || "";
  let candidate = join(outputPath, name);
  let index = 1;

  while (existsSync(candidate)) {
    candidate = join(outputPath, `${stem} (${index})${ext}`);
    index += 1;
  }

  return candidate;
}

function movePath(source, destination) {
  try {
    renameSync(source, destination);
  } catch {
    cpSync(source, destination, { recursive: true });
    rmSync(source, { recursive: true, force: true });
  }
}

function moveTempOutputs(tempPath, outputPath, mainFilepath) {
  if (!tempPath || !outputPath || !existsSync(tempPath)) return mainFilepath || null;

  ensureDirectory(outputPath);
  const moved = new Map();
  const resolvedMain = mainFilepath ? resolve(mainFilepath) : null;

  for (const entry of readdirSync(tempPath, { withFileTypes: true })) {
    if (entry.name === ".active" || entry.name.endsWith(".part") || entry.name.endsWith(".ytdl")) {
      continue;
    }

    const source = join(tempPath, entry.name);
    const destination = uniqueDestinationPath(outputPath, entry.name);
    movePath(source, destination);
    moved.set(resolve(source), destination);
  }

  if (resolvedMain && moved.has(resolvedMain)) {
    return moved.get(resolvedMain);
  }

  if (resolvedMain && !resolvedMain.startsWith(resolve(tempPath))) {
    return mainFilepath;
  }

  const mainBasename = mainFilepath ? basename(mainFilepath) : null;
  if (mainBasename) {
    for (const [source, destination] of moved.entries()) {
      if (basename(source) === mainBasename) return destination;
    }
  }

  return moved.values().next().value || mainFilepath || null;
}

function requireYtdlpBin() {
  const ytdlpBin = resolveYtdlpBin();
  if (!ytdlpBin) {
    throw new Error("yt-dlp binary not found. Go to Settings > Environment and click Repair.");
  }
  return ytdlpBin;
}

function getCacheKey(kind, url) {
  const cookies = [...getCookieArgs()].sort().join(",");
  return JSON.stringify({ kind, url, cookies });
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
  const cacheKey = getCacheKey(kind, url);
  if (metadataCache.has(cacheKey)) {
    metadataCache.delete(cacheKey);
  }

  while (metadataCache.size >= METADATA_CACHE_MAX_ENTRIES) {
    const oldestKey = metadataCache.keys().next().value;
    metadataCache.delete(oldestKey);
  }

  metadataCache.set(cacheKey, {
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

  const blockedFlags = new Set([
    "--exec",
    "--exec-before-download",
    "--config-location",
    "--plugin-dirs",
    "--cookies",
    "--cookies-from-browser",
    "--print-to-file",
    "--write-pages",
    "--load-pages",
  ]);
  const blockedFlagValueCount = new Map([
    ["--exec", 1],
    ["--exec-before-download", 1],
    ["--config-location", 1],
    ["--plugin-dirs", 1],
    ["--cookies", 1],
    ["--cookies-from-browser", 1],
    ["--print-to-file", 2],
    ["--load-pages", 1],
  ]);
  const filtered = [];
  let skippedValues = 0;

  for (const arg of args) {
    if (skippedValues > 0) {
      skippedValues -= 1;
      continue;
    }

    const isBlockedEquals = [...blockedFlags].some((flag) => arg.startsWith(`${flag}=`));
    if (blockedFlags.has(arg) || isBlockedEquals) {
      skippedValues = blockedFlags.has(arg) ? blockedFlagValueCount.get(arg) || 0 : 0;
      continue;
    }

    filtered.push(arg);
  }

  return filtered;
}

function stripAnsi(input) {
  return String(input || "").replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Detect whether a URL is a playlist.
 * Uses --flat-playlist --dump-json which outputs one JSON line per entry.
 */
export async function detectPlaylist(url) {
  const cached = getCached("detectPlaylist", url);
  if (cached !== null) return cached;

  const ytdlpBin = requireYtdlpBin();

  // Quick check: use --flat-playlist to see if multiple entries exist
  const args = [ytdlpBin, "--flat-playlist", "--dump-json", "--no-warnings", ...getProbeArgs(), ...getJsRuntimeArgs(), ...getCookieArgs()];
  args.push("--playlist-items", "1:200");
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

  const ytdlpBin = requireYtdlpBin();

  const args = [ytdlpBin, "--flat-playlist", "--dump-json", "--no-warnings", ...getProbeArgs(), ...getJsRuntimeArgs(), ...getCookieArgs()];
  args.push("--playlist-items", "1:200");
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
    truncated: entries.length === 200,
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

  const ytdlpBin = requireYtdlpBin();

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
      filesize: data.filesize || null,
      filesize_approx: data.filesize_approx ?? data.filesize ?? null,
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
 * @param {function} options.onStart - called when yt-dlp process starts
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
  onStart,
  onProgress,
  onMerging,
  onComplete,
  onError,
  onLog,
}) {
  const ytdlpBin = requireYtdlpBin();
  const ffmpegLocation = resolveFFmpegLocation();
  const customArgsParsed = parseCustomFlags(options.customFlags);
  const customOverridesFormat = customArgsParsed.some(
    (arg) => arg === "-f" || arg === "--format" || arg.startsWith("--format=")
  );

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
    "--buffer-size", "256K",
    ...getJsRuntimeArgs(),
    ...getCookieArgs(),
  ];

  // Explicitly tell yt-dlp where ffmpeg is
  if (ffmpegLocation) {
    args.push("--ffmpeg-location", ffmpegLocation);
  }

  // Format selection
  if (!customOverridesFormat && formatId) {
    // If the user selected a video-only format, automatically merge with best audio.
    if (formatType === "video") {
      // video-only stream: merge with best available audio
      args.push("-f", `${formatId}+bestaudio/bestvideo+bestaudio/best`);
    } else {
      args.push("-f", formatId);
    }
  } else if (!customOverridesFormat && preset) {
    switch (preset) {
      case "best-mp4":
        args.push(
          "--format",
          "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
          "--merge-output-format",
          "mp4"
        );
        break;
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

  const videoFormat = String(options.videoFormat || "").trim().toLowerCase();
  const validVideoFormats = new Set(["mp4", "mkv", "webm", "mov", "avi"]);
  const alreadySetsOutputFormat =
    args.includes("--merge-output-format") || args.includes("--recode-video");
  if (
    preset !== "audio" &&
    formatType !== "audio" &&
    validVideoFormats.has(videoFormat) &&
    !alreadySetsOutputFormat
  ) {
    args.push("--merge-output-format", videoFormat);
  }

  // Keep the entire yt-dlp lifecycle in one temp folder. After yt-dlp exits
  // cleanly, Streamline moves the finished files into the final output folder.
  const ytdlpHomePath = tempPath || outputPath;
  if (outputPath) {
    ensureDirectory(outputPath);
  }
  if (ytdlpHomePath) {
    ensureDirectory(ytdlpHomePath);
    args.push("--paths", `home:${ytdlpHomePath}`);
    args.push("--paths", `temp:${ytdlpHomePath}`);
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

  const fragments = Number(options.concurrentFragments || 8);
  if (Number.isFinite(fragments) && fragments > 1) {
    args.push("--concurrent-fragments", String(Math.min(Math.max(Math.floor(fragments), 1), 16)));
  }

  args.push(...customArgsParsed);

  args.push("--print", "after_move:filepath");
  args.push(url);

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
  });

  onStart?.();

  let lastFilepath = null;
  let totalFragments = 0;
  let completedFragments = 0;
  let currentFragmentProgress = 0;
  let lastReportedProgress = 0;
  const stderrLines = [];

  const parseDownloadProgress = (line) => {
    const cleanLine = stripAnsi(line);
    const isYtdlpDownloadLine = /\[download\]/i.test(cleanLine);
    const isAria2ProgressLine = /\[[^\]]+\bDL:[^\]]+\]/i.test(cleanLine) || /\(\s*\d+(?:\.\d+)?%\s*\)/.test(cleanLine);

    if (!isYtdlpDownloadLine && !isAria2ProgressLine) return null;

    const fragMatch =
      cleanLine.match(/Downloading fragment\s+(\d+)\s+of\s+(\d+)/i) ||
      cleanLine.match(/\bfragment\s+(\d+)\s*\/\s*(\d+)/i);
    if (fragMatch) {
      completedFragments = parseInt(fragMatch[1], 10) - 1;
      totalFragments = parseInt(fragMatch[2], 10);
      currentFragmentProgress = 0;
      return null;
    }

    const percentMatch =
      cleanLine.match(/\[download\]\s+([\d.]+)%/i) ||
      cleanLine.match(/\(\s*([\d.]+)%\s*\)/i);
    if (!percentMatch) return null;

    const rawPct = parseFloat(percentMatch[1]);
    currentFragmentProgress = rawPct;

    let overallProgress;
    if (totalFragments > 1) {
      overallProgress = Math.min(
        ((completedFragments + rawPct / 100) / totalFragments) * 100,
        99
      );
      if (rawPct >= 100 && completedFragments < totalFragments) {
        completedFragments = Math.min(completedFragments + 1, totalFragments);
      }
    } else {
      overallProgress = Math.min(rawPct, 99);
    }

    overallProgress = Math.max(overallProgress, lastReportedProgress);

    if (Math.abs(overallProgress - lastReportedProgress) < 0.5 && overallProgress < 99) {
      return null;
    }
    lastReportedProgress = overallProgress;

    const filesizeMatch =
      cleanLine.match(/\bof\s+~?\s*([\d.]+\s*(?:GiB|MiB|KiB|B|GB|MB|KB))/i) ||
      cleanLine.match(/\/\s*([\d.]+\s*(?:GiB|MiB|KiB|B|GB|MB|KB))\s*\(\s*[\d.]+%\s*\)/i);
    const speedMatch =
      cleanLine.match(/\bat\s+([\d.]+\s*(?:GiB|MiB|KiB|B|GB|MB|KB)\/s)/i) ||
      cleanLine.match(/\bDL:\s*([\d.]+\s*(?:GiB|MiB|KiB|B|GB|MB|KB))/i);
    const etaMatch =
      cleanLine.match(/\bETA\s+(\S+)/i) ||
      cleanLine.match(/\bETA:\s*([^\]\s]+)/i);

    return {
      progress: Math.round(overallProgress * 10) / 10,
      filesize: filesizeMatch ? parseSize(filesizeMatch[1]) : null,
      speed: speedMatch ? parseSize(speedMatch[1]) : null,
      eta: etaMatch ? etaMatch[1] : null,
      line,
    };
  };

  const heartbeatInterval = setInterval(() => {
    if (lastReportedProgress > 0 && lastReportedProgress < 99) {
      onProgress?.({
        progress: lastReportedProgress,
        speed: null,
        eta: null,
        filesize: null,
        line: null,
      });
    }
  }, 2000);

  const processLine = (line, source = "stdout") => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (source === "stderr") {
        stderrLines.push(line);
        if (stderrLines.length > 500) stderrLines.shift();
      }
      onLog?.(line);

      if (source === "stdout" && !trimmed.startsWith("[")) {
        lastFilepath = trimmed;
        return;
      }

      const progress = parseDownloadProgress(line);
      if (progress) {
        onProgress?.(progress);
        return;
      }

      // Merging
      if (line.includes("[Merger]") || line.includes("[ffmpeg]")) {
        onMerging?.();
        return;
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
  };

  const consumeStream = async (stream, source) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";
        for (const line of lines) {
          processLine(line, source);
        }
      }
    } catch {
      // stream closed
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      processLine(buffer, source);
    }
  };

  // Read stdout and stderr concurrently so progress/logs stay live.
  (async () => {
    const [exitCode] = await Promise.all([
      proc.exited,
      consumeStream(proc.stdout, "stdout"),
      consumeStream(proc.stderr, "stderr"),
    ]);

    clearInterval(heartbeatInterval);

    if (exitCode === 0) {
      const filepath = moveTempOutputs(tempPath, outputPath, lastFilepath);
      onComplete?.({ filepath });
    } else {
      const stderrText = stderrLines.join("\n");
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

export const __ytdlpTest = {
  metadataCache,
  parseCustomFlags,
  setCached,
};
