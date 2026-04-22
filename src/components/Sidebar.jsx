import { Download, Settings, History, ChevronLeft } from "lucide-react";
import useStore from "@/hooks/useStore";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "download", label: "Download", icon: Download },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const activePage = useStore((s) => s.activePage);
  const setActivePage = useStore((s) => s.setActivePage);

  return (
    <aside className="w-[220px] border-r border-border flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0 select-none">
      {/* Logo */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-xl text-accent">◈</span>
          <span className="text-lg font-bold text-text-primary font-serif tracking-tight">
            Streamline
          </span>
        </div>
        <div className="text-2xs font-mono text-text-dim tracking-widest uppercase">
          Media Downloader
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-0 mb-3" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
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
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="text-2xs font-mono text-text-dim">v0.1.0</div>
      </div>
    </aside>
  );
}
