import { Clock, User, Calendar, ExternalLink } from "lucide-react";
import useStore from "@/hooks/useStore";
import { formatDuration } from "@/lib/utils";

export default function MediaPreview() {
  const mediaInfo = useStore((s) => s.mediaInfo);

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
  } = mediaInfo;

  // Format upload date from YYYYMMDD
  const formattedDate = upload_date
    ? `${upload_date.slice(0, 4)}-${upload_date.slice(4, 6)}-${upload_date.slice(6, 8)}`
    : null;

  return (
    <div className="sl-card sl-card-accent animate-slide-up overflow-hidden">
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative -mx-4.5 -mt-4.5 mb-4 overflow-hidden rounded-t-md">
          <img
            src={thumbnail}
            alt={title || "Video thumbnail"}
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
          {/* Duration badge */}
          {duration > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs font-mono text-white backdrop-blur-sm">
              {formatDuration(duration)}
            </div>
          )}
          {/* Source badge */}
          {extractor_key && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-2xs font-mono text-white/80 backdrop-blur-sm uppercase tracking-wider">
              {extractor_key}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <h2 className="text-md font-semibold text-text-primary font-serif leading-snug mb-3">
        {title || "Untitled"}
      </h2>

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
