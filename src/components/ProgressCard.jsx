import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Merge,
} from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn, formatBytes, formatSpeed } from "@/lib/utils";
import DownloadLog from "./DownloadLog";

// Note: This component is kept for backward compat but QueuePanel is now preferred.

export default function ProgressCard() {
  const downloads = useStore((s) => s.downloads);
  const activeDownloadId = useStore((s) => s.activeDownloadId);

  // Show the active download, or the most recent one
  const download =
    downloads.find((d) => d.id === activeDownloadId) ||
    downloads[downloads.length - 1];

  if (!download) return null;

  const { status, title, progress, speed, eta, filesize, error } = download;
  const isActive = status === "downloading" || status === "merging" || status === "queued";
  const isComplete = status === "complete";
  const isError = status === "error";

  const statusConfig = {
    queued: { icon: Loader2, label: "Queued", color: "text-text-dim", spin: false },
    downloading: {
      icon: Loader2,
      label: `${Math.round(progress || 0)}%`,
      color: "text-accent",
      spin: true,
    },
    merging: {
      icon: Merge,
      label: "Merging streams...",
      color: "text-status-orange",
      spin: false,
    },
    complete: {
      icon: CheckCircle2,
      label: "Complete",
      color: "text-status-green",
      spin: false,
    },
    error: {
      icon: AlertCircle,
      label: "Failed",
      color: "text-status-red",
      spin: false,
    },
  };

  const cfg = statusConfig[status] || statusConfig.queued;
  const StatusIcon = cfg.icon;

  return (
    <div className="sl-card animate-slide-up mt-1">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <StatusIcon
          size={18}
          className={cn(cfg.color, cfg.spin && "animate-spin", "flex-shrink-0 mt-0.5")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary font-serif truncate">
              {title}
            </h3>
            <span className={cn("text-xs font-mono flex-shrink-0", cfg.color)}>
              {cfg.label}
            </span>
          </div>

          {/* Stats row */}
          {isActive && (
            <div className="flex items-center gap-4 mt-1 text-xs font-mono text-text-dim">
              {speed && <span>{formatSpeed(speed)}</span>}
              {eta && <span>ETA {eta}s</span>}
              {filesize && <span>{formatBytes(filesize)}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(isActive || isComplete) && (
        <div className="sl-progress mb-3">
          {status === "merging" ? (
            <div className="sl-progress-indeterminate w-full" />
          ) : (
            <div
              className="sl-progress-fill"
              style={{ width: `${Math.min(progress || 0, 100)}%` }}
            />
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
