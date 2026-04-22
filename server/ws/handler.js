import { downloadQueue } from "../services/queue.js";

/**
 * WebSocket handler — manages connected clients and broadcasts
 * download queue events to all of them.
 */
class WebSocketManager {
  constructor() {
    this.clients = new Set();

    // Subscribe to queue events and broadcast
    downloadQueue.subscribe((event) => {
      this.broadcast(event);
    });
  }

  addClient(ws) {
    this.clients.add(ws);
    console.log(`[ws] client connected (${this.clients.size} total)`);

    ws.addEventListener("close", () => {
      this.clients.delete(ws);
      console.log(`[ws] client disconnected (${this.clients.size} total)`);
    });

    ws.addEventListener("error", () => {
      this.clients.delete(ws);
    });
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      try {
        client.send(message);
      } catch {
        this.clients.delete(client);
      }
    }
  }
}

export const wsManager = new WebSocketManager();
