import { downloadQueue } from "../services/queue.js";
import { dirname } from "path";

/**
 * Download API routes.
 *
 * POST   /api/download             — Queue a new download
 * GET    /api/download/status      — Get queue status
 * DELETE /api/download/:id         — Cancel/remove from queue
 * PATCH  /api/download/reorder     — Reorder queue
 * POST   /api/download/open-folder — Open file's folder in OS file manager
 */
export function downloadRoutes(app) {
  // Queue a new download
  app.post("/api/download", async ({ body }) => {
    const { url, formatId, preset, downloadId, title, thumbnail, outputPath, filenameTemplate, cookieBrowser } = body;

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
        title: title || null,
        thumbnail: thumbnail || null,
        formatId: formatId || null,
        preset: preset || "best",
        outputPath: outputPath || null,
        filenameTemplate: filenameTemplate || null,
        cookieBrowser: cookieBrowser || null,
      });

      return { success: true, ...result };
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });

  // Get queue status
  app.get("/api/download/status", () => {
    return downloadQueue.getStatus();
  });

  // Cancel/remove a download
  app.delete("/api/download/:id", ({ params }) => {
    const removed = downloadQueue.cancel(params.id);
    return { success: removed };
  });

  // Reorder queue
  app.patch("/api/download/reorder", ({ body }) => {
    const { downloadId, newIndex } = body;
    if (!downloadId || newIndex === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing downloadId or newIndex" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const reordered = downloadQueue.reorder(downloadId, newIndex);
    return { success: reordered };
  });

  // Open folder containing a downloaded file
  app.post("/api/download/open-folder", async ({ body }) => {
    const { filepath } = body;
    if (!filepath) {
      return new Response(
        JSON.stringify({ error: "Missing 'filepath'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const folder = dirname(filepath);
      const platform = process.platform;
      let cmd;
      let args;

      if (platform === "win32") {
        cmd = "explorer";
        args = [folder];
      } else if (platform === "darwin") {
        cmd = "open";
        args = [folder];
      } else {
        cmd = "xdg-open";
        args = [folder];
      }

      Bun.spawn([cmd, ...args], {
        stdout: "ignore",
        stderr: "ignore",
      });

      return { success: true };
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });
}
