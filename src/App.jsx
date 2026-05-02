import Layout from "@/components/Layout";
import Toast from "@/components/Toast";
import DownloadPage from "@/pages/DownloadPage";
import SettingsPage from "@/pages/SettingsPage";
import HistoryPage from "@/pages/HistoryPage";
import useStore from "@/hooks/useStore";
import useWebSocket from "@/hooks/useWebSocket";

export default function App() {
  // Establish WebSocket connection
  useWebSocket();

  const activePage = useStore((s) => s.activePage);

  const renderPage = () => {
    switch (activePage) {
      case "download":
        return <DownloadPage />;
      case "settings":
        return <SettingsPage />;
      case "history":
        return <HistoryPage />;
      default:
        return <DownloadPage />;
    }
  };

  return (
    <>
      <Layout wide={activePage === "download"}>{renderPage()}</Layout>
      <Toast />
    </>
  );
}
