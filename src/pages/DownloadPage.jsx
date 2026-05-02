import { Download } from "lucide-react";
import URLInput from "@/components/URLInput";
import MediaPreview from "@/components/MediaPreview";
import FormatPicker from "@/components/FormatPicker";
import DownloadButton from "@/components/DownloadButton";
import PlaylistPanel from "@/components/PlaylistPanel";
import QueuePanel from "@/components/QueuePanel";
import LiveLogs from "@/components/LiveLogs";
import DownloadOptions from "@/components/DownloadOptions";
import useStore from "@/hooks/useStore";

export default function DownloadPage() {
  const mediaInfo = useStore((s) => s.mediaInfo);
  const isPlaylist = mediaInfo?.is_playlist === true;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Download size={18} className="text-accent" />
          <h1 className="text-2xl font-bold text-text-primary font-serif tracking-tight">
            Download
          </h1>
        </div>
        <p className="text-sm text-text-dim ml-[30px]">
          Paste any URL - supports 1000+ platforms
        </p>
        <div className="h-px bg-border mt-4" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="min-w-0">
          <div className="mb-6">
            <URLInput />
          </div>

          {isPlaylist && (
            <div className="mb-6">
              <PlaylistPanel />
            </div>
          )}

          {mediaInfo && !isPlaylist && (
            <div className="mb-6">
              <MediaPreview />
            </div>
          )}

          <div className="mb-6">
            <QueuePanel />
          </div>
        </div>

        <div className="min-w-0">
          {mediaInfo && !isPlaylist && (
            <>
              <div className="mb-6">
                <FormatPicker />
              </div>
              <div className="mb-6">
                <DownloadOptions />
              </div>
              <div className="mb-6">
                <DownloadButton />
              </div>
            </>
          )}
          <LiveLogs />
        </div>
      </div>
    </div>
  );
}
