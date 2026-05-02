import { useState } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  GripVertical,
  StopCircle,
  Merge,
  Download,
  Play,
} from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn, formatBytes } from "@/lib/utils";

export default function QueuePanel() {
  const downloads = useStore((s) => s.downloads);
  const removeDownload = useStore((s) => s.removeDownload);
  const cancelDownload = useStore((s) => s.cancelDownload);
  const resumeDownload = useStore((s) => s.resumeDownload);
  const reorderDownloads = useStore((s) => s.reorderDownloads);

  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const downloadingCount = downloads.filter((d) => d.status === "downloading" || d.status === "merging").length;
  const queuedCount = downloads.filter((d) => d.status === "queued").length;
  const completedCount = downloads.filter((d) => d.status === "complete").length;

  const clearCompleted = () => {
    downloads
      .filter((download) => download.status === "complete")
      .forEach((download) => removeDownload(download.id));
  };

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex) {
      reorderDownloads(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="animate-slide-up">
      <div className="sl-section-label">Queue</div>
      {downloads.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-mono text-text-dim">
          <span>
            {"\u2193"} {downloadingCount} active {"\u00b7"} {queuedCount} queued {"\u00b7"} {"\u2713"} {completedCount} done
          </span>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="ml-auto text-text-dim hover:text-accent transition-colors"
            >
              Clear completed
            </button>
          )}
        </div>
      )}
      {downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3 border border-border rounded-md bg-surface">
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-border">
            <Download size={16} className="text-text-dim" />
          </div>
          <p className="text-sm text-text-dim">No downloads yet</p>
          <p className="text-xs text-text-dim opacity-60">Paste a URL above to get started</p>
        </div>
      ) : (
      <>
      <div className="space-y-1.5">
        {downloads.map((dl, index) => (
          <QueueItem
            key={dl.id}
            download={dl}
            index={index}
            isDragging={dragIndex === index}
            isDragOver={dragOverIndex === index}
            onRemove={() => removeDownload(dl.id)}
            onCancel={() => cancelDownload(dl.id)}
            onResume={() => resumeDownload(dl.id)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
      </>
      )}
    </div>
  );
}

function QueueItem({
  download,
  index,
  isDragging,
  isDragOver,
  onRemove,
  onCancel,
  onResume,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const openFolder = useStore((s) => s.openFolder);
  const { title, status, progress, speed, eta, error, filepath, thumbnail, filesize } = download;
  const [isHandleGrabbing, setIsHandleGrabbing] = useState(false);

  const isActive = status === "downloading" || status === "merging";
  const isQueued = status === "queued";
  const isComplete = status === "complete";
  const isError = status === "error";
  const isPaused = status === "paused";

  const statusConfig = {
    queued: { icon: Loader2, color: "text-text-dim", dot: "bg-text-dim", label: "Queued", spin: false },
    downloading: { icon: Loader2, color: "text-status-blue", dot: "bg-status-blue animate-pulse", label: "Downloading", spin: true },
    merging: { icon: Merge, color: "text-status-orange", dot: "bg-status-orange", label: "Merging", spin: false },
    complete: { icon: CheckCircle2, color: "text-status-green", dot: "bg-status-green", label: "Done", spin: false },
    error: { icon: AlertCircle, color: "text-status-red", dot: "bg-status-red", label: "Failed", spin: false },
    paused: { icon: StopCircle, color: "text-status-orange", dot: "bg-status-orange", label: "Paused", spin: false },
  };

  const cfg = statusConfig[status] || statusConfig.queued;
  const StatusIcon = cfg.icon;

  return (
    <div
      draggable={isQueued}
      onDragStart={isQueued ? onDragStart : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={(e) => {
        setIsHandleGrabbing(false);
        onDragEnd(e);
      }}
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-md border transition-all duration-150",
        "bg-surface border-border",
        isDragging && "opacity-40",
        isDragOver && "border-border-accent bg-accent-glow"
      )}
    >
      {/* Drag handle (only for queued items) */}
      {isQueued ? (
        <div
          draggable
          title="Drag to reorder"
          onMouseDown={() => setIsHandleGrabbing(true)}
          onMouseUp={() => setIsHandleGrabbing(false)}
          onMouseLeave={() => setIsHandleGrabbing(false)}
          className="flex-shrink-0 mt-0.5 text-text-dim hover:text-text-muted"
          style={{
            cursor: isHandleGrabbing ? "grabbing" : "grab",
            color: "var(--color-text-secondary, currentColor)",
            fontSize: "14px",
          }}
        >
          <GripVertical size={14} />
        </div>
      ) : (
        <StatusIcon
          size={16}
          className={cn("flex-shrink-0 mt-0.5", cfg.color, cfg.spin && "animate-spin", isComplete && "sl-pop-in")}
        />
      )}

      {/* Thumbnail (small) */}
      {thumbnail && (
        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-surface-hover">
          <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-text-primary font-serif truncate">
            {title}
          </span>
          <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-2sm border border-border text-xs font-mono flex-shrink-0", cfg.color)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>

        {/* Progress bar for active */}
        {(isActive || isPaused || isComplete) && (
          <div className="sl-progress mt-2 h-1.5">
            {status === "merging" ? (
              <div className="sl-progress-indeterminate w-full" />
            ) : (
              <div
                className={cn("sl-progress-fill", status === "downloading" && "sl-progress-active")}
                style={{ width: `${Math.min(progress || 0, 100)}%` }}
              />
            )}
          </div>
        )}

        {/* Stats row for active */}
        {(isActive || isPaused) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs font-mono text-text-dim">
            <span>
              {Math.round(progress || 0)}%
              {filesize && <span className="text-text-faint"> of {formatBytes(filesize)}</span>}
            </span>
            {status === "downloading" && speed && (
              <span>
                ↓ {formatBytes(speed)}/s
                {eta && ` · ETA ${eta}`}
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {isError && error && (
          <p className="mt-1 text-xs text-status-red/70 font-mono truncate">{error}</p>
        )}

        {/* Complete actions */}
        {isComplete && filepath && (
          <button
            onClick={() => openFolder(filepath)}
            className="mt-1 text-xs font-mono text-accent/60 hover:text-accent transition-colors"
          >
            Open folder
          </button>
        )}

      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0">
        {isQueued && (
          <button
            onClick={onRemove}
            className="p-1 text-text-dim hover:text-status-red transition-colors"
            aria-label="Remove from queue"
          >
            <X size={14} />
          </button>
        )}
        {isActive && (
          <button
            onClick={onCancel}
            className="p-1 text-text-dim hover:text-status-red transition-colors"
            aria-label="Cancel download"
          >
            <StopCircle size={14} />
          </button>
        )}
        {isPaused && (
          <button
            onClick={onResume}
            className="p-1 text-text-dim hover:text-accent transition-colors"
            aria-label="Resume download"
          >
            <Play size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
