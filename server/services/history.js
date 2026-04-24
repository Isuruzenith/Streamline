import { join } from "path";
import { homedir } from "os";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const STREAMLINE_DIR = join(homedir(), ".streamline");
const HISTORY_FILE = join(STREAMLINE_DIR, "history.json");
const MAX_ENTRIES = 200;

/**
 * Persistent download history stored as JSON on disk.
 * Each entry: { id, url, title, thumbnail, filepath, filesize, status, completedAt }
 */
class HistoryService {
  constructor() {
    this._cache = null;
  }

  /**
   * Load history from disk (cached after first read).
   */
  _load() {
    if (this._cache) return this._cache;
    try {
      if (existsSync(HISTORY_FILE)) {
        this._cache = JSON.parse(readFileSync(HISTORY_FILE, "utf-8"));
        return this._cache;
      }
    } catch {
      // corrupted file — start fresh
    }
    this._cache = [];
    return this._cache;
  }

  /**
   * Persist current cache to disk.
   */
  _save() {
    try {
      mkdirSync(STREAMLINE_DIR, { recursive: true });
      writeFileSync(HISTORY_FILE, JSON.stringify(this._cache, null, 2));
    } catch (err) {
      console.error("[history] Failed to save:", err.message);
    }
  }

  /**
   * Add a completed download to history.
   */
  add({ downloadId, url, title, thumbnail, filepath, filesize, status }) {
    const entries = this._load();

    // Avoid duplicates
    const existing = entries.findIndex((e) => e.id === downloadId);
    if (existing !== -1) {
      entries[existing] = {
        ...entries[existing],
        filepath,
        filesize,
        status,
        completedAt: new Date().toISOString(),
      };
    } else {
      entries.unshift({
        id: downloadId,
        url,
        title: title || "Untitled",
        thumbnail: thumbnail || null,
        filepath: filepath || null,
        filesize: filesize || null,
        status: status || "complete",
        completedAt: new Date().toISOString(),
      });
    }

    // Trim to max
    if (entries.length > MAX_ENTRIES) {
      entries.length = MAX_ENTRIES;
    }

    this._cache = entries;
    this._save();
  }

  /**
   * Get all history entries.
   */
  list() {
    return this._load();
  }

  /**
   * Remove a single entry by ID.
   */
  remove(id) {
    const entries = this._load();
    this._cache = entries.filter((e) => e.id !== id);
    this._save();
  }

  /**
   * Clear all history.
   */
  clear() {
    this._cache = [];
    this._save();
  }
}

export const historyService = new HistoryService();
