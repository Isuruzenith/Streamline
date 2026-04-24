import { join } from "path";
import { homedir } from "os";
import { existsSync, mkdirSync, writeFileSync, unlinkSync, statSync } from "fs";

const STREAMLINE_DIR = join(homedir(), ".streamline");
const COOKIES_FILE = join(STREAMLINE_DIR, "cookies.txt");

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
