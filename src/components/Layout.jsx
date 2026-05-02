import Sidebar from "./Sidebar";

export default function Layout({ children, wide = false }) {
  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className={wide ? "max-w-[1480px] mx-auto px-6 lg:px-10 py-10 pb-20" : "max-w-[720px] mx-auto px-12 py-10 pb-20"}>
          {children}
        </div>
      </main>
    </div>
  );
}
