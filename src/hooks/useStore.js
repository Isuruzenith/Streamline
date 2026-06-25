import { create } from "zustand";
import { uid } from "@/lib/utils";

const SETTINGS_STORAGE_KEY = "streamline:settings";
const THEME_STORAGE_KEY = "streamline:theme";
const DEFAULT_DOWNLOAD_OPTIONS = {
  videoFormat: "mp4",
  audioFormat: "mp3",
  audioQuality: "0",
  writeSubtitles: false,
  writeAutoSubtitles: false,
  subtitleLanguages: "en.*",
  subtitleFormat: "srt",
  writeThumbnail: false,
  embedMetadata: false,
  chaptersMode: "embed",
  sponsorBlock: false,
  downloadArchive: false,
  rateLimit: "",
  concurrentFragments: 8,
  customFlags: "",
  concurrencyLimit: 1,
  trimVideo: false,
  trimStart: "",
  trimEnd: "",
};

const UNCHECKED_DOWNLOAD_OPTIONS = {
  writeSubtitles: false,
  writeAutoSubtitles: false,
  writeThumbnail: false,
  embedMetadata: false,
  sponsorBlock: false,
  downloadArchive: false,
  trimVideo: false,
};

function readPersistedSettings() {
  if (typeof localStorage === "undefined") return {};

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistSettings(settings) {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      outputPath: settings.outputPath,
      filenameTemplate: settings.filenameTemplate,
      downloadOptions: settings.downloadOptions,
    }));
  } catch {
    // Storage can fail in private mode or when quota is exceeded.
  }
}

const persistedSettings = readPersistedSettings();
const initialTheme =
  typeof localStorage !== "undefined"
    ? localStorage.getItem(THEME_STORAGE_KEY) || "dark"
    : "dark";
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", initialTheme);
}
const initialSettings = {
  outputPath: persistedSettings.outputPath || "",
  filenameTemplate: persistedSettings.filenameTemplate || "%(title)s.%(ext)s",
  downloadOptions: {
    ...DEFAULT_DOWNLOAD_OPTIONS,
    ...(persistedSettings.downloadOptions && typeof persistedSettings.downloadOptions === "object"
      ? persistedSettings.downloadOptions
      : {}),
    ...UNCHECKED_DOWNLOAD_OPTIONS,
  },
};

function normalizeDownloadUpdates(download, updates) {
  if (!Object.prototype.hasOwnProperty.call(updates, "progress")) {
    return updates;
  }

  const nextProgress = Number(updates.progress);
  if (!Number.isFinite(nextProgress)) {
    const { progress, ...rest } = updates;
    return rest;
  }

  const currentStatus = download.status;
  const nextStatus = updates.status || currentStatus;
  const isLiveUpdate =
    (currentStatus === "downloading" || currentStatus === "merging") &&
    (nextStatus === "downloading" || nextStatus === "merging");

  return {
    ...updates,
    progress: isLiveUpdate
      ? Math.max(Number(download.progress) || 0, nextProgress)
      : nextProgress,
  };
}

/**
 * Global application store using Zustand.
 * Organized into logical slices: ui, media, downloads, environment, toast, history.
 */
