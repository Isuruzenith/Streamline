import { useState } from "react";
import { ListMusic, Check, CheckCheck, XCircle, Download, Clock, Shuffle, SlidersHorizontal, Film, Music } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn, formatDuration } from "@/lib/utils";

const QUALITY_PRESETS = [
  { id: "best-mp4", label: "Best MP4", icon: Film },
  { id: "1080p", label: "1080p", icon: Film },
  { id: "720p", label: "720p", icon: Film },
  { id: "audio", label: "Audio", icon: Music },
];

export default function PlaylistPanel() {
  const mediaInfo = useStore((s) => s.mediaInfo);
  const playlistSelected = useStore((s) => s.playlistSelected);
  const togglePlaylistEntry = useStore((s) => s.togglePlaylistEntry);
  const selectAllPlaylist = useStore((s) => s.selectAllPlaylist);
  const deselectAllPlaylist = useStore((s) => s.deselectAllPlaylist);
  const invertPlaylistSelection = useStore((s) => s.invertPlaylistSelection);
  const selectPlaylistRange = useStore((s) => s.selectPlaylistRange);
  const downloadSelectedPlaylistItems = useStore((s) => s.downloadSelectedPlaylistItems);
  const selectedPreset = useStore((s) => s.selectedPreset);
  const setSelectedPreset = useStore((s) => s.setSelectedPreset);
  const [rangeStart, setRangeStart] = useState("1");
  const [rangeEnd, setRangeEnd] = useState("");

  if (!mediaInfo?.is_playlist || !mediaInfo?.entries) return null;

  const entries = mediaInfo.entries;
  const selectedCount = playlistSelected.size;
  const allSelected = selectedCount === entries.length;
  const totalDuration = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const normalizedRangeEnd = rangeEnd || String(entries.length);

  const applyRangeSelection = () => {
    selectPlaylistRange(rangeStart, normalizedRangeEnd);
  };

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

      {mediaInfo.truncated && (
        <p className="mb-3 px-1 text-xs text-status-orange font-mono">
          {"\u26a0"} Showing first 200 items. Full playlist will download completely.
        </p>
      )}

      {/* Selection controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
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

        <button
          onClick={invertPlaylistSelection}
          className="sl-btn sl-btn-ghost text-xs py-1 px-2.5"
        >
          <Shuffle size={12} />
          Invert
        </button>

        <span className="text-xs font-mono text-text-dim ml-auto">
          {selectedCount} selected
        </span>
      </div>

      {/* Quality controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-text-dim">
          <Film size={12} />
          Quality
        </div>
        <div className="ml-auto inline-flex rounded-md border border-border overflow-hidden bg-surface">
          {QUALITY_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors border-r border-border last:border-0",
                  isSelected
                    ? "bg-accent-soft text-accent"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                <Icon size={12} />
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-text-dim">
          <SlidersHorizontal size={12} />
          Range
        </div>
        <input
          type="number"
          min="1"
          max={entries.length}
          value={rangeStart}
          onChange={(event) => setRangeStart(event.target.value)}
          className="w-16 bg-surface-hover border border-border rounded-2sm px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-border-accent"
          aria-label="Playlist range start"
        />
        <span className="text-xs font-mono text-text-dim">to</span>
        <input
          type="number"
          min="1"
          max={entries.length}
          value={rangeEnd}
          onChange={(event) => setRangeEnd(event.target.value)}
          placeholder={String(entries.length)}
          className="w-16 bg-surface-hover border border-border rounded-2sm px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-dim focus:outline-none focus:border-border-accent"
          aria-label="Playlist range end"
        />
        <button
          onClick={applyRangeSelection}
          className="ml-auto text-xs font-mono text-accent hover:text-text-primary transition-colors"
        >
          Select range
        </button>
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
            disabled={!selectedPreset}
            className={cn(
              "sl-btn w-full py-3",
              selectedPreset ? "sl-btn-primary" : "bg-surface-hover text-text-dim cursor-not-allowed"
            )}
          >
            <Download size={16} />
            {selectedPreset
              ? `Download ${selectedCount} item${selectedCount !== 1 ? "s" : ""} - ${QUALITY_PRESETS.find((preset) => preset.id === selectedPreset)?.label}`
              : "Choose Quality"}
          </button>
        </div>
      )}
    </div>
  );
}
