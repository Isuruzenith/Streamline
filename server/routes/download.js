import { downloadQueue } from "../services/queue.js";

/**
 * Download API route.
 *
 * POST /api/download — Queue a new download
 * Body: { url, formatId?, preset?, downloadId }
 *
 * GET /api/download/status — Get queue status
 */
export function downloadRoutes(app) {
  app.post("/api/download", async ({ body }) => {
    const { url, formatId, preset, downloadId } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!downloadId) {
      return new Response(
        JSON.stringify({ error: "Missing 'downloadId' in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const result = downloadQueue.add({
        downloadId,
        url,
        formatId: formatId || null,
        preset: preset || "best",
      });

      return { success: true, ...result };
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });

  app.get("/api/download/status", () => {
    return downloadQueue.getStatus();
  });
}
