import { downloadQueue } from "../services/queue.js";
import { historyService } from "../services/history.js";
import { homedir } from "os";
import { dirname, isAbsolute, join, relative, resolve } from "path";

const DEFAULT_DOWNLOAD_ROOT = join(homedir(), "Downloads", "Streamline");

function isInsidePath(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === "" || (!!rel && !rel.startsWith("..") && !isAbsolute(rel));
}

function isKnownDownloadedFile(filepath) {
  const resolvedFilepath = resolve(filepath);
  if (downloadQueue.hasKnownFilepath(resolvedFilepath)) return true;
  return historyService
    .list()
    .some((entry) => entry.filepath && resolve(entry.filepath) === resolvedFilepath);
}

function getOpenableFolder(filepath) {
  if (!filepath) {
    throw new Error("Missing 'filepath'");
  }

  const rawFilepath = String(filepath);
  if (/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(rawFilepath) || !isAbsolute(rawFilepath)) {
    throw new Error("Invalid filepath: must be an absolute local path");
  }

  const resolvedFilepath = resolve(rawFilepath);
  const folder = dirname(resolvedFilepath);

  if (!isInsidePath(DEFAULT_DOWNLOAD_ROOT, folder) && !isKnownDownloadedFile(resolvedFilepath)) {
    throw new Error("Access denied: filepath is outside Streamline downloads");
  }

  return folder;
}

export const __downloadRouteTest = {
  getOpenableFolder,
  isInsidePath,
};

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
    const {
      url,
      formatId,
      formatType,
      preset,
      downloadId,
      title,
      thumbnail,
      outputPath,
      filenameTemplate,
      options,
    } = body ?? {};

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
        formatType: formatType || null,
        preset: preset || "best-mp4",
        outputPath: outputPath || null,
        filenameTemplate: filenameTemplate || null,
        options: options || {},
      });

      return { success: true, ...result };
    } catch (err) {
      const status = err.message?.startsWith("Duplicate downloadId") ? 409 : 500;
      return new Response(
        JSON.stringify({ error: err.message }),
        { status, headers: { "Content-Type": "application/json" } }
      );
    }
  });

  // Get queue status
  app.get("/api/download/status", () => {
    const s = downloadQueue.getStatus();
    return Response.json(s);
  });

  // Resume a paused download
  app.post("/api/download/resume/:id", ({ params }) => {
    const resumed = downloadQueue.resume(params.id);
    return { success: resumed };
  });

  // Retry a failed download
  app.post("/api/download/retry", async ({ body }) => {
    const id = body?.id ?? null;
    if (!id) return new Response("Missing id", { status: 400 });
    const result = downloadQueue.retry(id);
    return Response.json({ ok: result });
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
      const folder = getOpenableFolder(filepath);
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
      const status = err.message?.startsWith("Access denied")
        ? 403
        : err.message?.startsWith("Invalid filepath") || err.message?.startsWith("Missing")
          ? 400
          : 500;
      return new Response(
        JSON.stringify({ error: err.message }),
        { status, headers: { "Content-Type": "application/json" } }
      );
    }
  });
}
