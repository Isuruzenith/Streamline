import { join } from "path";
import { homedir } from "os";
import { existsSync, mkdirSync, writeFileSync, unlinkSync, statSync, renameSync } from "fs";
import { resolveYtdlpBin } from "./environment.js";

const STREAMLINE_DIR = join(homedir(), ".streamline");
const COOKIES_FILE = join(STREAMLINE_DIR, "cookies.txt");
const SUPPORTED_BROWSERS = new Set([
  "brave",
  "chrome",
  "chromium",
  "edge",
  "firefox",
  "opera",
  "safari",
  "vivaldi",
]);

/**
 * Get the yt-dlp cookie args if a cookies.txt file exists.
 * Returns ["--cookies", "/path/to/cookies.txt"] or [].
 */
export function getCookieArgs() {
  if (existsSync(COOKIES_FILE)) {
    return ["--cookies", COOKIES_FILE];
  }
  return [];
}

/**
 * Save an uploaded cookies.txt file to disk.
 */
export function saveCookieFile(content) {
  mkdirSync(STREAMLINE_DIR, { recursive: true });
  writeFileSync(COOKIES_FILE, content);
  return { success: true, path: COOKIES_FILE };
}

/**
 * Ask yt-dlp to export browser cookies into Streamline's cookies.txt.
 */
export async function importCookiesFromBrowser(browser) {
  const normalizedBrowser = String(browser || "").trim().toLowerCase();

  if (!SUPPORTED_BROWSERS.has(normalizedBrowser)) {
    throw new Error("Unsupported browser for cookie import");
  }

  mkdirSync(STREAMLINE_DIR, { recursive: true });
  const tmpCookiesFile = join(STREAMLINE_DIR, `cookies.${normalizedBrowser}.tmp.txt`);
  if (existsSync(tmpCookiesFile)) {
    unlinkSync(tmpCookiesFile);
  }

  const ytdlpBin = resolveYtdlpBin();
  const proc = Bun.spawn([
    ytdlpBin,
    "--cookies-from-browser",
    normalizedBrowser,
    "--cookies",
    tmpCookiesFile,
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;

  if (exitCode !== 0 || !existsSync(tmpCookiesFile) || statSync(tmpCookiesFile).size === 0) {
    const message = stderr.trim() || stdout.trim() || `yt-dlp exited with code ${exitCode}`;
    throw new Error(message);
  }

  renameSync(tmpCookiesFile, COOKIES_FILE);

  return {
    success: true,
    path: COOKIES_FILE,
    browser: normalizedBrowser,
    message: stdout.trim() || stderr.trim() || null,
  };
}

/**
 * Check if a cookies.txt file exists and return its status.
 */
export function getCookieStatus() {
  if (!existsSync(COOKIES_FILE)) {
    return { exists: false, path: COOKIES_FILE };
  }

  try {
    const stat = statSync(COOKIES_FILE);
    const ageMs = Date.now() - stat.mtimeMs;
    const ageHours = Math.round((ageMs / (1000 * 60 * 60)) * 10) / 10;

    return {
      exists: true,
      path: COOKIES_FILE,
      sizeBytes: stat.size,
      ageHours,
      uploadedAt: stat.mtime.toISOString(),
    };
  } catch {
    return { exists: true, path: COOKIES_FILE };
  }
}

/**
 * Delete the cookies.txt file.
 */
export function clearCookies() {
  try {
    if (existsSync(COOKIES_FILE)) {
      unlinkSync(COOKIES_FILE);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
