import { create } from "zustand";
import { uid } from "@/lib/utils";

/**
 * Global application store using Zustand.
 * Organized into logical slices: ui, media, downloads, environment.
 */
const useStore = create((set, get) => ({
  // ─── UI State ─────────────────────────────────────────────
  activePage: "download", // "download" | "settings"
  settingsTab: "general", // "general" | "environment"
  sidebarCollapsed: false,

  setActivePage: (page) => set({ activePage: page }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),

  // ─── Media Preview ────────────────────────────────────────
  mediaUrl: "",
  mediaInfo: null, // { title, thumbnail, duration, uploader, upload_date, formats, ... }
  mediaLoading: false,
  mediaError: null,

  setMediaUrl: (url) => set({ mediaUrl: url }),

  fetchMediaInfo: async (url) => {
    set({ mediaLoading: true, mediaError: null, mediaInfo: null });
    try {
      const res = await fetch(`/api/formats?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to fetch media info" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      set({ mediaInfo: data, mediaLoading: false, mediaUrl: url });
    } catch (err) {
      set({ mediaError: err.message, mediaLoading: false });
    }
  },

  clearMedia: () =>
    set({ mediaUrl: "", mediaInfo: null, mediaLoading: false, mediaError: null }),

  // ─── Selected Format ──────────────────────────────────────
  selectedFormatId: null, // will default to "best" or a specific format_id
  selectedPreset: "best", // "best" | "1080p" | "720p" | "audio"

  setSelectedFormatId: (id) => set({ selectedFormatId: id, selectedPreset: null }),
  setSelectedPreset: (preset) => set({ selectedPreset: preset, selectedFormatId: null }),

  // ─── Downloads ────────────────────────────────────────────
  /**
   * Each download: { id, url, title, thumbnail, status, progress, speed, eta, filesize, filepath, log[], error }
   * status: "queued" | "downloading" | "merging" | "complete" | "error"
   */
  downloads: [],
  activeDownloadId: null,

  startDownload: async () => {
    const { mediaInfo, mediaUrl, selectedFormatId, selectedPreset } = get();
    if (!mediaInfo) return;

    const id = uid();
    const download = {
      id,
      url: mediaUrl,
      title: mediaInfo.title || "Untitled",
      thumbnail: mediaInfo.thumbnail || null,
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

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mediaUrl,
          formatId: selectedFormatId,
          preset: selectedPreset,
          downloadId: id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download request failed" }));
        get().updateDownload(id, { status: "error", error: err.error });
      }
    } catch (err) {
      get().updateDownload(id, { status: "error", error: err.message });
    }
  },

  updateDownload: (id, updates) =>
    set((s) => ({
      downloads: s.downloads.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),

  appendLog: (id, line) =>
    set((s) => ({
      downloads: s.downloads.map((d) =>
        d.id === id ? { ...d, log: [...d.log, line] } : d
      ),
    })),

  // ─── Environment ──────────────────────────────────────────
  env: null, // { python: { ok, version, path }, ytdlp: {...}, ffmpeg: {...} }
  envLoading: false,
  envRepairing: false,

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
    set({ envRepairing: true });
    try {
      await fetch("/api/env/repair", { method: "POST" });
    } catch {
      // repair progress comes via WebSocket
    }
    set({ envRepairing: false });
  },

  // ─── Settings ─────────────────────────────────────────────
  outputPath: "",
  filenameTemplate: "%(title)s.%(ext)s",

  setOutputPath: (path) => set({ outputPath: path }),
  setFilenameTemplate: (tpl) => set({ filenameTemplate: tpl }),
}));

export default useStore;
