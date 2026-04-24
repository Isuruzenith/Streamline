import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: "border-status-green/30 bg-status-green-bg",
  error: "border-status-red/30 bg-status-red-bg",
  info: "border-border-accent bg-accent-glow",
};

const ICON_COLORS = {
  success: "text-status-green",
  error: "text-status-red",
  info: "text-accent",
};

const TEXT_COLORS = {
  success: "text-status-green/90",
  error: "text-status-red/90",
  info: "text-text-primary",
};

export default function Toast() {
  const toast = useStore((s) => s.toast);
  const dismissToast = useStore((s) => s.dismissToast);

  if (!toast) return null;

  const Icon = ICONS[toast.type] || ICONS.info;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={cn(
          "flex items-start gap-3 px-4 py-3.5 rounded-md border shadow-lg backdrop-blur-sm",
          "max-w-[380px] min-w-[280px]",
          STYLES[toast.type] || STYLES.info
        )}
      >
        <Icon
          size={16}
          className={cn(
            "flex-shrink-0 mt-0.5",
            ICON_COLORS[toast.type] || ICON_COLORS.info
          )}
        />
        <p
          className={cn(
            "text-sm leading-relaxed flex-1 font-sans",
            TEXT_COLORS[toast.type] || TEXT_COLORS.info
          )}
        >
          {toast.message}
        </p>
        <button
          onClick={dismissToast}
          className="flex-shrink-0 p-0.5 text-text-dim hover:text-text-muted transition-colors"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
