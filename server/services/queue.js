import { homedir } from "os";
import { join } from "path";
import { startDownload } from "./ytdlp.js";
import { historyService } from "./history.js";
import { createDownloadTempDir, markDownloadTempActive, markDownloadTempComplete } from "./temp.js";

/**
 * Sequential download queue.
 * Processes one download at a time, notifies via callbacks.
 */
class DownloadQueue {
  constructor() {
    this.queue = []; // pending jobs
    this.active = null; // currently downloading
    this.completed = []; // completed/failed (in-memory recent)
    this.pausedJobs = new Map(); // downloadId -> job snapshot
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
  add({
    downloadId,
    url,
    title,
    thumbnail,
    formatId,
    formatType,
    preset,
    outputPath,
    filenameTemplate,
    options,
  }) {
    const job = {
      downloadId,
      url,
      title: title || "Untitled",
      thumbnail: thumbnail || null,
      formatId: formatId || null,
      formatType: formatType || null,
      preset: preset || "best",
      outputPath: outputPath || join(homedir(), "Downloads", "Streamline"),
      filenameTemplate: filenameTemplate || "%(title)s.%(ext)s",
      options: options || {},
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
      const progress = this.active.progress || 0;
      const shouldPause = progress > 5;
      this.active.status = shouldPause ? "paused" : "cancelled";

      if (this.active.controller) {
        this.active.controller.kill();
      }
      markDownloadTempComplete(this.active.tempPath);

      if (shouldPause) {
        this.pausedJobs.set(downloadId, {
          ...this.active,
          status: "paused",
          pausedAt: Date.now(),
          controller: null,
        });
        this.emit({ type: "paused", downloadId, progress });
      } else {
        this.completed.push(this.active);
        this.emit({ type: "error", downloadId, error: "Download cancelled by user" });
      }

      this.active = null;
      this.processing = false;

      // Continue to next
      this.processNext();
      return true;
    }
    // Maybe it's in queue
    return this.remove(downloadId);
  }

  /**
   * Resume a paused download by moving it back to the front of the queue.
   */
  resume(downloadId) {
    const job = this.pausedJobs.get(downloadId);
    if (!job) return false;

    this.pausedJobs.delete(downloadId);
    this.queue.unshift({
      ...job,
      status: "queued",
      progress: 0,
      controller: null,
    });
    this.emit({
      type: "queue_update",
      downloadId,
      position: 1,
      total: this.queue.length + (this.active ? 1 : 0),
    });
    this.processNext();
    return true;
  }

  /**
   * Retry a failed/completed job by placing it back on the front of the queue.
   */
  retry(downloadId) {
    const completedIndex = this.completed.findIndex((job) => job.downloadId === downloadId);
    const queuedJob = this.queue.find((job) => job.downloadId === downloadId);

    if (queuedJob) {
      queuedJob.status = "queued";
      queuedJob.progress = 0;
      queuedJob.error = null;
      this.processNext();
      return true;
    }

    if (completedIndex === -1) return false;

    const [job] = this.completed.splice(completedIndex, 1);
    this.queue.unshift({
      ...job,
      status: "queued",
      progress: 0,
      speed: null,
      eta: null,
      error: null,
      filepath: null,
      controller: null,
      tempPath: null,
    });
    this.emit({
      type: "queue_update",
      downloadId,
      position: 1,
      total: this.queue.length + (this.active ? 1 : 0),
    });
    this.processNext();
    return true;
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
    if (job.tempPath) {
      markDownloadTempActive(job.tempPath);
    } else {
      job.tempPath = createDownloadTempDir(job.downloadId);
    }

    let controller;
    try {
      controller = startDownload({
        url: job.url,
        formatId: job.formatId,
        formatType: job.formatType,
        preset: job.preset,
        outputPath: job.outputPath,
        tempPath: job.tempPath,
        filenameTemplate: job.filenameTemplate,
        options: job.options,

        onStart: () => {
          if (this.active?.downloadId === job.downloadId) {
            this.active.status = "downloading";
            this.active.progress = this.active.progress || 0;
          }
          this.emit({
            type: "started",
            downloadId: job.downloadId,
          });
        },

        onProgress: (data) => {
          if (this.active?.downloadId === job.downloadId) {
            this.active.status = "downloading";
            this.active.progress = data.progress;
            this.active.speed = data.speed;
            this.active.eta = data.eta;
            this.active.filesize = data.filesize;
          }
          this.emit({
            type: "progress",
            downloadId: job.downloadId,
            progress: data.progress,
            speed: data.speed,
            eta: data.eta,
            filesize: data.filesize,
          });
        },

        onMerging: () => {
          this.emit({
            type: "merging",
            downloadId: job.downloadId,
          });
        },

        onComplete: (data) => {
          if (job.status === "paused" || job.status === "cancelled") return;
          markDownloadTempComplete(job.tempPath);
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
          if (job.status === "paused" || job.status === "cancelled") return;
          markDownloadTempComplete(job.tempPath);
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
    } catch (err) {
      markDownloadTempComplete(job.tempPath);
      job.status = "error";
      job.error = err.message;
      this.completed.push(job);
      this.active = null;
      this.processing = false;
      this.emit({ type: "error", downloadId: job.downloadId, error: err.message });
      this.processNext();
      return;
    }

    this.active.controller = controller;
  }

  /**
   * Get queue status summary.
   */
  getStatus() {
    return {
      active: this.active
        ? {
            downloadId: this.active.downloadId,
            url: this.active.url,
            title: this.active.title,
            thumbnail: this.active.thumbnail,
            progress: this.active.progress || 0,
          }
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
      paused: [...this.pausedJobs.values()].map((j) => ({
        downloadId: j.downloadId,
        url: j.url,
        title: j.title,
        thumbnail: j.thumbnail,
        progress: j.progress,
      })),
    };
  }
}

// Singleton
export const downloadQueue = new DownloadQueue();
