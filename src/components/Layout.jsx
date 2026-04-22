import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-12 py-10 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