const useStore = create((set, get) => ({
  // ─── UI State ─────────────────────────────────────────────
  activePage: "download", // "download" | "settings" | "history"
  settingsTab: "general", // "general" | "environment"
  sidebarCollapsed: false,
  batchMode: false,
  logsCollapsed: false,
  theme: initialTheme,

  setActivePage: (page) => set({ activePage: page }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setBatchMode: (batchMode) => set({ batchMode }),
  toggleBatchMode: () => set((s) => ({ batchMode: !s.batchMode })),
  setLogsCollapsed: (collapsed) => set({ logsCollapsed: collapsed }),
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  // ─── Toast ────────────────────────────────────────────────
  toast: null, // { id, message, type: "success"|"error"|"info", visible }

  showToast: (message, type = "info") => {
    const id = uid();
    set({ toast: { id, message, type, visible: true } });
    // Auto-dismiss after 5s
    setTimeout(() => {
      const current = get().toast;
      if (current?.id === id) {
        set({ toast: null });
      }
    }, 5000);
  },

  dismissToast: () => set({ toast: null }),

  // ─── Media Preview ────────────────────────────────────────
  mediaUrl: "",
  mediaInfo: null, // { title, thumbnail, duration, uploader, upload_date, formats, is_playlist, ... }
  mediaLoading: false,
  mediaError: null,

  setMediaUrl: (url) => set({ mediaUrl: url }),

  fetchMediaInfo: async (url) => {
    set({ mediaLoading: true, mediaError: null, mediaInfo: null, selectedFormatId: null, selectedPreset: null });
    try {
      const res = await fetch(`/api/formats?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to fetch media info" }));
        const message = err.error || `HTTP ${res.status}`;
        const detail = err.detail ? ` — ${err.detail}` : "";
        throw new Error(message + detail);
      }
      const data = await res.json();
      const mediaInfo = data?.is_playlist
        ? data
        : {
            ...data,
            filesize_approx: data?.filesize_approx ?? data?.filesize ?? null,
          };
      const playlistSelected = data?.is_playlist && Array.isArray(data.entries)
        ? new Set(data.entries.map((_, index) => index))
        : new Set();
      set({ mediaInfo, mediaLoading: false, mediaUrl: url, playlistSelected });
    } catch (err) {
      set({ mediaError: err.message, mediaLoading: false });
    }
  },

  clearMedia: () =>
    set({ mediaUrl: "", mediaInfo: null, mediaLoading: false, mediaError: null, selectedFormatId: null, selectedPreset: null }),

  // ─── Selected Format ──────────────────────────────────────
  selectedFormatId: null, // specific format selected from the advanced list
  selectedPreset: null, // "best-mp4" | "best" | "1080p" | "720p" | "audio"

  setSelectedFormatId: (id) => set({ selectedFormatId: id, selectedPreset: null }),
  setSelectedPreset: (preset) => set({ selectedPreset: preset, selectedFormatId: null }),

  // ─── Downloads ────────────────────────────────────────────
  /**
   * Each download: { id, url, title, thumbnail, status, progress, speed, eta, filesize, filepath, log[], error }
   * status: "queued" | "downloading" | "merging" | "paused" | "complete" | "error"
   */
  downloads: [],
  pausedDownloads: [],
  activeDownloadId: null,

  addDownload: (download) =>
    set((s) => ({
      downloads: [...s.downloads, { ...download, status: download.status || "queued" }],
      activeDownloadId: download.id ?? s.activeDownloadId,
    })),

  startDownload: async (overrideUrl, overrideTitle, overrideThumbnail, downloadConfig = {}) => {
    const {
      mediaInfo,
      mediaUrl,
      selectedFormatId,
      selectedPreset,
      outputPath,
      filenameTemplate,
      downloadOptions,
    } = get();

    const url = overrideUrl || mediaUrl;
    const title = overrideTitle || mediaInfo?.title || "Untitled";
    const thumbnail = overrideThumbnail || mediaInfo?.thumbnail || null;

    if (!url) return;
    if (!overrideUrl && !selectedFormatId && !selectedPreset) {
      get().showToast("Choose a format before downloading", "error");
      return;
    }

    const id = uid();
    const download = {
      id,
      url,
      title,
      thumbnail,
      status: "queued",
      progress: 0,
      speed: null,
      eta: null,
      filesize: null,
      filepath: null,
      log: [],
      error: null,
    };

    set((s) => ({ downloads: [...s.downloads, download], activeDownloadId: id }));

    const selectedFormat = selectedFormatId
      ? mediaInfo?.formats?.find(f => f.format_id === selectedFormatId)
      : null;
    const formatType = selectedFormat
      ? (selectedFormat.vcodec !== "none" && selectedFormat.acodec === "none" ? "video"
         : selectedFormat.vcodec === "none" ? "audio"
         : "av")
      : null;

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          formatId: overrideUrl ? null : selectedFormatId,
          formatType: overrideUrl ? null : formatType,
          preset: overrideUrl ? (downloadConfig.preset || "best-mp4") : selectedPreset,
          downloadId: id,
          title,
          thumbnail,
          outputPath: outputPath || null,
          filenameTemplate: filenameTemplate || null,
          options: downloadOptions,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download request failed" }));
        get().updateDownload(id, { status: "error", error: err.error });
      } else {
        get().clearMedia();
      }
    } catch (err) {
      get().updateDownload(id, { status: "error", error: err.message });
    }
  },

  startBatchDownload: async (urls) => {
    const { startDownload } = get();
    for (const url of urls) {
      await startDownload(url, null, null);
    }
  },

  updateDownload: (id, updates) =>
    set((s) => ({
      downloads: s.downloads.map((d) =>
        d.id === id ? { ...d, ...normalizeDownloadUpdates(d, updates) } : d
      ),
    })),

  appendLog: (id, line) =>
    set((s) => ({
      downloads: s.downloads.map((d) =>
        d.id === id ? { ...d, log: [...d.log, line].slice(-500) } : d
      ),
    })),

  clearLogs: (id) =>
    set((s) => ({
      downloads: s.downloads.map((d) =>
        !id || d.id === id ? { ...d, log: [] } : d
      ),
    })),

  removeDownload: async (id) => {
    set((s) => ({
      downloads: s.downloads.filter((d) => d.id !== id),
    }));

    // Remove from backend queue
    try {
      await fetch(`/api/download/${id}`, { method: "DELETE" });
    } catch { /* ignore */ }
  },

  cancelDownload: async (id) => {
    try {
      await fetch(`/api/download/${id}`, { method: "DELETE" });
    } catch { /* ignore */ }
  },

  retryDownload: (id) => {
    const dl = get().downloads.find((d) => d.id === id);
    if (!dl) return;

    set((s) => ({
      downloads: s.downloads.map((d) =>
        d.id === id ? { ...d, status: "queued", progress: 0, error: null, log: [] } : d
      ),
      activeDownloadId: id,
    }));

    fetch("/api/download/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {
      get().showToast("Retry failed - check server logs", "error");
    });
  },

  resumeDownload: async (id) => {
    try {
      const res = await fetch(`/api/download/resume/${id}`, { method: "POST" });
      if (res.ok) {
        set((s) => ({
          pausedDownloads: s.pausedDownloads.filter((d) => d.downloadId !== id),
          downloads: s.downloads.map((d) =>
            d.id === id ? { ...d, status: "queued", progress: 0, error: null } : d
          ),
          activeDownloadId: id,
        }));
      }
    } catch { /* ignore */ }
  },

  reorderDownloads: async (fromIndex, toIndex) => {
    const downloadId = get().downloads[fromIndex]?.id;
    set((s) => {
      const downloads = [...s.downloads];
      const [item] = downloads.splice(fromIndex, 1);
      downloads.splice(toIndex, 0, item);
      return { downloads };
    });
    if (downloadId) {
      const queuedIndex = get()
        .downloads
        .filter((download) => download.status === "queued")
        .findIndex((download) => download.id === downloadId);
      try {
        await fetch("/api/download/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ downloadId, newIndex: queuedIndex }),
        });
      } catch { /* local order already updated */ }
    }
  },

  // ─── Playlist Selection ───────────────────────────────────
  playlistSelected: new Set(), // set of entry indices

  togglePlaylistEntry: (index) =>
    set((s) => {
      const next = new Set(s.playlistSelected);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return { playlistSelected: next };
    }),

  selectAllPlaylist: () =>
    set((s) => {
      if (!s.mediaInfo?.entries) return {};
      const all = new Set(s.mediaInfo.entries.map((_, i) => i));
      return { playlistSelected: all };
    }),

  deselectAllPlaylist: () => set({ playlistSelected: new Set() }),

  invertPlaylistSelection: () =>
    set((s) => {
      if (!s.mediaInfo?.entries) return {};
      const next = new Set();
      s.mediaInfo.entries.forEach((_, index) => {
        if (!s.playlistSelected.has(index)) next.add(index);
      });
      return { playlistSelected: next };
    }),

  selectPlaylistRange: (start, end) =>
    set((s) => {
      if (!s.mediaInfo?.entries) return {};
      const max = s.mediaInfo.entries.length - 1;
      const from = Math.max(0, Math.min(Number(start) - 1, max));
      const to = Math.max(0, Math.min(Number(end) - 1, max));
      const low = Math.min(from, to);
      const high = Math.max(from, to);
      const next = new Set();
      for (let index = low; index <= high; index += 1) {
        next.add(index);
      }
      return { playlistSelected: next };
    }),

  downloadSelectedPlaylistItems: async () => {
    const { mediaInfo, playlistSelected, selectedPreset, startDownload, showToast } = get();
    if (!mediaInfo?.entries) return;
    if (!selectedPreset) {
      showToast("Choose a quality before downloading", "error");
      return;
    }

    const selected = [...playlistSelected].sort((a, b) => a - b);
    for (const idx of selected) {
      const entry = mediaInfo.entries[idx];
      if (entry?.url) {
        await startDownload(entry.url, entry.title, entry.thumbnail, {
          preset: selectedPreset,
        });
      }
    }
  },

  // ─── Environment ──────────────────────────────────────────
  env: null, // { python: { ok, version, path }, ytdlp: {...}, ffmpeg: {...} }
  envLoading: false,
  envRepairing: false,
  provisionLog: [],

  fetchEnv: async () => {
    set({ envLoading: true });
    try {
      const res = await fetch("/api/env");
      if (res.ok) {
        const data = await res.json();
        set({ env: data, envLoading: false });
      }
    } catch {
      set({ envLoading: false });
    }
  },

  repairEnv: async () => {
    set({ envRepairing: true, provisionLog: [] });
    try {
      const res = await fetch("/api/env/repair", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Repair failed to start" }));
        throw new Error(err.error || "Repair failed to start");
      }
    } catch {
      set({ envRepairing: false });
    }
  },

  appendProvisionLog: (line) =>
    set((s) => ({ provisionLog: [...s.provisionLog, line] })),
  clearProvisionLog: () => set({ provisionLog: [] }),

  // ─── History ──────────────────────────────────────────────
  history: [],
  historyLoading: false,

  fetchHistory: async () => {
    set({ historyLoading: true });
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        set({ history: data, historyLoading: false });
      }
    } catch {
      set({ historyLoading: false });
    }
  },

  clearHistory: async () => {
    try {
      await fetch("/api/history", { method: "DELETE" });
      set({ history: [] });
    } catch { /* ignore */ }
  },

  removeHistoryItem: async (id) => {
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      set((s) => ({
        history: s.history.filter((h) => h.id !== id),
      }));
    } catch { /* ignore */ }
  },

  openFolder: async (filepath) => {
    try {
      await fetch("/api/download/open-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath }),
      });
    } catch { /* ignore */ }
  },

  // ─── Settings ─────────────────────────────────────────────
  outputPath: initialSettings.outputPath,
  filenameTemplate: initialSettings.filenameTemplate,
  downloadOptions: initialSettings.downloadOptions,

  setOutputPath: (path) =>
    set((s) => {
      const next = { ...s, outputPath: path };
      persistSettings(next);
      return { outputPath: path };
    }),
  setFilenameTemplate: (tpl) =>
    set((s) => {
      const next = { ...s, filenameTemplate: tpl };
      persistSettings(next);
      return { filenameTemplate: tpl };
    }),
  setDownloadOption: (key, value) =>
    set((s) => {
      const downloadOptions = { ...s.downloadOptions, [key]: value };
      persistSettings({ ...s, downloadOptions });
      return { downloadOptions };
    }),
}));

export default useStore;
