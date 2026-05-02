import { useState, useRef, useEffect, useCallback } from "react";
import {
  FolderOpen,
  FileText,
  Cookie,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import useStore from "@/hooks/useStore";
import EnvironmentPanel from "@/components/EnvironmentPanel";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "general", label: "General" },
  { id: "environment", label: "Environment" },
];

const BROWSER_OPTIONS = [
  { id: "chrome", label: "Chrome" },
  { id: "edge", label: "Edge" },
  { id: "brave", label: "Brave" },
  { id: "firefox", label: "Firefox" },
  { id: "opera", label: "Opera" },
  { id: "safari", label: "Safari" },
];

export default function SettingsPage() {
  const settingsTab = useStore((s) => s.settingsTab);
  const setSettingsTab = useStore((s) => s.setSettingsTab);
  const outputPath = useStore((s) => s.outputPath);
  const setOutputPath = useStore((s) => s.setOutputPath);
  const filenameTemplate = useStore((s) => s.filenameTemplate);
  const setFilenameTemplate = useStore((s) => s.setFilenameTemplate);
  const showToast = useStore((s) => s.showToast);

  const [cookieStatus, setCookieStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState("chrome");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch cookie status on mount
  useEffect(() => {
    fetchCookieStatus();
  }, []);

  const fetchCookieStatus = async () => {
    try {
      const res = await fetch("/api/settings/cookies");
      const data = await res.json();
      setCookieStatus(data);
    } catch {
      setCookieStatus(null);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      showToast("Please select a .txt file", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/settings/cookies", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast("cookies.txt uploaded successfully!", "success");
        fetchCookieStatus();
      } else {
        showToast(data.error || "Upload failed", "error");
      }
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/settings/cookies", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("cookies.txt removed", "success");
        setCookieStatus({ exists: false });
      }
    } catch (err) {
      showToast(`Failed to delete: ${err.message}`, "error");
    }
  };

  const handleBrowserImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/settings/cookies/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ browser: selectedBrowser }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Imported cookies from ${selectedBrowser}`, "success");
        fetchCookieStatus();
      } else {
        showToast(data.error || "Cookie import failed", "error");
      }
    } catch (err) {
      showToast(`Cookie import failed: ${err.message}`, "error");
    } finally {
      setImporting(false);
    }
  };

  const handleBrowseFolder = async () => {
    try {
      const tauriOpen = window.__TAURI__?.dialog?.open;
      if (typeof tauriOpen === "function") {
        const selected = await tauriOpen({ directory: true, multiple: false });
        if (typeof selected === "string") setOutputPath(selected);
        return;
      }

      const electronDialog =
        window.electronAPI?.selectFolder ||
        window.electronAPI?.browseFolder ||
        window.streamline?.selectFolder;
      if (typeof electronDialog === "function") {
        const selected = await electronDialog();
        if (typeof selected === "string") setOutputPath(selected);
        return;
      }

      const res = await fetch("/api/settings/browse-folder", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Folder browse is unavailable");
      if (data.path) setOutputPath(data.path);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const previewFilename = filenameTemplate
    .replaceAll("%(title)s", "Rick Astley - Never Gonna Give You Up")
    .replaceAll("%(ext)s", "mp4")
    .replaceAll("%(uploader)s", "Rick Astley")
    .replaceAll("%(id)s", "dQw4w9WgXcQ")
    .replaceAll("%(playlist_index)s", "001")
    .replaceAll("%(upload_date)s", "20091025");

  // Drag & Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file);
  }, []);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl text-accent">⚙</span>
          <h1 className="text-2xl font-bold text-text-primary font-serif tracking-tight">
            Settings
          </h1>
        </div>
        <div className="h-px bg-border" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`settings-tab-${tab.id}`}
            onClick={() => setSettingsTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              settingsTab === tab.id
                ? "text-text-primary"
                : "text-text-dim hover:text-text-muted"
            )}
          >
            {tab.label}
            {settingsTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {settingsTab === "general" && (
        <div className="animate-fade-in space-y-6">
          {/* Output path */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary font-serif mb-2">
              Output folder
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                placeholder="~/Downloads/Streamline (default)"
                className="sl-input flex-1"
              />
              <button type="button" onClick={handleBrowseFolder} className="sl-btn sl-btn-outline">
                <FolderOpen size={15} />
              </button>
            </div>
            {!outputPath && (
              <p className="mt-1.5 text-xs text-text-dim font-mono">
                {"\u2192"} Saving to: <span className="text-text-muted">~/Downloads/Streamline</span>
              </p>
            )}
            <p className="mt-1.5 text-xs text-text-dim">
              Leave empty to use Streamline's default Downloads folder
            </p>
          </div>

          {/* Filename template */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary font-serif mb-2">
              Filename template
            </label>
            <input
              type="text"
              value={filenameTemplate}
              onChange={(e) => setFilenameTemplate(e.target.value)}
              className="sl-input font-mono text-sm"
            />
            <p className="mt-1.5 text-xs text-text-dim">
              Uses yt-dlp output template syntax.{" "}
              <code className="sl-code text-2xs">%(title)s</code>,{" "}
              <code className="sl-code text-2xs">%(ext)s</code>,{" "}
              <code className="sl-code text-2xs">%(uploader)s</code>, etc.
            </p>
            <div className="mt-2 p-2.5 bg-surface rounded border border-border">
              <div className="text-xs font-mono text-text-dim">Preview:</div>
              <div className="text-sm font-mono text-text-muted mt-1">
                {previewFilename}
              </div>
            </div>
          </div>

          {/* ─── Cookie Authentication Section ─────────────────────── */}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-text-secondary font-serif mb-3">
              <span className="flex items-center gap-2">
                <Cookie size={14} className="text-accent" />
                Cookie authentication
              </span>
            </label>

            {/* Instructions */}
            <div className="p-4 bg-surface rounded-lg border border-border space-y-3 mb-4">
              <p className="text-sm text-text-muted leading-relaxed">
                To download authenticated or age-restricted content, you must provide a{" "}
                <code className="sl-code text-2xs">cookies.txt</code> file.
              </p>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-text-dim mt-0.5 font-mono shrink-0">Chrome/Edge</span>
                  <p className="text-sm text-text-muted">
                    Install the{" "}
                    <a
                      href="https://chromewebstore.google.com/detail/cclelndahbckbenkjhflpdbgdldlbecc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      Get cookies.txt LOCALLY
                      <ExternalLink size={10} />
                    </a>{" "}
                    extension.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-text-dim mt-0.5 font-mono shrink-0">Firefox</span>
                  <p className="text-sm text-text-muted">
                    Install the{" "}
                    <a
                      href="https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      cookies.txt
                      <ExternalLink size={10} />
                    </a>{" "}
                    extension.
                  </p>
                </div>
              </div>

              <p className="text-xs text-text-dim leading-relaxed">
                After installing, visit the website you want to download from, log in, then export cookies for that site.
                For YouTube bot/sign-in errors, use a private/incognito YouTube session, open{" "}
                <code className="sl-code text-2xs">youtube.com/robots.txt</code>, export only YouTube cookies, then upload that file here.
              </p>
            </div>

            {/* Security Warning */}
            <div className="p-3.5 bg-status-red/5 rounded-lg border border-status-red/20 mb-4">
              <div className="flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-status-red shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-status-red mb-1">Security warning</p>
                  <p className="text-xs text-status-red/80 leading-relaxed">
                    If you have previously installed an extension called exactly{" "}
                    <strong>"Get cookies.txt"</strong> (without the word "LOCALLY"),
                    uninstall it immediately. It has been reported as malware and removed from the Chrome Web Store.
                  </p>
                </div>
              </div>
            </div>

            {/* Browser import */}
            <div className="p-4 bg-surface rounded-lg border border-border mb-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-text-secondary">
                    Import from browser
                  </p>
                  <p className="text-xs text-text-dim mt-1">
                    Streamline asks yt-dlp to export regular browser cookies into a local cookies.txt file.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedBrowser}
                  onChange={(e) => setSelectedBrowser(e.target.value)}
                  className="sl-input flex-1"
                  disabled={importing}
                >
                  {BROWSER_OPTIONS.map((browser) => (
                    <option key={browser.id} value={browser.id}>
                      {browser.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBrowserImport}
                  disabled={importing}
                  className="sl-btn sl-btn-primary min-w-[120px]"
                >
                  {importing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Importing
                    </>
                  ) : (
                    <>
                      <Cookie size={15} />
                      Import
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-text-dim mt-2 leading-relaxed">
                If import fails on Windows, close the selected browser and try again. For YouTube, uploading extension-exported cookies is more reliable.
              </p>
            </div>

            {/* Current status */}
            {cookieStatus?.exists && (
              <div className="p-3 bg-status-green-bg rounded-lg border border-status-green/20 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-status-green" />
                  <span className="text-sm text-status-green">
                    cookies.txt active
                  </span>
                  {cookieStatus.uploadedAt && (
                    <span className="text-xs text-text-dim">
                      · uploaded {new Date(cookieStatus.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded text-text-dim hover:text-status-red hover:bg-status-red/10 transition-colors"
                  title="Remove cookies.txt"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Upload zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
                dragging
                  ? "border-accent bg-accent/5 scale-[1.01]"
                  : "border-border hover:border-border-accent hover:bg-surface-hover",
                uploading && "opacity-60 pointer-events-none"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                className="hidden"
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={28} className="animate-spin text-accent" />
                  <span className="text-sm text-text-muted">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    dragging ? "bg-accent/10" : "bg-surface"
                  )}>
                    <Upload size={20} className={dragging ? "text-accent" : "text-text-dim"} />
                  </div>
                  <div>
                    <p className="text-sm text-text-muted font-medium">
                      {cookieStatus?.exists ? "Replace" : "Upload"} cookies.txt
                    </p>
                    <p className="text-xs text-text-dim mt-1">
                      Drag & drop or click to browse
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {settingsTab === "environment" && <EnvironmentPanel />}
    </div>
  );
}
