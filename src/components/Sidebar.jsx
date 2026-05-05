import { useEffect } from "react";
import { Download, Settings, Clock } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import pkg from "../../package.json";

const navItems = [
  { id: "download", label: "Download", icon: Download },
  { id: "history", label: "History", icon: Clock },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const activePage = useStore((s) => s.activePage);
  const setActivePage = useStore((s) => s.setActivePage);
  const downloads = useStore((s) => s.downloads);
  const clearMedia = useStore((s) => s.clearMedia);
  const toggleBatchMode = useStore((s) => s.toggleBatchMode);

  const activeCount = downloads.filter(
    (d) => d.status === "downloading" || d.status === "merging" || d.status === "queued"
  ).length;

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isMod = event.metaKey || event.ctrlKey;

      if (event.key === "Escape") {
        clearMedia();
        return;
      }

      if (isMod && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setActivePage("download");
        toggleBatchMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearMedia, setActivePage, toggleBatchMode]);

  return (
    <aside className="w-[220px] border-r border-border flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0 select-none">
      <div className="h-px bg-border-accent opacity-50 flex-shrink-0" />

      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <img
            src="/flameonlabs-icon.svg"
            alt=""
            className="h-7 w-7 rounded-sm border border-border-accent bg-background p-0.5"
          />
          <div className="min-w-0">
            <span className="block text-lg font-semibold text-text-primary font-serif tracking-tight leading-none">
              Streamline
            </span>
            <span className="block text-2xs font-mono text-accent tracking-widest uppercase leading-4">
              by FlameonLabs
            </span>
          </div>
        </div>
        <div className="text-2xs font-mono text-text-dim tracking-widest uppercase">
          Media Downloader
        </div>
      </div>

      <div className="h-px bg-border mx-0 mb-3" />

      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const showBadge = item.id === "download" && activeCount > 0;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActivePage(item.id)}
              className={cn("sl-nav-item", isActive && "sl-nav-item-active")}
            >
              <Icon
                size={15}
                className={cn(
                  "sl-nav-icon transition-colors",
                  isActive ? "text-nav-icon-active" : "text-nav-icon"
                )}
              />
              <span>{item.label}</span>
              {showBadge && (
                <span className="ml-auto sl-badge sl-badge-default text-2xs py-0">
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <kbd>Mod V</kbd>
          <kbd>Mod B</kbd>
          <kbd>Esc</kbd>
        </div>
        <div className="space-y-1 text-2xs font-mono text-text-dim">
          <div>v{pkg.version}</div>
          <div className="text-text-faint">FlameonLabs open source</div>
        </div>
      </div>
    </aside>
  );
}
