import { useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

const DEPS = [
  {
    key: "python",
    label: "Python (bundled)",
    icon: "🐍",
    okNote: "Streamline's own isolated Python. System Python is never used.",
    failNote: "Bundled Python is missing or damaged. Click Repair to re-download (~60MB).",
  },
  {
    key: "ytdlp",
    label: "yt-dlp",
    icon: "⬇",
    okNote: "Installed inside Streamline's venv.",
    failNote: "Click Repair to reinstall yt-dlp inside ~/.streamline/venv.",
  },
  {
    key: "ffmpeg",
    label: "ffmpeg",
    icon: "🎞",
    okNote: "Static binary bundled via imageio[ffmpeg]. Used for merging streams and format conversion.",
    failNote: "Click Repair to reinstall ffmpeg via imageio[ffmpeg] inside the venv.",
  },
];

export default function EnvironmentPanel() {
  const env = useStore((s) => s.env);
  const envLoading = useStore((s) => s.envLoading);
  const envRepairing = useStore((s) => s.envRepairing);
  const fetchEnv = useStore((s) => s.fetchEnv);
  const repairEnv = useStore((s) => s.repairEnv);

  useEffect(() => {
    fetchEnv();
  }, []);

  const hasErrors = env && Object.values(env).some((dep) => !dep.ok);

  if (envLoading && !env) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center text-text-dim">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm font-mono">Checking environment...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header description */}
      <div className="sl-card sl-card-accent mb-5">
        <p className="text-sm+ text-text-muted leading-relaxed">
          Because{" "}
          <code className="sl-code">bun install -g streamline</code> handles all
          provisioning automatically, there is{" "}
          <strong className="text-accent font-semibold">no setup wizard</strong>.
          This panel shows the health of each dependency.
        </p>
      </div>

      {/* Repair button */}
      {hasErrors && (
        <button
          id="repair-btn"
          onClick={repairEnv}
          disabled={envRepairing}
          className="sl-btn sl-btn-primary mb-5 w-full py-3"
        >
          {envRepairing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Repairing...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Repair Environment
            </>
          )}
        </button>
      )}

      {/* Dependency rows */}
      <div className="space-y-2">
        {DEPS.map((dep) => {
          const status = env?.[dep.key];
          const isOk = status?.ok;
          const version = status?.version;
          const path = status?.path;

          return (
            <div
              key={dep.key}
              className={cn(
                "flex items-start gap-3.5 p-4 rounded-md border transition-colors",
                "bg-surface border-border"
              )}
            >
              {/* Icon */}
              <span className="text-lg mt-0.5">{dep.icon}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Label + status */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-base font-semibold text-text-secondary font-serif">
                    {dep.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {isOk ? (
                      <div className="sl-dot sl-dot-green" />
                    ) : (
                      <div className="sl-dot sl-dot-red" />
                    )}
                  </div>
                </div>

                {/* Version / error info */}
                <div
                  className={cn(
                    "text-sm font-mono mb-1",
                    isOk ? "text-status-green" : "text-status-red"
                  )}
                >
                  {isOk
                    ? `${version || "installed"}${path ? ` · ${path}` : ""}`
                    : status?.error || "Not found"}
                </div>

                {/* Note */}
                <p className="text-xs text-text-dim leading-relaxed">
                  {isOk ? dep.okNote : dep.failNote}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh button */}
      <button
        onClick={fetchEnv}
        disabled={envLoading}
        className="sl-btn sl-btn-ghost mt-4 text-xs"
      >
        {envLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <RefreshCw size={12} />
        )}
        Refresh status
      </button>
    </div>
  );
}
