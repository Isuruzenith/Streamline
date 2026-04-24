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
  const hasConnectedOnce = useRef(false);
  const updateDownload = useStore((s) => s.updateDownload);
  const appendLog = useStore((s) => s.appendLog);
  const showToast = useStore((s) => s.showToast);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: "/favicon.svg" });
      } catch { /* not supported */ }
    }
  }, []);

  const connect = useCallback(() => {
    // Derive WS URL from current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let host = window.location.host;

    // In development, the backend runs on port 7979 while the frontend runs on 5173 (Vite)
    if (host.includes(":5173")) {
      host = host.replace(":5173", ":7979");
    }

    const url = `${protocol}//${host}/ws`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      hasConnectedOnce.current = true;
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
      if (hasConnectedOnce.current) {
        console.log("[ws] disconnected");
      }
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
          showToast(
            `Download complete — ${msg.title || "file ready"}`,
            "success"
          );
          sendBrowserNotification(
            "Download Complete",
            msg.title || "Your file is ready"
          );
          break;

        case "error":
          updateDownload(msg.downloadId, {
            status: "error",
            error: msg.error ?? "Download failed",
          });
          showToast(
            `Download failed — ${msg.error || "unknown error"}`,
            "error"
          );
          break;

        case "log":
          if (msg.downloadId && msg.line) {
            appendLog(msg.downloadId, msg.line);
          }
          break;

        case "env_status":
          useStore.setState({ env: msg.data });
          break;

        case "removed":
        case "queue_update":
        case "queue_reorder":
          // Queue state managed by store directly
          break;

        default:
          break;
      }
    },
    [updateDownload, appendLog, showToast, sendBrowserNotification]
  );

  const scheduleReconnect = useCallback(() => {
    const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
    reconnectAttempts.current += 1;
    reconnectTimer.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    // Small initial delay to let the backend finish starting in dev
    const initialTimer = setTimeout(() => connect(), 300);
    return () => {
      clearTimeout(initialTimer);
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);
}
