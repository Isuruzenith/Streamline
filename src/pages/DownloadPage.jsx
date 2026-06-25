import { Download } from "lucide-react";
import { useEffect, useRef } from "react";
import URLInput from "@/components/URLInput";
import MediaPreview from "@/components/MediaPreview";
import FormatPicker from "@/components/FormatPicker";
import DownloadButton from "@/components/DownloadButton";
import PlaylistPanel from "@/components/PlaylistPanel";
import QueuePanel from "@/components/QueuePanel";
import DownloadOptions from "@/components/DownloadOptions";
import useStore from "@/hooks/useStore";

export default function DownloadPage() {
  const mediaInfo = useStore((s) => s.mediaInfo);
  const downloads = useStore((s) => s.downloads);
  const isPlaylist = mediaInfo?.is_playlist === true;
  const showDownloadControls = mediaInfo && !isPlaylist;
  const queueRef = useRef(null);
  const prevLen = useRef(downloads.length);

  useEffect(() => {
    if (downloads.length > prevLen.current) {
      queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevLen.current = downloads.length;
  }, [downloads.length]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Download size={18} className="text-accent" />
          <h1 className="text-2xl font-bold text-text-primary font-serif tracking-tight">
            Download
          </h1>
        </div>
        <p className="text-sm text-text-dim ml-[30px]">
          Paste any URL - supports 1000+ platforms
        </p>
        <div className="sl-divider-gradient mt-4" />
      </div>

      <div className="space-y-6">
        <div className="min-w-0">
          <URLInput />
        </div>

        {isPlaylist && (
          <div className="min-w-0">
            <PlaylistPanel />
          </div>
        )}

        {mediaInfo && !isPlaylist && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Column 1: Video Preview */}
            <div className="lg:col-span-7 xl:col-span-8 min-w-0">
              <MediaPreview />
            </div>

            {/* Column 2: Format selection, Options, & Download Button */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 min-w-0">
              <FormatPicker />
              <DownloadOptions />
              <DownloadButton />
            </div>
          </div>
        )}

        <div ref={queueRef} className="scroll-mt-8 min-w-0">
          <QueuePanel />
        </div>
      </div>
    </div>
  );
}
