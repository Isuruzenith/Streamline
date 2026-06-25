import { join } from "path";
import { homedir } from "os";
import { mkdirSync } from "fs";
import { Database } from "bun:sqlite";

const STREAMLINE_DIR = join(homedir(), ".streamline");
const DB_FILE = join(STREAMLINE_DIR, "streamline.db");
const MAX_ENTRIES = 200;

/**
 * Persistent download history stored in SQLite on disk.
 * Each entry: { id, url, title, thumbnail, filepath, filesize, status, completedAt }
 */
class HistoryService {
  constructor() {
    try {
      mkdirSync(STREAMLINE_DIR, { recursive: true });
      this.db = new Database(DB_FILE);
      this.db.run(`
        CREATE TABLE IF NOT EXISTS history (
          id TEXT PRIMARY KEY,
          url TEXT,
          title TEXT,
          thumbnail TEXT,
          filepath TEXT,
          filesize INTEGER,
          status TEXT,
          completedAt TEXT
        )
      `);
    } catch (err) {
      console.error("[history] Failed to initialize SQLite database:", err.message);
    }
  }

  /**
   * Add a completed/failed download to history.
   */
  add({ downloadId, url, title, thumbnail, filepath, filesize, status }) {
    if (!this.db) return;

    try {
      const existing = this.db.prepare("SELECT 1 FROM history WHERE id = ?").get(downloadId);

      if (existing) {
        this.db.prepare(`
          UPDATE history 
          SET filepath = ?, filesize = ?, status = ?, completedAt = ? 
          WHERE id = ?
        `).run(
          filepath || null,
          filesize || null,
          status || "complete",
          new Date().toISOString(),
          downloadId
        );
      } else {
        this.db.prepare(`
          INSERT INTO history (id, url, title, thumbnail, filepath, filesize, status, completedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          downloadId,
          url || null,
          title || "Untitled",
          thumbnail || null,
          filepath || null,
          filesize || null,
          status || "complete",
          new Date().toISOString()
        );
      }

      // Trim to MAX_ENTRIES
      this.db.prepare(`
        DELETE FROM history 
        WHERE id NOT IN (
          SELECT id FROM history 
          ORDER BY completedAt DESC 
          LIMIT ?
        )
      `).run(MAX_ENTRIES);
    } catch (err) {
      console.error("[history] Failed to add entry:", err.message);
    }
  }

  /**
   * Get all history entries.
   */
  list() {
    if (!this.db) return [];
    try {
      return this.db.prepare("SELECT * FROM history ORDER BY completedAt DESC").all();
    } catch (err) {
      console.error("[history] Failed to list entries:", err.message);
      return [];
    }
  }

  /**
   * Remove a single entry by ID.
   */
  remove(id) {
    if (!this.db) return;
    try {
      this.db.prepare("DELETE FROM history WHERE id = ?").run(id);
    } catch (err) {
      console.error("[history] Failed to remove entry:", err.message);
    }
  }

  /**
   * Clear all history.
   */
  clear() {
    if (!this.db) return;
    try {
      this.db.prepare("DELETE FROM history").run();
    } catch (err) {
      console.error("[history] Failed to clear history:", err.message);
    }
  }
}

export const historyService = new HistoryService();

