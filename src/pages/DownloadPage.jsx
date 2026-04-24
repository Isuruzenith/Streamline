import URLInput from "@/components/URLInput";
import MediaPreview from "@/components/MediaPreview";
import FormatPicker from "@/components/FormatPicker";
import DownloadButton from "@/components/DownloadButton";
import PlaylistPanel from "@/components/PlaylistPanel";
import QueuePanel from "@/components/QueuePanel";
import useStore from "@/hooks/useStore";

export default function DownloadPage() {
  const mediaInfo = useStore((s) => s.mediaInfo);
  const downloads = useStore((s) => s.downloads);
  const hasDownloads = downloads.length > 0;
  const isPlaylist = mediaInfo?.is_playlist === true;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl text-accent">↓</span>
          <h1 className="text-2xl font-bold text-text-primary font-serif tracking-tight">
            Download
          </h1>
        </div>
        <div className="h-px bg-border" />
      </div>

      {/* URL Input */}
      <div className="mb-6">
        <URLInput />
      </div>

      {/* Playlist mode */}
      {isPlaylist && (
        <div className="mb-6">
          <PlaylistPanel />
        </div>
      )}

      {/* Single video mode */}
      {mediaInfo && !isPlaylist && (
        <>
          {/* Media Preview */}
          <div className="mb-6">
            <MediaPreview />
          </div>

          {/* Format Picker */}
          <div className="mb-6">
            <FormatPicker />
          </div>

          {/* Download Button */}
          <div className="mb-6">
            <DownloadButton />
          </div>
        </>
      )}

      {/* Queue / Active / Recent downloads */}
      {hasDownloads && (
        <div className="mb-6">
          <QueuePanel />
        </div>
      )}
    </div>
  );
}
