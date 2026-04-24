import { downloadQueue } from "../services/queue.js";

/**
 * WebSocket handler — manages connected clients and broadcasts
 * download queue events to all of them.
 */
export const wsManager = {
  clients: new Set(),

  init() {
    // Subscribe to queue events and broadcast
    downloadQueue.subscribe((event) => {
      this.broadcast(event);
    });
  },

  addClient(ws) {
    this.clients.add(ws);
  },

  removeClient(ws) {
    this.clients.delete(ws);
  },

  broadcast(data) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    for (const client of this.clients) {
      try {
        client.send(msg);
      } catch {
        this.clients.delete(client); // auto-clean dead sockets
      }
    }
  },
};

// Initialize subscription
wsManager.init();
