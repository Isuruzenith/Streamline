import { useState, useRef, useEffect, useMemo } from "react";
import { Link2, Clipboard, Loader2, X, Rows3, Plus } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { name: "YouTube", color: "#ff4444", icon: "▶" },
  { name: "TikTok", color: "#69c9d0", icon: "♪" },
  { name: "Instagram", color: "#e1306c", icon: "◈" },
  { name: "Facebook", color: "#1877f2", icon: "f" },
  { name: "Twitter/X", color: "#8b8b8b", icon: "✕" },
  { name: "+ 1000 more", color: "#5a5a6a", icon: "…" },
];

const parseBatchUrls = (text) =>
  text
    .split(/[\n,\s]+/)
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\/.+/.test(url));

function debounce(fn, delay) {
  let timeoutId;
  const debounced = (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => window.clearTimeout(timeoutId);
  return debounced;
}

export default function URLInput() {
  const mediaUrl = useStore((s) => s.mediaUrl);
  const mediaLoading = useStore((s) => s.mediaLoading);
  const mediaError = useStore((s) => s.mediaError);
  const batchMode = useStore((s) => s.batchMode);
  const fetchMediaInfo = useStore((s) => s.fetchMediaInfo);
  const clearMedia = useStore((s) => s.clearMedia);
  const setBatchMode = useStore((s) => s.setBatchMode);
  const startBatchDownload = useStore((s) => s.startBatchDownload);

  const [inputValue, setInputValue] = useState(mediaUrl);
  const [batchInput, setBatchInput] = useState("");
  const [validationError, setValidationError] = useState(null);
  const inputRef = useRef(null);
  const batchRef = useRef(null);
  const prewarmUrl = useMemo(
    () =>
      debounce((url) => {
        if (/^https?:\/\/.{5,}/.test(url)) {
          fetch(`/api/formats?url=${encodeURIComponent(url)}`).catch(() => {});
        }
      }, 600),
    []
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleFocus = async () => {
    if (inputValue) return;
    try {
      const text = await navigator.clipboard.readText();
      if (/^https?:\/\/.+/.test(text.trim())) {
        setInputValue(text.trim());
      }
    } catch {
      // Clipboard permission denied - silent fail
    }
  };

  useEffect(() => () => prewarmUrl.cancel(), [prewarmUrl]);

  useEffect(() => {
    if (batchMode) {
      batchRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [batchMode]);

  const isValidUrl = (text) => /^https?:\/\/.+/.test(text?.trim());

  const validateAndFetch = (value) => {
    const url = value.trim();
    let parsed;

    try {
      parsed = new URL(url);
    } catch {
      setValidationError("Please enter a valid URL");
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setValidationError("Only http and https URLs are supported");
      return;
    }

    setValidationError(null);
    fetchMediaInfo(url);
  };

  const handleQueueAll = async () => {
    const urls = parseBatchUrls(batchInput);
    if (urls.length === 0) {
      setValidationError("Paste at least one valid URL");
      return;
    }

    setValidationError(null);
    await startBatchDownload(urls);
    setBatchInput("");
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (batchMode) {
      handleQueueAll();
      return;
    }
    validateAndFetch(inputValue);
  };

  const handleNativePaste = (e) => {
    const pasted = e.clipboardData?.getData("text") || "";
    if (!batchMode && pasted && isValidUrl(pasted)) {
      setTimeout(() => {
        const trimmed = pasted.trim();
        setInputValue(trimmed);
        validateAndFetch(trimmed);
      }, 0);
    }
  };

  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const trimmed = text.trim();
      if (batchMode) {
        setBatchInput(trimmed);
      } else {
        setInputValue(trimmed);
        validateAndFetch(trimmed);
      }
    } catch {
      // Clipboard API denied. The user can paste manually.
    }
  };

  const handleClear = () => {
    setInputValue("");
    setBatchInput("");
    setValidationError(null);
    clearMedia();
    (batchMode ? batchRef : inputRef).current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!batchMode && e.key === "Enter") handleSubmit();
  };

  const detectedUrls = parseBatchUrls(batchInput);
  const hasInput = batchMode ? batchInput.trim().length > 0 : inputValue.trim().length > 0;

  const renderActionButtons = () => (
    <div className="flex items-center gap-1">
      {hasInput && (
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
      <button
        type="button"
        onClick={() => {
          setValidationError(null);
          setBatchMode(!batchMode);
        }}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono",
          "border transition-all duration-150",
          batchMode
            ? "text-accent bg-accent-soft border-border-accent"
            : "text-text-dim hover:text-accent hover:bg-accent-soft border-border hover:border-border-accent"
        )}
      >
        <Rows3 size={12} />
        Batch
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="group sl-url-focus-ring rounded-md">
        {batchMode ? (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-text-dim">
                {detectedUrls.length} URL{detectedUrls.length !== 1 ? "s" : ""} detected
              </span>
              {renderActionButtons()}
            </div>
            <div className="relative">
              <textarea
                ref={batchRef}
                id="url-input"
                value={batchInput}
                onChange={(e) => {
                  setBatchInput(e.target.value);
                  setValidationError(null);
                }}
                rows={5}
                placeholder={"Paste multiple URLs, one per line:\nhttps://youtube.com/watch?v=...\nhttps://tiktok.com/@user/video/..."}
                className={cn(
                  "w-full bg-surface border border-border rounded-md p-3 pr-28 text-base text-text-primary",
                  "font-mono placeholder:text-text-dim focus:outline-none focus:border-border-accent",
                  "focus:bg-surface-hover resize-none transition-all",
                  (validationError || mediaError) && "border-status-red/40"
                )}
              />
              <span className="absolute bottom-3 right-3 text-xs font-mono text-accent opacity-70">
                {detectedUrls.length} URL{detectedUrls.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={detectedUrls.length === 0}
                className="sl-btn sl-btn-primary text-sm py-2 px-4"
              >
                <Plus size={14} />
                Queue All
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors">
              {mediaLoading ? <Loader2 size={18} className="animate-spin" /> : <Link2 size={18} />}
            </div>

            <input
              ref={inputRef}
              id="url-input"
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setValidationError(null);
                prewarmUrl(e.target.value);
              }}
              onPaste={handleNativePaste}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder="Paste any URL - YouTube, TikTok, Instagram, Twitter/X..."
              disabled={mediaLoading}
              className={cn(
                "w-full bg-surface border border-border rounded-md pl-11 pr-52 py-3",
                "text-base text-text-primary font-sans placeholder:text-text-dim",
                "focus:outline-none focus:border-border-accent focus:bg-surface-hover",
                "transition-all duration-200",
                "disabled:opacity-60",
                (validationError || mediaError) && "border-status-red/40"
              )}
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {renderActionButtons()}
            </div>
          </div>
        )}
      </form>

      {(validationError || mediaError) && (
        <div className="mt-3 flex items-start gap-2 animate-slide-up">
          <div className="sl-dot sl-dot-red mt-1.5 flex-shrink-0" />
          <p className="text-sm text-status-red/80 leading-relaxed">
            {validationError || mediaError}
          </p>
        </div>
      )}

      {!hasInput && !mediaLoading && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PLATFORMS.map((platform) => (
            <span
              key={platform.name}
              title="Supported platform"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-2sm text-xs font-mono border border-border text-text-dim hover:text-text-muted transition-colors cursor-help select-none"
            >
              <span style={{ color: platform.color, fontSize: "9px" }}>{platform.icon}</span>
              {platform.name}
            </span>
          ))}
        </div>
      )}

      {!mediaUrl && !mediaLoading && !hasInput && (
        <p className="mt-3 text-xs text-text-dim font-mono opacity-60">
          Paste a URL to auto-fetch · Enter to submit
        </p>
      )}
    </div>
  );
}
