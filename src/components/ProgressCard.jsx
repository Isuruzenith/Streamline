import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Merge,
  Play,
  StopCircle,
} from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn, formatBytes } from "@/lib/utils";
import DownloadLog from "./DownloadLog";

// Note: This component is kept for backward compat but QueuePanel is now preferred.

export default function ProgressCard() {
  const downloads = useStore((s) => s.downloads);
  const activeDownloadId = useStore((s) => s.activeDownloadId);
  const cancelDownload = useStore((s) => s.cancelDownload);
  const resumeDownload = useStore((s) => s.resumeDownload);

  // Show the active download, or the most recent one
  const download =
    downloads.find((d) => d.id === activeDownloadId) ||
    downloads[downloads.length - 1];

  if (!download) return null;

  const { status, title, progress, speed, eta, filesize, error, thumbnail } = download;
  const isActive = status === "downloading" || status === "merging" || status === "queued";
  const isComplete = status === "complete";
  const isError = status === "error";
  const isPaused = status === "paused";

  const statusConfig = {
    queued: { icon: Loader2, label: "Queued", color: "text-text-dim", dot: "bg-text-dim", spin: false },
    downloading: {
      icon: Loader2,
      label: "Downloading",
      color: "text-status-blue",
      dot: "bg-status-blue animate-pulse",
      spin: true,
    },
    merging: {
      icon: Merge,
      label: "Merging",
      color: "text-status-orange",
      dot: "bg-status-orange",
      spin: false,
    },
    complete: {
      icon: CheckCircle2,
      label: "Complete",
      color: "text-status-green",
      dot: "bg-status-green",
      spin: false,
    },
    error: {
      icon: AlertCircle,
      label: "Failed",
      color: "text-status-red",
      dot: "bg-status-red",
      spin: false,
    },
    paused: {
      icon: StopCircle,
      label: "Paused",
      color: "text-status-orange",
      dot: "bg-status-orange",
      spin: false,
    },
  };

  const cfg = statusConfig[status] || statusConfig.queued;
  const StatusIcon = cfg.icon;

  return (
    <div className="sl-card animate-slide-up mt-1">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {thumbnail ? (
          <div className="w-10 h-10 rounded-2sm overflow-hidden flex-shrink-0 bg-surface border border-border">
            <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <StatusIcon
            size={18}
            className={cn(cfg.color, cfg.spin && "animate-spin", "flex-shrink-0 mt-0.5")}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary font-serif truncate">
              {title}
            </h3>
            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-2sm border border-border text-xs font-mono flex-shrink-0", cfg.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
          </div>

          {/* Stats row */}
          {(isActive || isPaused) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs font-mono text-text-dim">
              <span>
                {Math.round(progress || 0)}%
                {filesize && <span className="text-text-faint"> of {formatBytes(filesize)}</span>}
              </span>
              {status === "downloading" && speed && (
                <span>
                  &darr; {formatBytes(speed)}/s
                  {eta && ` · ETA ${eta}`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(isActive || isComplete || isPaused) && (
        <div className="sl-progress mb-3">
          {status === "merging" ? (
            <div className="sl-progress-indeterminate w-full" />
          ) : (
            <div
              className={cn("sl-progress-fill", status === "downloading" && "animate-progress-bar")}
              style={{ width: `${Math.min(progress || 0, 100)}%` }}
            />
          )}
        </div>
      )}

      {(isActive || isPaused) && (
        <div className="flex items-center justify-end gap-2 mb-3">
          {isPaused ? (
            <button
              onClick={() => resumeDownload(download.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border text-accent hover:bg-accent-soft transition-colors"
            >
              <Play size={12} />
              Resume
            </button>
          ) : (
            <button
              onClick={() => cancelDownload(download.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border text-text-dim hover:text-status-red hover:border-status-red/30 transition-colors"
            >
              <StopCircle size={12} />
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {isError && error && (
        <div className="mt-2 p-3 bg-status-red-bg rounded border border-status-red/20">
          <p className="text-sm text-status-red/80 font-mono leading-relaxed">
            {error}
          </p>
        </div>
      )}

      {/* Complete actions */}
      {isComplete && download.filepath && (
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => useStore.getState().openFolder(download.filepath)}
            className="sl-btn sl-btn-outline text-xs py-1.5 px-3"
          >
            <FolderOpen size={13} />
            Open folder
          </button>
          <span className="text-xs font-mono text-text-dim truncate">
            {download.filepath}
          </span>
        </div>
      )}

      {/* Collapsible log */}
      <DownloadLog downloadId={download.id} />
    </div>
  );
}
