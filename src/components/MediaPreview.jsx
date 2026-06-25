import { useEffect, useState } from "react";
import { Clock, User, Calendar, ExternalLink, Film } from "lucide-react";
import useStore from "@/hooks/useStore";
import { formatBytes, formatDuration } from "@/lib/utils";

const PLATFORM_LABELS = {
  Youtube: { label: "YouTube", color: "#ff4444" },
  TikTok: { label: "TikTok", color: "#69c9d0" },
  Instagram: { label: "Instagram", color: "#e1306c" },
  Facebook: { label: "Facebook", color: "#1877f2" },
  Twitter: { label: "Twitter/X", color: "#8b8b8b" },
};

export default function MediaPreview() {
  const mediaInfo = useStore((s) => s.mediaInfo);
  const mediaLoading = useStore((s) => s.mediaLoading);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [mediaInfo]);

  if (mediaLoading) {
    return (
      <div className="sl-card sl-card-accent animate-slide-up overflow-hidden">
        <div className="relative -mx-4.5 -mt-4.5 mb-4 aspect-video overflow-hidden rounded-t-md sl-skeleton animate-pulse" />
        <div className="space-y-3">
          <div className="h-5 w-4/5 rounded sl-skeleton" />
          <div className="flex gap-3">
            <div className="h-4 w-24 rounded sl-skeleton" />
            <div className="h-4 w-20 rounded sl-skeleton" />
            <div className="h-4 w-28 rounded sl-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!mediaInfo) return null;

  const {
    title,
    thumbnail,
    duration,
    uploader,
    upload_date,
    webpage_url,
    extractor_key,
    view_count,
    like_count,
    description,
    filesize_approx,
  } = mediaInfo;

  const formattedDate =
    upload_date && /^\d{8}$/.test(upload_date)
      ? `Uploaded ${new Date(
          Number(upload_date.slice(0, 4)),
          Number(upload_date.slice(4, 6)) - 1,
          Number(upload_date.slice(6, 8))
        ).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
      : null;
  const platform = PLATFORM_LABELS[extractor_key] || null;

  return (
    <div className="sl-card sl-card-accent animate-slide-up overflow-hidden">
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative -mx-4.5 -mt-4.5 mb-4 aspect-video overflow-hidden rounded-t-md bg-surface-hover group/thumb">
          {imgFailed ? (
            <div
              className="flex w-full aspect-video items-center justify-center text-text-dim"
              style={{ background: "var(--color-background-secondary, rgba(255,255,255,0.04))" }}
            >
              <Film size={36} />
            </div>
          ) : (
            <img
              src={thumbnail}
              alt={title || "Video thumbnail"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-[1.03]"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          )}
          {/* Duration badge - glassmorphism */}
          {duration > 0 && (
            <div className="absolute bottom-2 right-2 px-2.5 py-1 sl-glass rounded-md text-xs font-mono text-white">
              {formatDuration(duration)}
            </div>
          )}
          {/* Source badge - glassmorphism */}
          {extractor_key && (
            <div className="absolute top-2 left-2 px-2.5 py-1 sl-glass rounded-md text-2xs font-mono text-white/90 uppercase tracking-wider">
              {extractor_key}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div className="flex items-start gap-2 mb-3">
        <h2 className="text-md font-semibold text-text-primary font-serif leading-snug min-w-0 flex-1">
          {title || "Untitled"}
        </h2>
        {platform && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-2sm text-2xs font-mono border border-border flex-shrink-0"
            style={{ color: platform.color }}
          >
            {platform.label}
          </span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-faint">
        {uploader && (
          <div className="flex items-center gap-1.5">
            <User size={12} className="text-text-dim" />
            <span>{uploader}</span>
          </div>
        )}
        {duration > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-text-dim" />
            <span>{formatDuration(duration)}</span>
          </div>
        )}
        {formattedDate && (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-text-dim" />
            <span>{formattedDate}</span>
          </div>
        )}
        {filesize_approx && (
          <span className="sl-badge sl-badge-default">
            ~{formatBytes(filesize_approx)}
          </span>
        )}
        {webpage_url && (
          <a
            href={webpage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-accent/60 hover:text-accent transition-colors ml-auto"
          >
            <ExternalLink size={12} />
            <span className="text-xs font-mono">Source</span>
          </a>
        )}
      </div>

      {/* Stats */}
      {(view_count || like_count) && (
        <div className="flex gap-4 mt-3 text-xs font-mono text-text-dim">
          {view_count && (
            <span>{Number(view_count).toLocaleString()} views</span>
          )}
          {like_count && (
            <span>{Number(like_count).toLocaleString()} likes</span>
          )}
        </div>
      )}
    </div>
  );
}
