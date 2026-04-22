import Layout from "@/components/Layout";
import DownloadPage from "@/pages/DownloadPage";
import SettingsPage from "@/pages/SettingsPage";
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
      default:
        return <DownloadPage />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}
