import { useState } from "react";
import { FolderOpen, FileText, Cookie, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import useStore from "@/hooks/useStore";
import EnvironmentPanel from "@/components/EnvironmentPanel";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "general", label: "General" },
  { id: "environment", label: "Environment" },
];

const BROWSERS = [
  { id: "", label: "None (no cookies)" },
  { id: "chrome", label: "Google Chrome" },
  { id: "firefox", label: "Firefox" },
  { id: "edge", label: "Microsoft Edge" },
  { id: "brave", label: "Brave" },
  { id: "opera", label: "Opera" },
  { id: "chromium", label: "Chromium" },
  { id: "vivaldi", label: "Vivaldi" },
];

export default function SettingsPage() {
  const settingsTab = useStore((s) => s.settingsTab);
  const setSettingsTab = useStore((s) => s.setSettingsTab);
  const outputPath = useStore((s) => s.outputPath);
  const setOutputPath = useStore((s) => s.setOutputPath);
  const filenameTemplate = useStore((s) => s.filenameTemplate);
  const setFilenameTemplate = useStore((s) => s.setFilenameTemplate);
  const cookieBrowser = useStore((s) => s.cookieBrowser);
  const setCookieBrowser = useStore((s) => s.setCookieBrowser);
  const showToast = useStore((s) => s.showToast);

  const [cookieExporting, setCookieExporting] = useState(false);
  const [cookieExported, setCookieExported] = useState(false);

  const handleExportCookies = async () => {
    if (!cookieBrowser) return;
    setCookieExporting(true);
    setCookieExported(false);
    try {
      const res = await fetch("/api/cookies/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ browser: cookieBrowser }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCookieExported(true);
        showToast("Cookies exported successfully!", "success");
      } else {
        showToast(
          `Cookie export failed: ${data.error || "unknown error"}. Try closing ${BROWSERS.find((b) => b.id === cookieBrowser)?.label} first.`,
          "error"
        );
      }
    } catch (err) {
      showToast(`Cookie export failed: ${err.message}`, "error");
    } finally {
      setCookieExporting(false);
    }
  };

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
                placeholder="~/Downloads (default)"
                className="sl-input flex-1"
              />
              <button className="sl-btn sl-btn-outline">
                <FolderOpen size={15} />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-text-dim">
              Leave empty to use system Downloads folder
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
            {/* Live preview */}
            <div className="mt-2 p-2.5 bg-surface rounded border border-border">
              <div className="text-xs font-mono text-text-dim">Preview:</div>
              <div className="text-sm font-mono text-text-muted mt-1">
                {filenameTemplate
                  .replace("%(title)s", "Rick Astley - Never Gonna Give You Up")
                  .replace("%(ext)s", "mp4")
                  .replace("%(uploader)s", "Rick Astley")
                  .replace("%(id)s", "dQw4w9WgXcQ")}
              </div>
            </div>
          </div>

          {/* Cookie browser */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary font-serif mb-2">
              <span className="flex items-center gap-2">
                <Cookie size={14} className="text-accent" />
                Browser cookies
              </span>
            </label>
            <div className="flex gap-2">
              <select
                value={cookieBrowser}
                onChange={(e) => {
                  setCookieBrowser(e.target.value);
                  setCookieExported(false);
                }}
                className="sl-input flex-1 cursor-pointer"
              >
                {BROWSERS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              {cookieBrowser && (
                <button
                  onClick={handleExportCookies}
                  disabled={cookieExporting}
                  className="sl-btn sl-btn-outline text-sm whitespace-nowrap"
                >
                  {cookieExporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Exporting...
                    </>
                  ) : cookieExported ? (
                    <>
                      <CheckCircle2 size={14} className="text-status-green" />
                      Exported
                    </>
                  ) : (
                    <>
                      <Cookie size={14} />
                      Export cookies
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-text-dim">
              Required for YouTube and other sites that block bots.
              Select your browser and click <strong>Export cookies</strong> to save them.
            </p>
            {cookieBrowser && !cookieExported && (
              <div className="mt-2 p-2.5 bg-status-orange-bg rounded border border-status-orange/20">
                <div className="text-xs text-status-orange leading-relaxed">
                  <strong>Tip:</strong> If export fails, try closing {BROWSERS.find((b) => b.id === cookieBrowser)?.label} first.
                  Chrome/Edge lock their cookie database while running.
                </div>
              </div>
            )}
            {cookieExported && (
              <div className="mt-2 p-2.5 bg-status-green-bg rounded border border-status-green/20">
                <div className="text-xs text-status-green flex items-center gap-1.5">
                  <CheckCircle2 size={11} />
                  Cookies exported from <strong>{BROWSERS.find((b) => b.id === cookieBrowser)?.label}</strong> — ready to use
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {settingsTab === "environment" && <EnvironmentPanel />}
    </div>
  );
}
