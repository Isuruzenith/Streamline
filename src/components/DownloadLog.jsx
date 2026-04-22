import { useState, useRef, useEffect } from "react";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

export default function DownloadLog({ downloadId }) {
  const [open, setOpen] = useState(false);
  const logRef = useRef(null);

  const log = useStore(
    (s) => s.downloads.find((d) => d.id === downloadId)?.log || []
  );

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (open && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log.length, open]);

  if (log.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-mono text-text-dim hover:text-text-muted transition-colors"
      >
        <Terminal size={12} />
        <span>{open ? "Hide" : "Show"} log</span>
        <span className="text-text-dim/50">({log.length} lines)</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div
          ref={logRef}
          className={cn(
            "mt-2 sl-log animate-slide-up",
            "whitespace-pre-wrap break-all"
          )}
        >
          {log.map((line, i) => (
            <div key={i} className="leading-relaxed">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
