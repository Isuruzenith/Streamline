import Sidebar from "./Sidebar";
import useStore from "@/hooks/useStore";

export default function Layout({ children, wide = false, sidePanel }) {
  const activePage = useStore((s) => s.activePage);
  const logsCollapsed = useStore((s) => s.logsCollapsed);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col xl:flex-row min-w-0">
        <main className="flex-1 min-w-0">
          <div
            key={activePage}
            className={`sl-page-enter ${
              wide
                ? "max-w-[1480px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-10 pb-28 md:pb-20"
                : "max-w-[720px] mx-auto px-4 md:px-12 py-6 md:py-10 pb-28 md:pb-20"
            }`}
          >
            {children}
            {sidePanel && <div className="block xl:hidden mt-8 min-w-0">{sidePanel}</div>}
          </div>
        </main>
        {sidePanel && (
          <aside
            className={`hidden xl:block flex-shrink-0 border-l border-border bg-surface/30 backdrop-blur-md sticky top-0 h-screen overflow-y-auto transition-all duration-300 ${
              logsCollapsed ? "w-14" : "w-[340px]"
            }`}
          >
            {sidePanel}
          </aside>
        )}
      </div>
    </div>
  );
}
