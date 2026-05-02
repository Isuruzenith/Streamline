import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Merge, Terminal, XCircle } from "lucide-react";
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
  const [collapsed, setCollapsed] = useState(false);
  const logRef = useRef(null);
  const downloads = useStore((s) => s.downloads);
  const activeDownloadId = useStore((s) => s.activeDownloadId);

  const activeDownload =
    downloads.find((download) => download.id === activeDownloadId) ||
    downloads.find((download) => download.status === "downloading" || download.status === "merging") ||
    downloads[downloads.length - 1] ||
    null;

  const logEntries = useMemo(() => {
    return downloads
      .flatMap((download) =>
        (download.log || []).map((line, index) => ({
          id: `${download.id}-${index}`,
          downloadId: download.id,
          title: download.title,
          status: download.status,
          line,
        }))
      )
      .slice(-500);
  }, [downloads]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries.length]);

  const activeConfig = STATUS_CONFIG[activeDownload?.status] || STATUS_CONFIG.queued;
  const ActiveIcon = activeConfig.icon;

  if (collapsed) {
    return (
      <aside className="lg:sticky lg:top-10">
        <button
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-[#101010] px-4 py-3 text-left transition-colors hover:border-border-accent hover:bg-surface-hover xl:min-h-[64px]"
          aria-label="Expand live logs"
          title="Expand live logs"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Terminal size={15} className="text-accent shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text-primary font-serif">
                Live logs
              </h2>
              <p className="truncate text-xs font-mono text-text-dim">
                {logEntries.length > 0 ? `${logEntries.length} recent lines` : "Collapsed"}
              </p>
            </div>
          </div>
          <ChevronLeft size={16} className="text-text-dim shrink-0" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="lg:sticky lg:top-10">
      <div className="rounded-md border border-border bg-[#101010] overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal size={15} className="text-accent shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-text-primary font-serif">
                Live logs
              </h2>
              <p className="text-xs text-text-dim font-mono truncate">
                {logEntries.length > 0 ? `${logEntries.length} recent lines` : "Waiting for yt-dlp output"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeDownload && (
              <div className={cn("hidden sm:flex items-center gap-1.5 text-xs font-mono", activeConfig.color)}>
                <ActiveIcon size={13} className={cn(activeConfig.spin && "animate-spin")} />
                {activeConfig.label}
              </div>
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

        {activeDownload && (
          <div className="border-b border-border bg-surface px-4 py-3">
            <div className="flex items-start gap-2">
              <Activity size={14} className="text-text-dim mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-mono text-text-dim mb-1">
                  Current item
                </div>
                <div className="text-sm text-text-secondary truncate">
                  {activeDownload.title}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          ref={logRef}
          className="h-[420px] lg:h-[calc(100vh-240px)] min-h-[320px] overflow-auto bg-[#0b0b0b] px-4 py-3 font-mono text-xs text-text-dim"
        >
          {logEntries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <Terminal size={24} className="mx-auto mb-3 text-text-dim/60" />
                <p className="text-sm text-text-muted">No logs yet</p>
                <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-text-dim">
                  Start a download and raw yt-dlp output will stream here in real time.
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
                  <div className="whitespace-pre-wrap break-words leading-relaxed text-text-muted group-hover:text-text-secondary">
                    {entry.line}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
