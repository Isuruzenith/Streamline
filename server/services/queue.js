import { homedir } from "os";
import { join } from "path";
import { startDownload } from "./ytdlp.js";

/**
 * Sequential download queue.
 * Processes one download at a time, notifies via callbacks.
 */
class DownloadQueue {
  constructor() {
    this.queue = []; // pending jobs
    this.active = null; // currently downloading
    this.history = []; // completed/failed
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
  add({ downloadId, url, formatId, preset, outputPath, filenameTemplate }) {
    const job = {
      downloadId,
      url,
      formatId: formatId || null,
      preset: preset || "best",
      outputPath: outputPath || join(homedir(), "Downloads"),
      filenameTemplate: filenameTemplate || "%(title)s.%(ext)s",
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
        this.history.push(job);
        this.active = null;
        this.processing = false;

        this.emit({
          type: "complete",
          downloadId: job.downloadId,
          filepath: data.filepath,
        });

        // Process next
        this.processNext();
      },

      onError: (data) => {
        job.status = "error";
        job.error = data.error;
        this.history.push(job);
        this.active = null;
        this.processing = false;

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
        ? { downloadId: this.active.downloadId, url: this.active.url }
        : null,
      queued: this.queue.length,
      history: this.history.slice(-20).map((h) => ({
        downloadId: h.downloadId,
        url: h.url,
        status: h.status,
        filepath: h.filepath || null,
        error: h.error || null,
      })),
    };
  }
}

// Singleton
export const downloadQueue = new DownloadQueue();
