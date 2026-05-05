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
  const handleMessageRef = useRef(null);
  const pollRef = useRef(null);
  const updateDownload = useStore((s) => s.updateDownload);
  const appendLog = useStore((s) => s.appendLog);
  const appendProvisionLog = useStore((s) => s.appendProvisionLog);
  const clearProvisionLog = useStore((s) => s.clearProvisionLog);
  const fetchEnv = useStore((s) => s.fetchEnv);
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
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState < 2) wsRef.current.close();
    }

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
        handleMessageRef.current?.(msg);
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
        case "started":
          updateDownload(msg.downloadId, {
            status: "downloading",
            ...(msg.progress > 0 ? { progress: msg.progress } : {}),
          });
          break;

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

        case "paused":
          useStore.setState((s) => ({
            pausedDownloads: [
              ...s.pausedDownloads.filter((d) => d.downloadId !== msg.downloadId),
              { downloadId: msg.downloadId, progress: msg.progress ?? 0 },
            ],
          }));
          updateDownload(msg.downloadId, {
            status: "paused",
            progress: msg.progress ?? 0,
          });
          break;

        case "complete":
          useStore.setState((s) => ({
            pausedDownloads: s.pausedDownloads.filter((d) => d.downloadId !== msg.downloadId),
          }));
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
          useStore.setState((s) => ({
            pausedDownloads: s.pausedDownloads.filter((d) => d.downloadId !== msg.downloadId),
          }));
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
            const { activeDownloadId } = useStore.getState();
            if (!activeDownloadId) {
              useStore.setState({ activeDownloadId: msg.downloadId });
            }
          }
          break;

        case "env_status":
          useStore.setState({ env: msg.data });
          break;

        case "provision_log":
          if (msg.line) appendProvisionLog(msg.line);
          break;

        case "provision_done":
          useStore.setState({ envRepairing: false });
          fetchEnv();
          if (msg.success) {
            clearProvisionLog();
            showToast("Environment ready", "success");
          } else {
            showToast("Provisioning failed — check logs", "error");
          }
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
    [updateDownload, appendLog, appendProvisionLog, clearProvisionLog, fetchEnv, showToast, sendBrowserNotification]
  );

  useEffect(() => {
    handleMessageRef.current = handleMessage;
  }, [handleMessage]);

  const pollFallback = useCallback(() => {
    const { downloads, updateDownload, appendLog } = useStore.getState();
    const active = downloads.filter(
      (d) => d.status === "queued" || d.status === "downloading" || d.status === "merging"
    );
    if (active.length === 0) return;

    fetch("/api/download/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((status) => {
        if (!status) return;
        if (status.active?.downloadId) {
          updateDownload(status.active.downloadId, {
            status: status.active.status ?? "downloading",
            progress: status.active.progress ?? 0,
            speed: status.active.speed ?? null,
            eta: status.active.eta ?? null,
            filesize: status.active.filesize ?? null,
          });
        }

        [...(status.queue || status.queued || []), ...(status.completed || [])].forEach((job) => {
          if (job.downloadId) {
            updateDownload(job.downloadId, {
              status: job.status,
              progress: job.progress ?? (job.status === "complete" ? 100 : 0),
              speed: job.speed ?? null,
              eta: job.eta ?? null,
              filepath: job.filepath ?? null,
              error: job.error ?? null,
            });
            if (job.logLine) appendLog(job.downloadId, job.logLine);
          }
        });
      })
      .catch(() => {});
  }, []);

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
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        if (wsRef.current.readyState < 2) wsRef.current.close();
      }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        pollFallback();
      }
    }, 1500);
    return () => clearInterval(pollRef.current);
  }, [pollFallback]);
}
