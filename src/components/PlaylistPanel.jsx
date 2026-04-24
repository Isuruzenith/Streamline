import { ListMusic, Check, CheckCheck, XCircle, Download, Clock } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn, formatDuration } from "@/lib/utils";

export default function PlaylistPanel() {
  const mediaInfo = useStore((s) => s.mediaInfo);
  const playlistSelected = useStore((s) => s.playlistSelected);
  const togglePlaylistEntry = useStore((s) => s.togglePlaylistEntry);
  const selectAllPlaylist = useStore((s) => s.selectAllPlaylist);
  const deselectAllPlaylist = useStore((s) => s.deselectAllPlaylist);
  const downloadSelectedPlaylistItems = useStore((s) => s.downloadSelectedPlaylistItems);

  if (!mediaInfo?.is_playlist || !mediaInfo?.entries) return null;

  const entries = mediaInfo.entries;
  const selectedCount = playlistSelected.size;
  const allSelected = selectedCount === entries.length;
  const totalDuration = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

  return (
    <div className="sl-card sl-card-accent animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <ListMusic size={18} className="text-accent flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-md font-semibold text-text-primary font-serif truncate">
            {mediaInfo.playlist_title || "Playlist"}
          </h2>
          <div className="flex items-center gap-3 text-xs font-mono text-text-dim mt-0.5">
            <span>{entries.length} items</span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatDuration(totalDuration)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selection controls */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={allSelected ? deselectAllPlaylist : selectAllPlaylist}
          className="sl-btn sl-btn-ghost text-xs py-1 px-2.5"
        >
          {allSelected ? (
            <>
              <XCircle size={12} />
              Deselect all
            </>
          ) : (
            <>
              <CheckCheck size={12} />
              Select all
            </>
          )}
        </button>

        <span className="text-xs font-mono text-text-dim ml-auto">
          {selectedCount} selected
        </span>
      </div>

      {/* Entry list */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
        {entries.map((entry, index) => {
          const isSelected = playlistSelected.has(index);
          return (
            <button
              key={index}
              onClick={() => togglePlaylistEntry(index)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded border transition-all duration-150 text-left",
                isSelected
                  ? "bg-accent-glow border-border-strong"
                  : "bg-surface border-border hover:bg-surface-hover hover:border-border-accent"
              )}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  "w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors",
                  isSelected
                    ? "border-accent bg-accent"
                    : "border-text-dim bg-transparent"
                )}
              >
                {isSelected && <Check size={10} className="text-background" />}
              </div>

              {/* Thumbnail */}
              {entry.thumbnail && (
                <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-surface-hover">
                  <img
                    src={entry.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-secondary truncate">
                  {entry.title}
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-text-dim">
                  {entry.duration > 0 && <span>{formatDuration(entry.duration)}</span>}
                  {entry.uploader && <span className="truncate">{entry.uploader}</span>}
                </div>
              </div>

              {/* Index */}
              <span className="text-2xs font-mono text-text-dim flex-shrink-0">
                #{index + 1}
              </span>
            </button>
          );
        })}
      </div>

      {/* Download button */}
      {selectedCount > 0 && (
        <div className="mt-4">
          <button
            onClick={downloadSelectedPlaylistItems}
            className="sl-btn sl-btn-primary w-full py-3"
          >
            <Download size={16} />
            Download {selectedCount} item{selectedCount !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
