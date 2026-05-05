import { useState } from "react";
import {
  BadgeCheck,
  Captions,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileArchive,
  FileVideo,
  Gauge,
  Image,
  ListTree,
  Scissors,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import useStore from "@/hooks/useStore";

const AUDIO_FORMATS = ["mp3", "m4a", "opus", "aac", "flac", "wav"];
const VIDEO_FORMATS = ["mp4", "mkv", "webm", "mov", "avi"];
const SUBTITLE_FORMATS = ["srt", "vtt", "ass", "best"];
const FLAG_PRESETS = [
  { label: "Force MP4 container", value: "--merge-output-format mp4" },
  { label: "Remux to MKV", value: "--remux-video mkv" },
  { label: "Max 4K resolution", value: "-f bestvideo[height<=2160]+bestaudio/best" },
  { label: "No playlist", value: "--no-playlist" },
  { label: "Keep original files", value: "-k" },
  { label: "Geo-bypass", value: "--geo-bypass" },
  { label: "Verbose debug output", value: "--verbose" },
  { label: "Use aria2c downloader", value: "--downloader aria2c --downloader-args aria2c:'-x 16 -s 16'" },
];

export default function DownloadOptions() {
  const options = useStore((s) => s.downloadOptions);
  const setDownloadOption = useStore((s) => s.setDownloadOption);
  const [expanded, setExpanded] = useState(false);

  const set = (key) => (event) => {
    const target = event.target;
    setDownloadOption(
      key,
      target.type === "checkbox" ? target.checked : target.value
    );
  };

  const insertFlagPreset = (event) => {
    const value = event.target.value;
    if (!value) return;

    setDownloadOption(
      "customFlags",
      [options.customFlags?.trim(), value].filter(Boolean).join(" ")
    );
    event.target.value = "";
  };

  return (
    <div className="animate-slide-up">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="sl-section-label w-full justify-between hover:text-accent transition-colors"
        aria-expanded={expanded}
      >
        <span>Options</span>
        <span className="ml-auto flex items-center gap-2 text-text-dim normal-case tracking-normal">
          <span className="text-xs">Advanced</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded && <div className="space-y-3 animate-slide-up">
        <OptionRow icon={FileVideo} title="Video format">
          <select
            className="sl-input py-2 text-sm mt-3"
            value={options.videoFormat || "mp4"}
            onChange={set("videoFormat")}
          >
            {VIDEO_FORMATS.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </OptionRow>

        <OptionRow
          icon={Captions}
          title="Subtitles"
          control={
            <input
              type="checkbox"
              checked={options.writeSubtitles}
              onChange={set("writeSubtitles")}
              className="h-4 w-4 accent-accent"
            />
          }
        >
          {options.writeSubtitles && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <input
                className="sl-input py-2 text-sm"
                value={options.subtitleLanguages}
                onChange={set("subtitleLanguages")}
                placeholder="en.*,ja"
              />
              <select
                className="sl-input py-2 text-sm"
                value={options.subtitleFormat}
                onChange={set("subtitleFormat")}
              >
                {SUBTITLE_FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
              <label className="col-span-2 flex items-center gap-2 text-xs text-text-dim">
                <input
                  type="checkbox"
                  checked={options.writeAutoSubtitles}
                  onChange={set("writeAutoSubtitles")}
                  className="h-3.5 w-3.5 accent-accent"
                />
                Include automatic subtitles
              </label>
            </div>
          )}
        </OptionRow>

        <OptionRow
          icon={Image}
          title="Thumbnail"
          control={
            <input
              type="checkbox"
              checked={options.writeThumbnail}
              onChange={set("writeThumbnail")}
              className="h-4 w-4 accent-accent"
            />
          }
        />

        <OptionRow
          icon={Tags}
          title="Embed metadata"
          control={
            <input
              type="checkbox"
              checked={options.embedMetadata}
              onChange={set("embedMetadata")}
              className="h-4 w-4 accent-accent"
            />
          }
        />

        <OptionRow icon={ListTree} title="Chapters">
          <select
            className="sl-input py-2 text-sm mt-3"
            value={options.chaptersMode}
            onChange={set("chaptersMode")}
          >
            <option value="embed">Embed chapter markers</option>
            <option value="split">Split into chapter files</option>
            <option value="off">Off</option>
          </select>
        </OptionRow>

        <OptionRow
          icon={Scissors}
          title="SponsorBlock"
          control={
            <input
              type="checkbox"
              checked={options.sponsorBlock}
              onChange={set("sponsorBlock")}
              className="h-4 w-4 accent-accent"
            />
          }
        />

        <OptionRow
          icon={FileArchive}
          title="Download archive"
          control={
            <input
              type="checkbox"
              checked={options.downloadArchive}
              onChange={set("downloadArchive")}
              className="h-4 w-4 accent-accent"
            />
          }
        />

        <OptionRow icon={Gauge} title="Speed and fragments">
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input
              className="sl-input py-2 text-sm"
              value={options.rateLimit}
              onChange={set("rateLimit")}
              placeholder="Rate limit, e.g. 5M"
              aria-label="Rate limit"
            />
            <input
              className="sl-input py-2 text-sm"
              type="number"
              min="1"
              max="16"
              value={options.concurrentFragments}
              onChange={(event) =>
                setDownloadOption(
                  "concurrentFragments",
                  Number(event.target.value || 1)
                )
              }
              aria-label="Concurrent fragments"
              title="Concurrent fragments"
            />
          </div>
          <p className="mt-2 text-xs text-text-dim">
            Default is 8 fragments for faster segmented downloads. Raise it on
            fast networks; lower it if a site throttles aggressively.
          </p>
        </OptionRow>

        <OptionRow icon={BadgeCheck} title="Audio extraction">
          <div className="grid grid-cols-2 gap-2 mt-3">
            <select
              className="sl-input py-2 text-sm"
              value={options.audioFormat}
              onChange={set("audioFormat")}
            >
              {AUDIO_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
            <input
              className="sl-input py-2 text-sm"
              value={options.audioQuality}
              onChange={set("audioQuality")}
              placeholder="Quality, 0-10"
            />
          </div>
        </OptionRow>

        <OptionRow icon={SlidersHorizontal} title="Custom yt-dlp flags">
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              defaultValue=""
              onChange={insertFlagPreset}
              className="sl-input py-2 text-sm flex-1 min-w-[220px]"
            >
              <option value="" disabled>
                Insert preset flag...
              </option>
              {FLAG_PRESETS.map((preset) => (
                <option key={preset.label} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
            <a
              href="https://github.com/yt-dlp/yt-dlp#usage-and-options"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono text-accent/70 transition-colors hover:text-accent"
            >
              See all flags
              <ExternalLink size={11} />
            </a>
          </div>
          <textarea
            className="sl-input py-2 text-sm mt-2 font-mono resize-y"
            rows={2}
            value={options.customFlags}
            onChange={set("customFlags")}
            placeholder='--merge-output-format mp4 --compat-options filename'
          />
          {options.customFlags?.trim() && (
            <div className="mt-2 flex flex-wrap gap-1">
              {options.customFlags.trim().split(/\s+/).map((token, i) => (
                <code
                  key={`${token}-${i}`}
                  className={`sl-code text-2xs px-1.5 py-0.5 rounded ${
                    token.startsWith("--") || token.startsWith("-")
                      ? "text-accent border border-accent/30 bg-accent/5"
                      : "text-text-muted"
                  }`}
                >
                  {token}
                </code>
              ))}
            </div>
          )}
        </OptionRow>
      </div>}
    </div>
  );
}

function OptionRow({ icon: Icon, title, control, children }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <Icon size={15} className="text-text-dim" />
        <span className="text-sm font-semibold text-text-secondary">
          {title}
        </span>
        {control && <div className="ml-auto">{control}</div>}
      </div>
      {children}
    </div>
  );
}
