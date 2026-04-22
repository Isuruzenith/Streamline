import { FolderOpen, FileText } from "lucide-react";
import useStore from "@/hooks/useStore";
import EnvironmentPanel from "@/components/EnvironmentPanel";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "general", label: "General" },
  { id: "environment", label: "Environment" },
];

export default function SettingsPage() {
  const settingsTab = useStore((s) => s.settingsTab);
  const setSettingsTab = useStore((s) => s.setSettingsTab);
  const outputPath = useStore((s) => s.outputPath);
  const setOutputPath = useStore((s) => s.setOutputPath);
  const filenameTemplate = useStore((s) => s.filenameTemplate);
  const setFilenameTemplate = useStore((s) => s.setFilenameTemplate);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl text-accent">⚙</span>
          <h1 className="text-2xl font-bold text-text-primary font-serif tracking-tight">
            Settings
          </h1>
        </div>
        <div className="h-px bg-border" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`settings-tab-${tab.id}`}
            onClick={() => setSettingsTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              settingsTab === tab.id
                ? "text-text-primary"
                : "text-text-dim hover:text-text-muted"
            )}
          >
            {tab.label}
            {settingsTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {settingsTab === "general" && (
        <div className="animate-fade-in space-y-6">
          {/* Output path */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary font-serif mb-2">
              Output folder
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                placeholder="~/Downloads (default)"
                className="sl-input flex-1"
              />
              <button className="sl-btn sl-btn-outline">
                <FolderOpen size={15} />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-text-dim">
              Leave empty to use system Downloads folder
            </p>
          </div>

          {/* Filename template */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary font-serif mb-2">
              Filename template
            </label>
            <input
              type="text"
              value={filenameTemplate}
              onChange={(e) => setFilenameTemplate(e.target.value)}
              className="sl-input font-mono text-sm"
            />
            <p className="mt-1.5 text-xs text-text-dim">
              Uses yt-dlp output template syntax.{" "}
              <code className="sl-code text-2xs">%(title)s</code>,{" "}
              <code className="sl-code text-2xs">%(ext)s</code>,{" "}
              <code className="sl-code text-2xs">%(uploader)s</code>, etc.
            </p>
            {/* Live preview */}
            <div className="mt-2 p-2.5 bg-surface rounded border border-border">
              <div className="text-xs font-mono text-text-dim">Preview:</div>
              <div className="text-sm font-mono text-text-muted mt-1">
                {filenameTemplate
                  .replace("%(title)s", "Rick Astley - Never Gonna Give You Up")
                  .replace("%(ext)s", "mp4")
                  .replace("%(uploader)s", "Rick Astley")
                  .replace("%(id)s", "dQw4w9WgXcQ")}
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsTab === "environment" && <EnvironmentPanel />}
    </div>
  );
}
