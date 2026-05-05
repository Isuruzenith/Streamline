import { homedir } from "os";
import { join } from "path";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";

const DEFAULT_DOWNLOAD_DIR = join(homedir(), "Downloads", "Streamline");
const CLEANUP_DELAY_MS = 60 * 60 * 1000;
const ACTIVE_STALE_MS = 24 * 60 * 60 * 1000;

function getDownloadTempRoot(outputPath = DEFAULT_DOWNLOAD_DIR) {
  return join(outputPath || DEFAULT_DOWNLOAD_DIR, "temp");
}

function safeId(id) {
  const clean = String(id || Date.now()).replace(/[^a-zA-Z0-9._-]/g, "_");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${clean}-${suffix}`;
}

function activeMarkerPath(tempPath) {
  return join(tempPath, ".active");
}

export function createDownloadTempDir(downloadId, outputPath) {
  cleanupExpiredDownloadTemps(Date.now(), outputPath);

  const tempPath = join(getDownloadTempRoot(outputPath), safeId(downloadId));
  markDownloadTempActive(tempPath);
  return tempPath;
}

export function markDownloadTempActive(tempPath) {
  if (!tempPath) return;

  mkdirSync(tempPath, { recursive: true });
  writeFileSync(activeMarkerPath(tempPath), new Date().toISOString());
}

export function markDownloadTempComplete(tempPath) {
  if (!tempPath) return;

  try {
    const marker = activeMarkerPath(tempPath);
    if (existsSync(marker)) {
      unlinkSync(marker);
    }
  } catch {
    // best effort
  }

  scheduleDownloadTempCleanup(tempPath);
}

export function scheduleDownloadTempCleanup(tempPath, delayMs = CLEANUP_DELAY_MS) {
  if (!tempPath) return;

  const timer = setTimeout(() => {
    removeInactiveTempDir(tempPath);
  }, delayMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }
}

export function cleanupExpiredDownloadTemps(now = Date.now(), outputPath) {
  const downloadTempDir = getDownloadTempRoot(outputPath);
  if (!existsSync(downloadTempDir)) return;

  for (const entry of readdirSync(downloadTempDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const tempPath = join(downloadTempDir, entry.name);
    try {
      const stat = statSync(tempPath);
      const marker = activeMarkerPath(tempPath);
      const isActive = existsSync(marker);
      const maxAge = isActive ? ACTIVE_STALE_MS : CLEANUP_DELAY_MS;

      if (now - stat.mtimeMs > maxAge) {
        removeTempDir(tempPath);
      }
    } catch {
      // best effort
    }
  }
}

function removeInactiveTempDir(tempPath) {
  if (existsSync(activeMarkerPath(tempPath))) return;
  removeTempDir(tempPath);
}

export function removeDownloadTempDir(tempPath) {
  if (!tempPath) return;
  removeTempDir(tempPath);
}

function removeTempDir(tempPath) {
  try {
    rmSync(tempPath, { recursive: true, force: true });
  } catch {
    // best effort
  }
}
