import { useEffect, useRef, useCallback } from "react";
import useStore from "./useStore";

/**
 * WebSocket hook — auto-connects to the Streamline backend and dispatches
 * progress/status events into the Zustand store.
 */
export default function useWebSocket() {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const updateDownload = useStore((s) => s.updateDownload);
  const appendLog = useStore((s) => s.appendLog);

  const connect = useCallback(() => {
    // Derive WS URL from current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[ws] connected");
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.onclose = () => {
      console.log("[ws] disconnected");
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  const handleMessage = useCallback(
    (msg) => {
      switch (msg.type) {
        case "progress":
          updateDownload(msg.downloadId, {
            status: "downloading",
            progress: msg.progress ?? 0,
            speed: msg.speed ?? null,
            eta: msg.eta ?? null,
            filesize: msg.filesize ?? null,
          });
          if (msg.line) appendLog(msg.downloadId, msg.line);
          break;

        case "merging":
          updateDownload(msg.downloadId, { status: "merging" });
          if (msg.line) appendLog(msg.downloadId, msg.line);
          break;

        case "complete":
          updateDownload(msg.downloadId, {
            status: "complete",
            progress: 100,
            filepath: msg.filepath ?? null,
          });
          break;

        case "error":
          updateDownload(msg.downloadId, {
            status: "error",
            error: msg.error ?? "Download failed",
          });
          break;

        case "log":
          if (msg.downloadId && msg.line) {
            appendLog(msg.downloadId, msg.line);
          }
          break;

        case "env_status":
          useStore.setState({ env: msg.data });
          break;

        default:
          break;
      }
    },
    [updateDownload, appendLog]
  );

  const scheduleReconnect = useCallback(() => {
    const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
    reconnectAttempts.current += 1;
    reconnectTimer.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);
}
