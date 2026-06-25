import Sidebar from "./Sidebar";
import useStore from "@/hooks/useStore";

export default function Layout({ children, wide = false }) {
  const activePage = useStore((s) => s.activePage);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div
          key={activePage}
          className={`sl-page-enter ${wide ? "max-w-[1480px] mx-auto px-4 md:px-6 lg:px-10 py-6 md:py-10 pb-28 md:pb-20" : "max-w-[720px] mx-auto px-4 md:px-12 py-6 md:py-10 pb-28 md:pb-20"}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
