import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

const ICONS = {
  success: "✓",
  error: "✕",
  info: "○",
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
  const [renderedToast, setRenderedToast] = useState(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast) {
      setRenderedToast(toast);
      setIsExiting(false);
      return;
    }

    if (renderedToast) {
      setIsExiting(true);
      const timer = window.setTimeout(() => setRenderedToast(null), 180);
      return () => window.clearTimeout(timer);
    }
  }, [toast, renderedToast]);

  if (!renderedToast) return null;

  const handleDismiss = () => {
    setIsExiting(true);
    window.setTimeout(dismissToast, 180);
  };

  const icon = ICONS[renderedToast.type] || ICONS.info;

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", isExiting ? "sl-toast-exit" : "sl-toast-enter")}>
      <div
        className={cn(
          "relative flex items-start gap-3 px-4 py-3.5 rounded-md border shadow-lg backdrop-blur-sm overflow-hidden",
          "max-w-[380px] min-w-[280px]",
          STYLES[renderedToast.type] || STYLES.info,
          renderedToast.type === "error" && "border-l-2 border-l-status-red"
        )}
      >
        <span
          className={cn(
            "flex-shrink-0 mt-0.5 text-sm font-mono leading-none",
            ICON_COLORS[renderedToast.type] || ICON_COLORS.info
          )}
        >
          {icon}
        </span>
        <p
          className={cn(
            "text-sm leading-relaxed flex-1 font-sans",
            TEXT_COLORS[renderedToast.type] || TEXT_COLORS.info
          )}
        >
          {renderedToast.message}
        </p>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-0.5 text-text-dim hover:text-text-muted transition-colors"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
        <div
          className={cn(
            "absolute bottom-0 left-0 h-px animate-shrink-x",
            ICON_COLORS[renderedToast.type] || ICON_COLORS.info
          )}
          style={{ backgroundColor: "currentColor" }}
        />
      </div>
    </div>
  );
}
