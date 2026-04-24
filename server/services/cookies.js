import { join } from "path";
import { homedir } from "os";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { resolveYtdlpBin } from "./environment.js";

const STREAMLINE_DIR = join(homedir(), ".streamline");
const COOKIES_FILE = join(STREAMLINE_DIR, "cookies.txt");

/**
 * Export cookies from a browser to a Netscape cookies.txt file
 * using yt-dlp's built-in export.
 *
 * This avoids the "Could not copy Chrome cookie database" error
 * by letting yt-dlp do a one-shot copy when Chrome isn't locking it,
 * or by retrying a few times.
 *
 * @param {string} browser - e.g. "chrome", "firefox", "edge"
 * @returns {{ success: boolean, path?: string, error?: string }}
 */
export async function exportCookies(browser) {
  const ytdlpBin = resolveYtdlpBin();
  mkdirSync(STREAMLINE_DIR, { recursive: true });

  // yt-dlp can export cookies to a file via:
  // yt-dlp --cookies-from-browser chrome --cookies cookies.txt --skip-download "about:blank"
  // But the simplest approach: use a dummy extraction to trigger cookie export

  // Retry up to 3 times (Chrome DB locking is intermittent)
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const proc = Bun.spawn(
        [
          ytdlpBin,
          "--cookies-from-browser", browser,
          "--cookies", COOKIES_FILE,
          "--skip-download",
          "--no-warnings",
          "https://www.youtube.com/",
        ],
        {
          stdout: "pipe",
          stderr: "pipe",
        }
      );

      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      if (exitCode === 0 && existsSync(COOKIES_FILE)) {
        return { success: true, path: COOKIES_FILE };
      }

      lastError = stderr.trim();

      // If it's not a DB lock error, don't retry
      if (!lastError.includes("Could not copy") && !lastError.includes("database is locked")) {
        break;
      }

      // Wait a bit before retrying (Chrome may release the lock)
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    } catch (err) {
      lastError = err.message;
    }
  }

  return { success: false, error: lastError || "Failed to export cookies" };
}

/**
 * Get the cookies argument to pass to yt-dlp.
 * Returns an array of args like ["--cookies", "/path/to/cookies.txt"]
 * or ["--cookies-from-browser", "firefox"] for browsers that don't lock their DB.
 *
 * @param {string} cookieBrowser - e.g. "chrome", "firefox", "edge", "brave"
 * @returns {string[]}
 */
export function getCookieArgs(cookieBrowser) {
  if (!cookieBrowser) return [];

  // Firefox doesn't lock its cookie DB, so --cookies-from-browser works directly
  const noLockBrowsers = ["firefox"];

  if (noLockBrowsers.includes(cookieBrowser)) {
    return ["--cookies-from-browser", cookieBrowser];
  }

  // For Chrome/Edge/Brave/etc: prefer exported cookie file if available
  if (existsSync(COOKIES_FILE)) {
    return ["--cookies", COOKIES_FILE];
  }

  // Fallback: try --cookies-from-browser (may work if browser is closed)
  return ["--cookies-from-browser", cookieBrowser];
}

/**
 * Get path to the cookies file.
 */
export function getCookiesFilePath() {
  return COOKIES_FILE;
}

/**
 * Check if cookies file exists and is recent (within 24h).
 */
export function getCookieStatus() {
  if (!existsSync(COOKIES_FILE)) {
    return { exists: false, path: COOKIES_FILE };
  }

  try {
    const { statSync } = require("fs");
    const stat = statSync(COOKIES_FILE);
    const ageMs = Date.now() - stat.mtimeMs;
    const ageHours = ageMs / (1000 * 60 * 60);

    return {
      exists: true,
      path: COOKIES_FILE,
      ageHours: Math.round(ageHours * 10) / 10,
      stale: ageHours > 24,
    };
  } catch {
    return { exists: true, path: COOKIES_FILE };
  }
}

/**
 * Delete the cookies file.
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
