import Layout from "@/components/Layout";
import Toast from "@/components/Toast";
import DownloadPage from "@/pages/DownloadPage";
import SettingsPage from "@/pages/SettingsPage";
import HistoryPage from "@/pages/HistoryPage";
import LiveLogs from "@/components/LiveLogs";
import useStore from "@/hooks/useStore";
import useWebSocket from "@/hooks/useWebSocket";

export default function App() {
  // Establish WebSocket connection
  useWebSocket();

  const activePage = useStore((s) => s.activePage);

  const renderLayoutContent = () => {
    switch (activePage) {
      case "download":
        return {
          content: <DownloadPage />,
          sidePanel: <LiveLogs />,
        };
      case "settings":
        return {
          content: <SettingsPage />,
          sidePanel: null,
        };
      case "history":
        return {
          content: <HistoryPage />,
          sidePanel: null,
        };
      default:
        return {
          content: <DownloadPage />,
          sidePanel: <LiveLogs />,
        };
    }
  };

  const { content, sidePanel } = renderLayoutContent();

  return (
    <>
      <Layout wide={activePage === "download"} sidePanel={sidePanel}>
        {content}
      </Layout>
      <Toast />
    </>
  );
}
