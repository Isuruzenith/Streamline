import { useState } from "react";
import { Film, Music, Check, ChevronDown } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn, formatBytes } from "@/lib/utils";

const PRESETS = [
  { id: "best-mp4", label: "Best MP4", icon: Film, desc: "Best MP4 video + M4A audio" },
  { id: "1080p", label: "1080p", icon: Film, desc: "Full HD video" },
  { id: "720p", label: "720p", icon: Film, desc: "HD video, smaller file" },
  { id: "audio", label: "Audio only", icon: Music, desc: "Best audio, no video (MP3)" },
];

export default function FormatPicker() {
  const mediaInfo = useStore((s) => s.mediaInfo);
  const selectedPreset = useStore((s) => s.selectedPreset);
  const selectedFormatId = useStore((s) => s.selectedFormatId);
  const setSelectedPreset = useStore((s) => s.setSelectedPreset);
  const setSelectedFormatId = useStore((s) => s.setSelectedFormatId);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!mediaInfo) return null;

  // Group formats: video (with both) and audio-only
  const formats = (mediaInfo.formats || []).filter(
    (f) =>
      f.format_id &&
      (f.vcodec !== "none" || f.acodec !== "none") &&
      f.ext !== "mhtml" && // storyboard
      (f.vcodec !== "none" || f.acodec !== "none") // redundant but explicit
  );

  const videoFormats = formats
    .filter((f) => f.vcodec && f.vcodec !== "none" && f.height)
    .sort((a, b) => (b.height || 0) - (a.height || 0))
    .slice(0, 12);

  const audioFormats = formats
    .filter((f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none")
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))
    .slice(0, 6);
  const largestSize = Math.max(
    1,
    ...formats.map((f) => f.filesize || f.filesize_approx || 0)
  );

  const handleListKeyDown = (list) => (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();

    const currentIndex = list.findIndex((format) => format.format_id === selectedFormatId);
    const fallbackIndex = event.key === "ArrowDown" ? -1 : 0;
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = Math.min(
      Math.max((currentIndex === -1 ? fallbackIndex : currentIndex) + direction, 0),
      list.length - 1
    );
    const nextFormat = list[nextIndex];
    if (nextFormat) setSelectedFormatId(nextFormat.format_id);
  };

  return (
    <div className="animate-slide-up">
      {/* Quick presets */}
      <div className="sl-section-label">Format</div>
      <div className="grid grid-cols-2 md:flex md:flex-row w-full md:w-auto rounded-md border border-border bg-border overflow-hidden gap-[1px]">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              id={`preset-${preset.id}`}
              onClick={() => setSelectedPreset(preset.id)}
              className={cn(
                "flex items-center justify-center md:justify-start gap-2 px-3.5 py-2 text-xs font-mono transition-all active:scale-[0.97] flex-1",
                isSelected
                  ? "bg-accent-soft text-accent"
                  : "bg-surface text-text-muted hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              <Icon
                size={13}
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isSelected ? "text-accent" : "text-text-dim"
                )}
              />
              <span className="truncate">{preset.label}</span>
              {isSelected && (
                <Check size={12} className="text-accent flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Advanced format listing */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-4 flex items-center gap-1.5 text-xs font-mono text-text-dim hover:text-accent transition-colors group"
      >
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform duration-200",
            showAdvanced && "rotate-180"
          )}
        />
        {showAdvanced ? "Hide all formats" : "Show all formats"} ({formats.length})
      </button>

      {showAdvanced && (
        <div className="mt-3 animate-slide-up">
          {/* Video formats */}
          {videoFormats.length > 0 && (
            <>
              <div className="text-xs font-mono text-text-dim uppercase tracking-widest mb-2 mt-4">
                Video
              </div>
              <div
                className="space-y-1 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/15"
                tabIndex={0}
                onKeyDown={handleListKeyDown(videoFormats)}
              >
                {videoFormats.map((f) => (
                  <FormatRow
                    key={f.format_id}
                    format={f}
                    isSelected={selectedFormatId === f.format_id}
                    onSelect={() => setSelectedFormatId(f.format_id)}
                    type="video"
                    largestSize={largestSize}
                  />
                ))}
              </div>
            </>
          )}

          {/* Audio formats */}
          {audioFormats.length > 0 && (
            <>
              <div className="text-xs font-mono text-text-dim uppercase tracking-widest mb-2 mt-4">
                Audio only
              </div>
              <div
                className="space-y-1 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/15"
                tabIndex={0}
                onKeyDown={handleListKeyDown(audioFormats)}
              >
                {audioFormats.map((f) => (
                  <FormatRow
                    key={f.format_id}
                    format={f}
                    isSelected={selectedFormatId === f.format_id}
                    onSelect={() => setSelectedFormatId(f.format_id)}
                    type="audio"
                    largestSize={largestSize}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FormatRow({ format, isSelected, onSelect, type, largestSize }) {
  const { format_id, ext, height, vcodec, acodec, abr, tbr, filesize, filesize_approx } =
    format;
  const size = filesize || filesize_approx;
  const sizePercent = size ? Math.max(4, Math.min((size / largestSize) * 100, 100)) : 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded border text-left transition-all duration-150",
        isSelected
          ? "bg-accent-glow border-border-strong"
          : "bg-surface border-border hover:bg-surface-hover hover:border-border-accent"
      )}
    >
      {/* Checkmark */}
      <div
        className={cn(
          "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
          isSelected
            ? "border-accent bg-accent"
            : "border-text-dim bg-transparent"
        )}
      >
        {isSelected && <Check size={10} className="text-background" />}
      </div>

      {/* Resolution / bitrate */}
      <span
        className={cn(
          "text-sm font-mono w-16 flex-shrink-0",
          isSelected ? "text-text-primary" : "text-text-muted"
        )}
      >
        {type === "video" ? `${height}p` : `${abr || "?"}k`}
      </span>

      {type === "video" && format.acodec === "none" && (
        <span className="text-2xs font-mono text-text-dim bg-surface px-1 rounded" title="Video only — requires ffmpeg to merge audio">
          +audio
        </span>
      )}

      {/* Codec */}
      <span className="text-xs font-mono text-text-dim w-20 truncate">
        {type === "video" ? vcodec?.split(".")[0] : acodec?.split(".")[0]}
      </span>

      {/* Extension */}
      <span className="sl-badge sl-badge-default text-2xs">{ext}</span>

      {/* Bitrate */}
      {tbr && (
        <span className="text-xs font-mono text-text-dim ml-auto">
          {Math.round(tbr)}kbps
        </span>
      )}

      {/* Size */}
      {size && (
        <div className="flex w-24 flex-shrink-0 items-center gap-2">
          <progress
            value={sizePercent}
            max="100"
            className="sl-size-progress"
            aria-label={`${formatBytes(size)} relative file size`}
          />
          <span className="text-xs font-mono text-text-faint w-12 text-right">
            {formatBytes(size)}
          </span>
        </div>
      )}
    </button>
  );
}
