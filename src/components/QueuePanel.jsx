import { useState, useRef } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  GripVertical,
  StopCircle,
  Merge,
} from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn, formatSpeed } from "@/lib/utils";

export default function QueuePanel() {
  const downloads = useStore((s) => s.downloads);
  const removeDownload = useStore((s) => s.removeDownload);
  const cancelDownload = useStore((s) => s.cancelDownload);
  const reorderDownloads = useStore((s) => s.reorderDownloads);

  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  if (downloads.length === 0) return null;

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
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
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
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const openFolder = useStore((s) => s.openFolder);
  const { id, title, status, progress, speed, eta, error, filepath, thumbnail } = download;

  const isActive = status === "downloading" || status === "merging";
  const isQueued = status === "queued";
  const isComplete = status === "complete";
  const isError = status === "error";

  const statusConfig = {
    queued: { icon: Loader2, color: "text-text-dim", label: "Queued", spin: false },
    downloading: { icon: Loader2, color: "text-accent", label: `${Math.round(progress || 0)}%`, spin: true },
    merging: { icon: Merge, color: "text-status-orange", label: "Merging", spin: false },
    complete: { icon: CheckCircle2, color: "text-status-green", label: "Done", spin: false },
    error: { icon: AlertCircle, color: "text-status-red", label: "Failed", spin: false },
  };

  const cfg = statusConfig[status] || statusConfig.queued;
  const StatusIcon = cfg.icon;

  return (
    <div
      draggable={isQueued}
      onDragStart={isQueued ? onDragStart : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-md border transition-all duration-150",
        "bg-surface border-border",
        isDragging && "opacity-40",
        isDragOver && "border-border-accent bg-accent-glow"
      )}
    >
      {/* Drag handle (only for queued items) */}
      {isQueued ? (
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing mt-0.5 text-text-dim hover:text-text-muted">
          <GripVertical size={14} />
        </div>
      ) : (
        <StatusIcon
          size={16}
          className={cn("flex-shrink-0 mt-0.5", cfg.color, cfg.spin && "animate-spin")}
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
          <span className={cn("text-xs font-mono flex-shrink-0", cfg.color)}>
            {cfg.label}
          </span>
        </div>

        {/* Progress bar for active */}
        {isActive && (
          <div className="sl-progress mt-2">
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

        {/* Stats row for active */}
        {isActive && (
          <div className="flex items-center gap-4 mt-1.5 text-xs font-mono text-text-dim">
            {speed && <span>{formatSpeed(speed)}</span>}
            {eta && <span>ETA {eta}s</span>}
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
      </div>
    </div>
  );
}
