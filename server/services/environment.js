import { basename, join } from "path";
import { homedir } from "os";
import { existsSync, readFileSync } from "fs";

const STREAMLINE_DIR = join(homedir(), ".streamline");
const ENV_FILE = join(STREAMLINE_DIR, "env.json");

/**
 * Read the env.json manifest written during provisioning.
 */
export function readEnvManifest() {
  try {
    if (existsSync(ENV_FILE)) {
      return JSON.parse(readFileSync(ENV_FILE, "utf-8"));
    }
  } catch {
    // corrupted or missing
  }
  return null;
}

/**
 * Resolve the path to the yt-dlp binary.
 * Priority: venv bin → system PATH
 */
export function resolveYtdlpBin() {
  const manifest = readEnvManifest();

  // Check venv first
  if (manifest?.venvPath) {
    const isWin = process.platform === "win32";
    const venvBin = isWin
      ? join(manifest.venvPath, "Scripts", "yt-dlp.exe")
      : join(manifest.venvPath, "bin", "yt-dlp");
    if (existsSync(venvBin)) return venvBin;
  }

  // Fallback: assume yt-dlp is on PATH
  return "yt-dlp";
}

/**
 * Resolve the path to Python binary.
 */
export function resolvePythonBin() {
  const manifest = readEnvManifest();

  // Venv python (priority)
  if (manifest?.venvPath) {
    const isWin = process.platform === "win32";
    const venvPython = isWin
      ? join(manifest.venvPath, "Scripts", "python.exe")
      : join(manifest.venvPath, "bin", "python3");
    if (existsSync(venvPython)) return venvPython;
  }

  // Base python installation
  if (manifest?.pythonPath && existsSync(manifest.pythonPath)) {
    return manifest.pythonPath;
  }

  return "python3";
}

/**
 * Check health of all dependencies and return structured status.
 */
export async function checkEnvironment() {
  const result = {
    python: { ok: false, version: null, path: null, error: null },
    ytdlp: { ok: false, version: null, path: null, error: null },
    ffmpeg: { ok: false, version: null, path: null, error: null },
    ffprobe: { ok: false, version: null, path: null, error: null },
  };

  // Python
  try {
    const pythonBin = resolvePythonBin();
    const proc = Bun.spawn([pythonBin, "--version"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode === 0) {
      result.python.ok = true;
      result.python.version = output.trim().replace("Python ", "");
      result.python.path = pythonBin;
    } else {
      result.python.error = "Python binary returned non-zero exit code";
    }
  } catch (err) {
    result.python.error = `Python not found: ${err.message}`;
  }

  // yt-dlp
  try {
    const ytdlpBin = resolveYtdlpBin();
    const proc = Bun.spawn([ytdlpBin, "--version"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode === 0) {
      result.ytdlp.ok = true;
      result.ytdlp.version = output.trim();
      result.ytdlp.path = ytdlpBin;
    } else {
      result.ytdlp.error = "yt-dlp returned non-zero exit code";
    }
  } catch (err) {
    result.ytdlp.error = `yt-dlp not found: ${err.message}`;
  }

  // ffmpeg
  try {
    const ffmpegBin = resolveFFmpegBin();
    const proc = Bun.spawn([ffmpegBin, "-version"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode === 0) {
      const versionMatch = output.match(/ffmpeg version (\S+)/);
      result.ffmpeg.ok = true;
      result.ffmpeg.version = versionMatch ? versionMatch[1] : "installed";
      result.ffmpeg.path = ffmpegBin;
    } else {
      result.ffmpeg.error = "ffmpeg returned non-zero exit code";
    }
  } catch (err) {
    result.ffmpeg.error = `ffmpeg not found: ${err.message}`;
  }

  // ffprobe
  try {
    const ffprobeBin = resolveFFprobeBin();
    const proc = Bun.spawn([ffprobeBin, "-version"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode === 0) {
      const versionMatch = output.match(/ffprobe version (\S+)/);
      result.ffprobe.ok = true;
      result.ffprobe.version = versionMatch ? versionMatch[1] : "installed";
      result.ffprobe.path = ffprobeBin;
    } else {
      result.ffprobe.error = "ffprobe returned non-zero exit code";
    }
  } catch (err) {
    result.ffprobe.error = `ffprobe not found: ${err.message}`;
  }

  return result;
}

/**
 * Resolve ffmpeg binary path.
 */
export function resolveFFmpegBin() {
  const manifest = readEnvManifest();

  if (manifest?.ffmpegPath && existsSync(manifest.ffmpegPath)) {
    return manifest.ffmpegPath;
  }

  // Fallback
  return "ffmpeg";
}

/**
 * Resolve ffprobe binary path.
 */
export function resolveFFprobeBin() {
  const manifest = readEnvManifest();

  if (manifest?.ffprobePath && existsSync(manifest.ffprobePath)) {
    return manifest.ffprobePath;
  }

  const binary = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
  if (manifest?.ffmpegLocation) {
    const candidate = join(manifest.ffmpegLocation, binary);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return "ffprobe";
}

/**
 * Resolve the path to pass to yt-dlp's --ffmpeg-location.
 * This can be either a directory containing ffmpeg/ffprobe or an ffmpeg binary.
 */
export function resolveFFmpegLocation() {
  const manifest = readEnvManifest();

  if (manifest?.ffmpegLocation && existsSync(manifest.ffmpegLocation)) {
    return manifest.ffmpegLocation;
  }

  if (manifest?.ffmpegPath && existsSync(manifest.ffmpegPath)) {
    return manifest.ffmpegPath;
  }

  return null;
}

/**
 * Resolve the current Bun executable so yt-dlp can use it as a JS runtime.
 */
export function resolveBunBin() {
  const execPath = process.execPath;
  if (execPath && existsSync(execPath) && basename(execPath).toLowerCase().startsWith("bun")) {
    return execPath;
  }

  return null;
}
