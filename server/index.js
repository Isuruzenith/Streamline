import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { existsSync } from "fs";
import { join } from "path";
import { envRoutes } from "./routes/env.js";
import { formatsRoutes } from "./routes/formats.js";
import { downloadRoutes } from "./routes/download.js";
import { historyRoutes } from "./routes/history.js";
import { cookieRoutes } from "./routes/cookies.js";
import { wsManager } from "./ws/handler.js";
import { cleanupExpiredDownloadTemps } from "./services/temp.js";

const PORT = parseInt(process.env.PORT || "7979", 10);
const IS_DEV = process.env.NODE_ENV !== "production";
const PROJECT_ROOT = import.meta.dir.replace(/[/\\]server$/, "");
const DIST_DIR = join(PROJECT_ROOT, "dist");
const TEMP_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

const app = new Elysia();

cleanupExpiredDownloadTemps();
setInterval(cleanupExpiredDownloadTemps, TEMP_CLEANUP_INTERVAL_MS);

// CORS in dev mode (Vite runs on a different port)
if (IS_DEV) {
  app.use(cors({ origin: true }));
}

// WebSocket upgrade
app.ws("/ws", {
  open(ws) {
    // ws.raw is the native ServerWebSocket; fall back to ws itself for older Elysia
    wsManager.addClient(ws.raw ?? ws);
  },
  close(ws) {
    wsManager.removeClient(ws.raw ?? ws);
  },
  message() {
    // client-to-server not used
  },
});

// API routes
envRoutes(app);
formatsRoutes(app);
downloadRoutes(app);
historyRoutes(app);
cookieRoutes(app);

// Serve built frontend in production
if (!IS_DEV && existsSync(DIST_DIR)) {
  // Serve static files from dist/
  app.get("/*", async ({ request }) => {
    const url = new URL(request.url);
    let filePath = join(DIST_DIR, url.pathname === "/" ? "index.html" : url.pathname);

    // If the file doesn't exist, serve index.html (SPA fallback)
    if (!existsSync(filePath)) {
      filePath = join(DIST_DIR, "index.html");
    }

    return new Response(Bun.file(filePath));
  });
}

// Start
app.listen(PORT, () => {
  console.log("");
  console.log("  ◈ Streamline server running");
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → WebSocket at ws://localhost:${PORT}/ws`);
  if (IS_DEV) {
    console.log("  → Dev mode: frontend at http://localhost:5173");
  }
  console.log("");
});

export default app;
