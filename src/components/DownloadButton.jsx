import { Download, Loader2, CheckCircle2 } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

export default function DownloadButton() {
  const mediaInfo = useStore((s) => s.mediaInfo);
  const mediaLoading = useStore((s) => s.mediaLoading);
  const startDownload = useStore((s) => s.startDownload);
  const downloads = useStore((s) => s.downloads);
  const activeDownloadId = useStore((s) => s.activeDownloadId);
  const selectedPreset = useStore((s) => s.selectedPreset);
  const selectedFormatId = useStore((s) => s.selectedFormatId);

  const activeDownload = downloads.find((d) => d.id === activeDownloadId);
  const isAnyDownloading = downloads.some(
    (d) => d.status === "downloading" || d.status === "merging"
  );
  const isDownloading = isAnyDownloading;
  const isComplete = activeDownload?.status === "complete";
  const hasFormatSelection = !!selectedPreset || !!selectedFormatId;
  const disabled = !mediaInfo || mediaLoading || isAnyDownloading || !hasFormatSelection;

  const handleClick = () => {
    if (disabled) return;
    startDownload();
  };

  return (
    <div className="animate-slide-up">
      <button
        id="download-btn"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "sl-btn w-full py-3.5 rounded-md text-md font-semibold transition-all duration-300",
          isComplete
            ? "bg-status-green/20 text-status-green border border-status-green/30"
            : isDownloading
              ? "bg-accent/10 text-accent border border-accent/20 cursor-wait"
              : "sl-btn-primary"
        )}
      >
        {isDownloading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Downloading...</span>
          </>
        ) : isComplete ? (
          <>
            <CheckCircle2 size={18} />
            <span>Download Complete</span>
          </>
        ) : (
          <>
            <Download size={18} />
            <span>{hasFormatSelection ? "Download" : "Choose Format"}</span>
          </>
        )}
      </button>
    </div>
  );
}
