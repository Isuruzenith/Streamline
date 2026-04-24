import { resolveYtdlpBin } from "./environment.js";
import { getCookieArgs } from "./cookies.js";

/**
 * Detect whether a URL is a playlist.
 * Uses --flat-playlist --dump-json which outputs one JSON line per entry.
 */
export async function detectPlaylist(url) {
  const ytdlpBin = resolveYtdlpBin();

  // Quick check: use --flat-playlist to see if multiple entries exist
  const args = [ytdlpBin, "--flat-playlist", "--dump-json", "--no-warnings", "--no-check-formats", ...getCookieArgs()];
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
  if (lines.length <= 1) return false;

  // Check if first entry has playlist metadata
  try {
    const first = JSON.parse(lines[0]);
    return !!(first._type === "url" || first.ie_key || lines.length > 1);
  } catch {
    return false;
  }
}

/**
 * Fetch playlist info with all entries.
 * Returns: { is_playlist, playlist_title, playlist_count, entries[] }
 */
export async function getPlaylistInfo(url) {
  const ytdlpBin = resolveYtdlpBin();

  const args = [ytdlpBin, "--flat-playlist", "--dump-json", "--no-warnings", ...getCookieArgs()];
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
    throw new Error(errorLines || stderr.trim() || "yt-dlp failed");
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

  return {
    is_playlist: true,
    playlist_title: playlistTitle,
    playlist_count: entries.length,
    entries,
  };
}

/**
 * Fetch media info / formats for a given URL using yt-dlp --dump-json.
 * Returns parsed JSON with title, thumbnail, duration, formats array, etc.
 */
export async function getFormats(url) {
  const ytdlpBin = resolveYtdlpBin();

  const args = [ytdlpBin, "--dump-json", "--no-warnings", "--no-playlist", "--no-check-formats", ...getCookieArgs()];
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
    // Extract meaningful error from stderr
    const errorLines = stderr
      .split("\n")
      .filter((l) => l.includes("ERROR"))
      .join("; ");
    throw new Error(errorLines || stderr.trim() || "yt-dlp failed");
  }

  try {
    const data = JSON.parse(stdout);
    return {
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
 * @param {string} options.filenameTemplate - yt-dlp output template
 * @param {function} options.onProgress - callback({progress, speed, eta, filesize, line})
 * @param {function} options.onMerging - called when merging begins
 * @param {function} options.onComplete - callback({filepath})
 * @param {function} options.onError - callback({error, stderr})
 * @param {function} options.onLog - callback(line)
 */
export function startDownload({
  url,
  formatId,
  preset,
  outputPath,
  filenameTemplate,
  onProgress,
  onMerging,
  onComplete,
  onError,
  onLog,
}) {
  const ytdlpBin = resolveYtdlpBin();

  const args = [ytdlpBin, "--newline", "--no-warnings", "--no-check-formats", ...getCookieArgs()];

  // Format selection
  if (formatId) {
    args.push("-f", formatId);
  } else if (preset) {
    switch (preset) {
      case "best":
        args.push("-f", "bv*+ba/b");
        break;
      case "1080p":
        args.push("-f", "bv*[height<=1080]+ba/b[height<=1080]/b");
        break;
      case "720p":
        args.push("-f", "bv*[height<=720]+ba/b[height<=720]/b");
        break;
      case "audio":
        args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
        break;
      default:
        args.push("-f", "bv*+ba/b");
    }
  }

  // Output path
  if (outputPath && filenameTemplate) {
    args.push("-o", `${outputPath}/${filenameTemplate}`);
  } else if (outputPath) {
    args.push("-o", `${outputPath}/%(title)s.%(ext)s`);
  }

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
      if (!line.trim()) continue;
      onLog?.(line);

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
        error: errorLines || "Download failed with exit code " + exitCode,
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
