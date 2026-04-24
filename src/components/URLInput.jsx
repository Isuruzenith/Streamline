import { useState, useRef, useEffect } from "react";
import { Link2, Clipboard, Loader2, X } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

export default function URLInput() {
  const mediaUrl = useStore((s) => s.mediaUrl);
  const mediaLoading = useStore((s) => s.mediaLoading);
  const mediaError = useStore((s) => s.mediaError);
  const fetchMediaInfo = useStore((s) => s.fetchMediaInfo);
  const clearMedia = useStore((s) => s.clearMedia);
  const setMediaUrl = useStore((s) => s.setMediaUrl);

  const [inputValue, setInputValue] = useState(mediaUrl);
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValidUrl = (text) => /^https?:\/\/.+/.test(text?.trim());

  const handleSubmit = (e) => {
    e?.preventDefault();
    const url = inputValue.trim();
    if (!url) return;
    fetchMediaInfo(url);
  };

  // Handle native paste event (Ctrl+V / right-click paste)
  const handleNativePaste = (e) => {
    const pasted = e.clipboardData?.getData("text") || "";
    if (pasted && isValidUrl(pasted)) {
      // Let the paste complete, then auto-submit
      setTimeout(() => {
        setInputValue(pasted.trim());
        fetchMediaInfo(pasted.trim());
      }, 0);
    }
  };

  // Handle paste button click (clipboard API)
  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputValue(text.trim());
        if (isValidUrl(text)) {
          fetchMediaInfo(text.trim());
        }
      }
    } catch {
      // Clipboard API denied — user can paste manually
    }
  };

  const handleClear = () => {
    setInputValue("");
    clearMedia();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors">
          {mediaLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Link2 size={18} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id="url-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={handleNativePaste}
          onKeyDown={handleKeyDown}
          placeholder="Paste any URL — YouTube, Vimeo, Twitter, SoundCloud..."
          disabled={mediaLoading}
          className={cn(
            "w-full bg-surface border border-border rounded-md pl-11 pr-24 py-3.5",
            "text-base text-text-primary font-sans placeholder:text-text-dim",
            "focus:outline-none focus:border-border-accent focus:bg-surface-hover",
            "transition-all duration-200",
            "disabled:opacity-60",
            mediaError && "border-status-red/40"
          )}
        />

        {/* Action buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded text-text-dim hover:text-text-muted hover:bg-surface-hover transition-colors"
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={handlePasteButton}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono",
              "text-text-dim hover:text-accent hover:bg-accent-soft",
              "border border-border hover:border-border-accent",
              "transition-all duration-150"
            )}
          >
            <Clipboard size={12} />
            Paste
          </button>
        </div>
      </form>

      {/* Error message */}
      {mediaError && (
        <div className="mt-3 flex items-start gap-2 animate-slide-up">
          <div className="sl-dot sl-dot-red mt-1.5 flex-shrink-0" />
          <p className="text-sm text-status-red/80 leading-relaxed">
            {mediaError}
          </p>
        </div>
      )}

      {/* Keyboard hint */}
      {!mediaUrl && !mediaLoading && !inputValue && (
        <p className="mt-3 text-xs text-text-dim font-mono opacity-60">
          Paste a URL to auto-fetch · Enter to submit
        </p>
      )}
    </div>
  );
}
