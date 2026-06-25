import { useEffect, useMemo, useRef } from "react";
import { Activity, CheckCircle2, ChevronLeft, ChevronRight, Clipboard, Loader2, Merge, Terminal, Trash2, XCircle } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  queued: { label: "Queued", icon: Loader2, color: "text-text-dim" },
  downloading: { label: "Downloading", icon: Loader2, color: "text-accent", spin: true },
  merging: { label: "Merging", icon: Merge, color: "text-status-orange" },
  complete: { label: "Complete", icon: CheckCircle2, color: "text-status-green" },
  error: { label: "Error", icon: XCircle, color: "text-status-red" },
};

export default function LiveLogs() {
  const collapsed = useStore((s) => s.logsCollapsed);
  const setCollapsed = useStore((s) => s.setLogsCollapsed);
  
  const logRef = useRef(null);
  const downloads = useStore((s) => s.downloads);
  const activeDownloadId = useStore((s) => s.activeDownloadId);
  const showToast = useStore((s) => s.showToast);
  const clearLogs = useStore((s) => s.clearLogs);

  const activeDownload =
    downloads.find((download) => download.id === activeDownloadId) ||
    downloads.find((download) => download.status === "downloading" || download.status === "merging") ||
    downloads[downloads.length - 1] ||
    null;

  const logEntries = useMemo(() => {
    if (!activeDownload) return [];
    return (activeDownload.log || []).map((line, index) => ({
      id: `${activeDownload.id}-${index}`,
      downloadId: activeDownload.id,
      title: activeDownload.title,
      status: activeDownload.status,
      line,
    }));
  }, [activeDownload?.id, activeDownload?.log, activeDownload?.status, activeDownload?.title]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries.length]);

  const activeConfig = STATUS_CONFIG[activeDownload?.status] || STATUS_CONFIG.queued;
  const ActiveIcon = activeConfig.icon;
  const activeLogs = activeDownload?.log || [];

  const getLogLineColor = (line) => {
    if (/ERROR/i.test(line)) return "text-status-red";
    if (/\[(Merger|ffmpeg)\]/i.test(line)) return "text-status-orange";
    if (/\[download\]/i.test(line)) return "text-status-green/70";
    return "text-text-dim";
  };

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(activeLogs.join("\n"));
      showToast("Logs copied", "success");
    } catch {
      showToast("Unable to copy logs", "error");
    }
  };

  const clearActiveLogs = () => {
    if (!activeDownload || activeLogs.length === 0) return;
    clearLogs(activeDownload.id);
    showToast("Logs cleared", "info");
  };

  if (collapsed) {
    return (
      <aside className="xl:h-screen xl:sticky xl:top-0">
        <button
          onClick={() => setCollapsed(false)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-md border border-border bg-log px-4 py-3 text-left transition-all hover:border-border-accent hover:bg-surface-hover",
            "xl:h-full xl:w-14 xl:flex-col xl:justify-start xl:items-center xl:py-6 xl:px-0 xl:rounded-none xl:border-y-0 xl:border-r-0"
          )}
          aria-label="Expand live logs"
          title="Expand live logs"
        >
          <div className="flex xl:flex-col min-w-0 items-center gap-2 xl:gap-6">
            <Terminal size={15} className="text-accent shrink-0 animate-pulse" />
            <div className="min-w-0 xl:hidden">
              <h2 className="text-sm font-semibold text-text-primary font-serif">
                Live logs
              </h2>
              <p className="truncate text-xs font-mono text-text-dim">
                {logEntries.length > 0 ? `${logEntries.length} recent lines` : "Collapsed"}
              </p>
            </div>
            
            <div className="hidden xl:flex xl:flex-col xl:items-center gap-1 select-none">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono [writing-mode:vertical-lr] opacity-70">
                Live Logs
              </span>
              {logEntries.length > 0 && (
                <span className="text-[9px] font-mono text-accent bg-accent-soft px-1 py-0.5 rounded-sm mt-3 animate-pulse">
                  {logEntries.length}
                </span>
              )}
            </div>
          </div>
          <div className="xl:mt-auto">
            <ChevronLeft size={16} className="text-text-dim shrink-0 xl:rotate-180" />
          </div>
        </button>
      </aside>
    );
  }

  return (
    <aside className="xl:h-screen xl:sticky xl:top-0">
      <div className="rounded-md border border-border bg-log overflow-hidden xl:h-full xl:flex xl:flex-col xl:rounded-none xl:border-y-0 xl:border-r-0">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal size={15} className="text-accent shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text-primary font-serif">
                Live logs
              </h2>
              <p className="text-xs text-text-dim font-mono truncate">
                {logEntries.length > 0 ? `${logEntries.length} lines` : "Waiting for output"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {downloads.length > 1 && (
              <select
                className="max-w-[120px] rounded border border-border bg-transparent px-1 py-0.5 text-xs font-mono text-text-dim transition-colors hover:border-border-accent focus:outline-none"
                value={activeDownload?.id || ""}
                onChange={(event) => useStore.setState({ activeDownloadId: event.target.value })}
                title="Select log source"
              >
                {downloads.map((download) => (
                  <option key={download.id} value={download.id} className="bg-surface text-text-primary">
                    {download.title?.slice(0, 30) || "Untitled"}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded text-text-dim hover:text-text-secondary hover:bg-surface-hover transition-colors"
              aria-label="Collapse live logs"
              title="Collapse live logs"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border bg-surface/50 px-4 py-2 text-xs font-mono shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={copyLogs}
              disabled={activeLogs.length === 0}
              className="flex items-center gap-1 rounded border border-border px-2 py-1 text-text-dim hover:border-border-accent hover:text-accent transition-all disabled:opacity-40"
              title="Copy logs"
            >
              <Clipboard size={11} />
              Copy
            </button>
            <button
              onClick={clearActiveLogs}
              disabled={activeLogs.length === 0}
              className="flex items-center gap-1 rounded border border-border px-2 py-1 text-text-dim hover:border-status-red/40 hover:text-status-red transition-all disabled:opacity-40"
              title="Clear logs"
            >
              <Trash2 size={11} />
              Clear
            </button>
          </div>
          {activeDownload && (
            <div className={cn("flex items-center gap-1.5 font-sans font-medium", activeConfig.color)}>
              <ActiveIcon size={12} className={cn(activeConfig.spin && "animate-spin")} />
              {activeConfig.label}
            </div>
          )}
        </div>

        {/* Active item banner */}
        {activeDownload && (
          <div className="border-b border-border bg-surface px-4 py-2.5 shrink-0">
            <div className="flex items-start gap-2">
              <Activity size={14} className="text-text-dim mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider">
                  Current item
                </div>
                <div className="text-xs text-text-secondary truncate font-medium">
                  {activeDownload.title}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Console logs output */}
        <div
          ref={logRef}
          className="sl-terminal overflow-auto bg-log px-4 py-3 font-mono text-xs text-text-dim flex-1 h-[420px] xl:h-auto"
        >
          {logEntries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <Terminal size={24} className="mx-auto mb-3 text-text-dim/60" />
                <p className="text-sm text-text-muted">No logs yet</p>
                <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-text-dim">
                  Start a download and raw yt-dlp output will stream here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {logEntries.map((entry) => (
                <div key={entry.id} className="group">
                  <div className="mb-0.5 flex items-center gap-2 text-[10px] uppercase tracking-wide text-text-dim/70">
                    <span className={cn("h-1.5 w-1.5 rounded-full", entry.status === "error" ? "bg-status-red" : entry.status === "complete" ? "bg-status-green" : "bg-accent")} />
                    <span className="truncate">{entry.title}</span>
                  </div>
                  <div className={cn("whitespace-pre-wrap break-words leading-relaxed group-hover:text-text-secondary", getLogLineColor(entry.line))}>
                    {entry.line}
                  </div>
                </div>
              ))}
              {activeDownload && ["downloading", "merging", "queued"].includes(activeDownload.status) && (
                <div className="sl-terminal-cursor" aria-hidden="true" />
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
