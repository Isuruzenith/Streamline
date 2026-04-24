import { homedir } from "os";
import { join } from "path";
import { startDownload } from "./ytdlp.js";
import { historyService } from "./history.js";

/**
 * Sequential download queue.
 * Processes one download at a time, notifies via callbacks.
 */
class DownloadQueue {
  constructor() {
    this.queue = []; // pending jobs
    this.active = null; // currently downloading
    this.completed = []; // completed/failed (in-memory recent)
    this.listeners = new Set();
    this.processing = false;
  }

  /**
   * Subscribe to queue events.
   * Listener receives: { type, downloadId, ...data }
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // ignore listener errors
      }
    }
  }

  /**
   * Add a download job to the queue.
   */
  add({ downloadId, url, title, thumbnail, formatId, preset, outputPath, filenameTemplate, cookieBrowser }) {
    const job = {
      downloadId,
      url,
      title: title || "Untitled",
      thumbnail: thumbnail || null,
      formatId: formatId || null,
      preset: preset || "best",
      outputPath: outputPath || join(homedir(), "Downloads"),
      filenameTemplate: filenameTemplate || "%(title)s.%(ext)s",
      cookieBrowser: cookieBrowser || null,
      status: "queued",
      addedAt: Date.now(),
    };

    this.queue.push(job);

    this.emit({
      type: "queue_update",
      downloadId,
      position: this.queue.length,
      total: this.queue.length + (this.active ? 1 : 0),
    });

    // Start processing if not already
    this.processNext();

    return {
      position: this.queue.length,
      downloadId,
    };
  }

  /**
   * Remove a queued item (not active).
   */
  remove(downloadId) {
    const idx = this.queue.findIndex((j) => j.downloadId === downloadId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      this.emit({ type: "removed", downloadId });
      return true;
    }
    return false;
  }

  /**
   * Cancel the active download.
   */
  cancel(downloadId) {
    if (this.active && this.active.downloadId === downloadId) {
      if (this.active.controller) {
        this.active.controller.kill();
      }
      this.active.status = "cancelled";
      this.completed.push(this.active);
      this.active = null;
      this.processing = false;

      this.emit({ type: "error", downloadId, error: "Download cancelled by user" });

      // Continue to next
      this.processNext();
      return true;
    }
    // Maybe it's in queue
    return this.remove(downloadId);
  }

  /**
   * Reorder a queued item.
   */
  reorder(downloadId, newIndex) {
    const idx = this.queue.findIndex((j) => j.downloadId === downloadId);
    if (idx === -1) return false;

    const [item] = this.queue.splice(idx, 1);
    const clampedIndex = Math.max(0, Math.min(newIndex, this.queue.length));
    this.queue.splice(clampedIndex, 0, item);

    this.emit({
      type: "queue_reorder",
      queue: this.queue.map((j) => j.downloadId),
    });
    return true;
  }

  /**
   * Process the next item in the queue.
   */
  async processNext() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift();
    this.active = job;

    const controller = startDownload({
      url: job.url,
      formatId: job.formatId,
      preset: job.preset,
      outputPath: job.outputPath,
      filenameTemplate: job.filenameTemplate,
      cookieBrowser: job.cookieBrowser,

      onProgress: (data) => {
        this.emit({
          type: "progress",
          downloadId: job.downloadId,
          progress: data.progress,
          speed: data.speed,
          eta: data.eta,
          filesize: data.filesize,
          line: data.line,
        });
      },

      onMerging: () => {
        this.emit({
          type: "merging",
          downloadId: job.downloadId,
        });
      },

      onComplete: (data) => {
        job.status = "complete";
        job.filepath = data.filepath;
        this.completed.push(job);
        this.active = null;
        this.processing = false;

        // Persist to history
        historyService.add({
          downloadId: job.downloadId,
          url: job.url,
          title: job.title,
          thumbnail: job.thumbnail,
          filepath: data.filepath,
          filesize: null,
          status: "complete",
        });

        this.emit({
          type: "complete",
          downloadId: job.downloadId,
          filepath: data.filepath,
          title: job.title,
        });

        // Process next
        this.processNext();
      },

      onError: (data) => {
        job.status = "error";
        job.error = data.error;
        this.completed.push(job);
        this.active = null;
        this.processing = false;

        // Also save errors to history
        historyService.add({
          downloadId: job.downloadId,
          url: job.url,
          title: job.title,
          thumbnail: job.thumbnail,
          filepath: null,
          filesize: null,
          status: "error",
        });

        this.emit({
          type: "error",
          downloadId: job.downloadId,
          error: data.error,
        });

        // Continue queue despite error
        this.processNext();
      },

      onLog: (line) => {
        this.emit({
          type: "log",
          downloadId: job.downloadId,
          line,
        });
      },
    });

    this.active.controller = controller;
  }

  /**
   * Get queue status summary.
   */
  getStatus() {
    return {
      active: this.active
        ? { downloadId: this.active.downloadId, url: this.active.url, title: this.active.title }
        : null,
      queued: this.queue.map((j) => ({
        downloadId: j.downloadId,
        url: j.url,
        title: j.title,
        thumbnail: j.thumbnail,
      })),
      completed: this.completed.slice(-20).map((h) => ({
        downloadId: h.downloadId,
        url: h.url,
        title: h.title,
        status: h.status,
        filepath: h.filepath || null,
        error: h.error || null,
      })),
    };
  }
}

// Singleton
export const downloadQueue = new DownloadQueue();
