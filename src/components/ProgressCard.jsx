import { FolderOpen, StopCircle, Play, RotateCcw } from "lucide-react";
import useStore from "@/hooks/useStore";
import { formatBytes } from "@/lib/utils";
import DownloadLog from "./DownloadLog";
import SpeedGraph from "./SpeedGraph";
import DownloadStageIndicator from "./DownloadStageIndicator";

export default function ProgressCard() {
  const downloads = useStore((s) => s.downloads);
  const activeDownloadId = useStore((s) => s.activeDownloadId);
  const cancelDownload = useStore((s) => s.cancelDownload);
  const resumeDownload = useStore((s) => s.resumeDownload);
  const retryDownload = useStore((s) => s.retryDownload);

  const download =
    downloads.find((d) => d.id === activeDownloadId) ||
    downloads[downloads.length - 1];

  if (!download) return null;

  const { status, title, progress, speed, eta, filesize, error, thumbnail, filepath } = download;
  const isActive = status === "downloading" || status === "merging" || status === "queued";
  const isComplete = status === "complete";
  const isError = status === "error";
  const isPaused = status === "paused";

  const pct = Math.min(Math.round(progress ?? 0), 100);

  return (
    <div className="sl-card animate-slide-up mt-1 space-y-4">
      {/* Header - thumbnail + title + stage pills */}
      <div className="flex items-start gap-3">
        {thumbnail ? (
          <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-surface border border-border">
            <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded bg-surface border border-border flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="text-sm font-semibold text-text-primary font-serif truncate leading-tight">
            {title}
          </h3>
          <DownloadStageIndicator status={status} />
        </div>
      </div>

      {/* Rich progress bar */}
      {(isActive || isComplete || isPaused) && (
        <div className="space-y-2">
          <div className="sl-progress-rich">
            <div
              className="sl-progress-rich-fill"
              data-state={status}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between gap-3 text-xs font-mono text-text-dim">
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-text-secondary">
                {pct}%
                {filesize ? (
                  <span className="text-text-dim">
                    {" "}of {formatBytes(filesize)}
                  </span>
                ) : null}
              </span>
              {status === "downloading" && speed ? (
                <span className="flex items-center gap-1.5">
                  <SpeedGraph speed={speed} active={status === "downloading"} />
                  <span className="tabular-nums">{"\u2193"} {formatBytes(speed)}/s</span>
                </span>
              ) : null}
            </div>
            {eta && status === "downloading" && (
              <span className="tabular-nums text-text-dim">ETA {eta}</span>
            )}
          </div>
        </div>
      )}

      {/* Error detail */}
      {isError && error && (
        <div className="p-3 bg-status-red-bg rounded border border-status-red/20">
          <p className="text-xs text-status-red/80 font-mono leading-relaxed whitespace-pre-wrap break-words">
            {error}
          </p>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2">
        {isActive && (
          <button
            onClick={() => cancelDownload(download.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border text-text-dim hover:text-status-red hover:border-status-red/30 transition-colors"
          >
            <StopCircle size={12} /> Cancel
          </button>
        )}
        {isPaused && (
          <button
            onClick={() => resumeDownload(download.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border text-accent hover:bg-accent-soft transition-colors"
          >
            <Play size={12} /> Resume
          </button>
        )}
        {isError && (
          <button
            onClick={() => retryDownload?.(download.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border text-accent hover:bg-accent-soft transition-colors"
          >
            <RotateCcw size={12} /> Retry
          </button>
        )}
        {isComplete && filepath && (
          <button
            onClick={() => useStore.getState().openFolder(filepath)}
            className="sl-btn sl-btn-outline text-xs py-1.5 px-3"
          >
            <FolderOpen size={13} /> Open folder
          </button>
        )}
      </div>

      <DownloadLog downloadId={download.id} />
    </div>
  );
}
