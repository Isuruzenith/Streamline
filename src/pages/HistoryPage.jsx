import { useEffect } from "react";
import {
  Clock,
  FolderOpen,
  Trash2,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Film,
} from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const history = useStore((s) => s.history);
  const historyLoading = useStore((s) => s.historyLoading);
  const fetchHistory = useStore((s) => s.fetchHistory);
  const clearHistory = useStore((s) => s.clearHistory);
  const removeHistoryItem = useStore((s) => s.removeHistoryItem);
  const openFolder = useStore((s) => s.openFolder);
  const startDownload = useStore((s) => s.startDownload);
  const setActivePage = useStore((s) => s.setActivePage);

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl text-accent">◷</span>
          <h1 className="text-2xl font-bold text-text-primary font-serif tracking-tight">
            History
          </h1>

          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="sl-btn sl-btn-ghost text-xs ml-auto py-1.5 px-3"
            >
              <Trash2 size={12} />
              Clear all
            </button>
          )}
        </div>
        <div className="h-px bg-border" />
      </div>

      {/* Loading */}
      {historyLoading && history.length === 0 && (
        <div className="flex items-center gap-3 py-12 justify-center text-text-dim">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-mono">Loading history...</span>
        </div>
      )}

      {/* Empty state */}
      {!historyLoading && history.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <Clock size={40} className="mx-auto text-text-dim/30 mb-4" />
          <h3 className="text-md font-semibold text-text-muted font-serif mb-2">
            No downloads yet
          </h3>
          <p className="text-sm text-text-dim mb-6">
            Completed downloads will appear here.
          </p>
          <button
            onClick={() => setActivePage("download")}
            className="sl-btn sl-btn-outline text-sm"
          >
            <Download size={14} />
            Start downloading
          </button>
        </div>
      )}

      {/* History list */}
      {history.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {history.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onOpenFolder={() => item.filepath && openFolder(item.filepath)}
              onRedownload={() => {
                startDownload(item.url, item.title, item.thumbnail);
                setActivePage("download");
              }}
              onRemove={() => removeHistoryItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryItem({ item, onOpenFolder, onRedownload, onRemove }) {
  const isComplete = item.status === "complete";
  const isError = item.status === "error";

  const date = item.completedAt
    ? new Date(item.completedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex items-start gap-3.5 p-3.5 rounded-md border bg-surface border-border hover:bg-surface-hover transition-colors">
      {/* Thumbnail */}
      <div className="w-12 h-8 rounded-2sm overflow-hidden flex-shrink-0 bg-surface border border-border">
      {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Film size={12} className="text-text-dim" />
        </div>
      )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary font-serif truncate">
          {item.title || "Untitled"}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs font-mono text-text-dim">
          {isComplete ? (
            <span className="flex items-center gap-1 text-status-green/60">
              <CheckCircle2 size={10} />
              Completed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-status-red/60">
              <AlertCircle size={10} />
              Failed
            </span>
          )}
          {date && <span>{date}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isComplete && item.filepath && (
          <button
            onClick={onOpenFolder}
            className="p-1.5 text-text-dim hover:text-accent transition-colors"
            aria-label="Open folder"
            title="Open folder"
          >
            <FolderOpen size={14} />
          </button>
        )}
        <button
          onClick={onRedownload}
          className="p-1.5 text-text-dim hover:text-accent transition-colors"
          aria-label="Re-download"
          title="Re-download"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 text-text-dim hover:text-status-red transition-colors"
          aria-label="Remove from history"
          title="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
