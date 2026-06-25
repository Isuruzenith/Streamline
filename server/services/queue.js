import { homedir } from "os";
import { join, resolve } from "path";
import { startDownload } from "./ytdlp.js";
import { historyService } from "./history.js";
import {
  createDownloadTempDir,
  markDownloadTempActive,
  markDownloadTempComplete,
  removeDownloadTempDir,
} from "./temp.js";

/**
 * Concurrently-enabled download queue.
 * Processes multiple downloads up to a configurable concurrency limit.
 */
export class DownloadQueue {
  constructor() {
    this.queue = []; // pending jobs
    this.activeJobs = new Map(); // downloadId -> active job
    this.completed = []; // completed/failed (in-memory recent)
    this.pausedJobs = new Map(); // downloadId -> job snapshot
    this.listeners = new Set();
    this.concurrencyLimit = 1;
  }

  get active() {
    return this.activeJobs.size > 0 ? this.activeJobs.values().next().value : null;
  }

  set active(val) {
    if (!val) {
      const firstKey = this.activeJobs.keys().next().value;
      if (firstKey) this.activeJobs.delete(firstKey);
    } else {
      this.activeJobs.set(val.downloadId, val);
    }
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

  pushCompleted(job) {
    this.completed.push(job);
    if (this.completed.length > 100) this.completed.shift();
  }

  hasDownloadId(downloadId) {
    return (
      this.activeJobs.has(downloadId) ||
      this.queue.some((job) => job.downloadId === downloadId) ||
      this.pausedJobs.has(downloadId) ||
      this.completed.some((job) => job.downloadId === downloadId)
    );
  }

  hasKnownFilepath(filepath) {
    const resolvedFilepath = resolve(filepath);
    return this.completed.some((job) => job.filepath && resolve(job.filepath) === resolvedFilepath);
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
    if (this.hasDownloadId(downloadId)) {
      throw new Error(`Duplicate downloadId: ${downloadId}`);
    }

    if (options && options.concurrencyLimit) {
      this.concurrencyLimit = Math.max(1, Math.min(parseInt(options.concurrencyLimit, 10) || 1, 4));
    }

    const job = {
      downloadId,
      url,
      title: title || "Untitled",
      thumbnail: thumbnail || null,
      formatId: formatId || null,
      formatType: formatType || null,
      preset: preset || "best-mp4",
      outputPath: outputPath || join(homedir(), "Downloads", "Streamline"),
      filenameTemplate: filenameTemplate || "%(title)s.%(ext)s",
      options: options || {},
      status: "queued",
      progress: 0,
      speed: null,
      eta: null,
      filesize: null,
      addedAt: Date.now(),
    };

    this.queue.push(job);

    this.emit({
      type: "queue_update",
      downloadId,
      position: this.queue.length,
      total: this.queue.length + this.activeJobs.size,
    });

    // Start processing if not already at concurrency limit
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
    const activeJob = this.activeJobs.get(downloadId);
    if (activeJob) {
      const progress = activeJob.progress || 0;
      const shouldPause = progress > 5;
      activeJob.status = shouldPause ? "paused" : "cancelled";

      if (activeJob.controller) {
        activeJob.controller.kill();
      }
      markDownloadTempComplete(activeJob.tempPath);

      if (shouldPause) {
        this.pausedJobs.set(downloadId, {
          ...activeJob,
          status: "paused",
          pausedAt: Date.now(),
          controller: null,
        });
        this.emit({ type: "paused", downloadId, progress });
      } else {
        this.pushCompleted(activeJob);
        this.emit({ type: "error", downloadId, error: "Download cancelled by user" });
      }

      this.activeJobs.delete(downloadId);

      setTimeout(() => this.processNext(), 0);
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
      total: this.queue.length + this.activeJobs.size,
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
      total: this.queue.length + this.activeJobs.size,
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
    if (this.activeJobs.size >= this.concurrencyLimit || this.queue.length === 0) return;

    const job = this.queue.shift();
    if (!job) return;

    this.activeJobs.set(job.downloadId, job);
    job.status = "queued";
    job.progress = job.progress ?? 0;
    job.speed = job.speed ?? null;
    job.eta = job.eta ?? null;
    if (job.tempPath) {
      markDownloadTempActive(job.tempPath);
    } else {
      job.tempPath = createDownloadTempDir(job.downloadId, job.outputPath);
    }

    // Schedule next if we still have concurrency slots free
    if (this.activeJobs.size < this.concurrencyLimit && this.queue.length > 0) {
      setTimeout(() => this.processNext(), 50);
    }

    let controller;
    const finishCurrent = () => {
      this.activeJobs.delete(job.downloadId);
      if (this.queue.length > 0) setTimeout(() => this.processNext(), 0);
    };

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
          const activeJob = this.activeJobs.get(job.downloadId);
          if (activeJob) {
            activeJob.status = "downloading";
            activeJob.progress = activeJob.progress || 0;
          }
          this.emit({
            type: "started",
            downloadId: job.downloadId,
          });
        },

        onProgress: (data) => {
          const activeJob = this.activeJobs.get(job.downloadId);
          if (activeJob) {
            activeJob.status = "downloading";
            activeJob.progress = data.progress ?? activeJob.progress ?? 0;
            activeJob.speed = data.speed ?? null;
            activeJob.eta = data.eta ?? null;
            activeJob.filesize = data.filesize ?? activeJob.filesize ?? null;
          }
          this.emit({
            type: "progress",
            downloadId: job.downloadId,
            progress: data.progress ?? activeJob?.progress ?? 0,
            speed: data.speed ?? null,
            eta: data.eta ?? null,
            filesize: data.filesize ?? null,
          });
        },

        onMerging: () => {
          const activeJob = this.activeJobs.get(job.downloadId);
          if (activeJob) {
            activeJob.status = "merging";
          }
          this.emit({
            type: "merging",
            downloadId: job.downloadId,
          });
        },

        onComplete: (data) => {
          if (job.status === "paused" || job.status === "cancelled") return;
          job.status = "complete";
          job.progress = 100;
          job.filepath = data.filepath;
          this.pushCompleted(job);
          removeDownloadTempDir(job.tempPath);

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

          finishCurrent();
        },

        onError: (data) => {
          if (job.status === "paused" || job.status === "cancelled") return;
          markDownloadTempComplete(job.tempPath);
          job.status = "error";
          job.error = data.error;
          this.pushCompleted(job);

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

          finishCurrent();
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
      this.pushCompleted(job);
      this.emit({ type: "error", downloadId: job.downloadId, error: err.message });
      finishCurrent();
      return;
    }

    const activeJob = this.activeJobs.get(job.downloadId);
    if (activeJob) {
      activeJob.controller = controller;
    }
  }

  /**
   * Get queue status summary.
   */
  getStatus() {
    const queue = this.queue.map((j) => ({
      downloadId: j.downloadId,
      status: j.status,
      title: j.title,
      thumbnail: j.thumbnail,
      progress: j.progress ?? 0,
    }));

    return {
      active: this.active
        ? {
            downloadId: this.active.downloadId,
            url: this.active.url,
            title: this.active.title,
            thumbnail: this.active.thumbnail,
            status: this.active.status ?? "downloading",
            progress: this.active.progress ?? 0,
            speed: this.active.speed ?? null,
            eta: this.active.eta ?? null,
            filesize: this.active.filesize ?? null,
          }
        : null,
      activeJobs: [...this.activeJobs.values()].map((job) => ({
        downloadId: job.downloadId,
        url: job.url,
        title: job.title,
        thumbnail: job.thumbnail,
        status: job.status ?? "downloading",
        progress: job.progress ?? 0,
        speed: job.speed ?? null,
        eta: job.eta ?? null,
        filesize: job.filesize ?? null,
      })),
      queue,
      queued: queue,
      completed: this.completed.slice(-20).map((h) => ({
        downloadId: h.downloadId,
        url: h.url,
        title: h.title,
        status: h.status,
        progress: h.status === "complete" ? 100 : h.progress ?? 0,
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

