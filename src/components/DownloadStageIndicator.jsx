import { Loader2, Merge, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "queued", label: "Queued", icon: Clock },
  { key: "downloading", label: "Download", icon: Loader2 },
  { key: "merging", label: "Merge", icon: Merge },
  { key: "complete", label: "Done", icon: CheckCircle2 },
];

const STATUS_ORDER = { queued: 0, downloading: 1, merging: 2, complete: 3, error: 3 };

export default function DownloadStageIndicator({ status }) {
  const currentIndex = STATUS_ORDER[status] ?? 0;
  const isError = status === "error";

  return (
    <div className="flex items-center gap-1" aria-label={`Download stage: ${status}`}>
      {STAGES.map((stage, index) => {
        const Icon = stage.icon;
        const past = index < currentIndex;
        const current = index === currentIndex && !isError;
        const error = isError && index === currentIndex;
        const future = index > currentIndex;

        return (
          <div key={stage.key} className="flex items-center gap-1">
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-4 rounded transition-colors duration-300",
                  past ? "bg-accent/60" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-2sm text-2xs font-mono transition-all duration-200",
                past && "text-text-dim",
                current && "text-accent bg-accent-soft border border-border-accent",
                error && "text-status-red bg-status-red-bg border border-status-red/20",
                future && "text-text-dim/40"
              )}
            >
              <Icon
                size={10}
                className={cn(current && stage.key === "downloading" && "animate-spin")}
              />
              <span className="hidden sm:inline">{stage.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
