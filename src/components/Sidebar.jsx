import { useEffect } from "react";
import { Download, Settings, Clock, Moon, Sun, Keyboard } from "lucide-react";
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
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

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
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] border-r border-border bg-sidebar flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0 select-none">
        <div className="h-px bg-border-accent opacity-50 flex-shrink-0" />

        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <img
              src="/favicon.svg"
              alt=""
              className="h-7 w-7 rounded-sm border border-border-accent bg-background p-0.5"
            />
            <div className="min-w-0">
              <span className="block text-lg font-semibold text-text-primary font-serif tracking-tight leading-none">
                Streamline
              </span>
            </div>
          </div>
          <div className="text-2xs font-mono text-text-dim tracking-widest uppercase mt-1">
            Media Downloader
          </div>
          {/* Gradient underline */}
          <div className="sl-divider-gradient mt-3" />
        </div>

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

        <div className="sl-sidebar-footer">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-dim transition-all duration-200 hover:border-border-accent hover:text-accent hover:bg-surface-hover hover:scale-110"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="flex items-center gap-1.5" title="Mod+V: Paste  ·  Mod+B: Batch  ·  Esc: Clear">
              <Keyboard size={12} className="text-text-dim" />
              <div className="flex gap-1">
                <kbd>⌘V</kbd>
                <kbd>⌘B</kbd>
                <kbd>Esc</kbd>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-2xs font-mono text-text-dim">
            <span>v{pkg.version}</span>
            <span className="text-text-faint">·</span>
            <span className="text-text-faint">Open Source</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-sidebar/85 backdrop-blur-md border-t border-border flex items-center justify-around px-4 z-40 select-none pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const showBadge = item.id === "download" && activeCount > 0;

          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActivePage(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full gap-1 text-text-dim transition-colors duration-150",
                isActive ? "text-accent" : "hover:text-text-secondary"
              )}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-accent" : "text-text-dim"
                  )}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-background leading-none">
                    {activeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}

        {/* Mobile Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-text-dim hover:text-text-secondary transition-colors duration-150"
        >
          {theme === "dark" ? <Sun size={20} className="text-text-dim" /> : <Moon size={20} className="text-text-dim" />}
          <span className="text-[10px] font-medium tracking-wide">Theme</span>
        </button>
      </nav>
    </>
  );
}
