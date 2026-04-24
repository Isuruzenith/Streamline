import { getFormats, detectPlaylist, getPlaylistInfo } from "../services/ytdlp.js";

/**
 * Formats API routes.
 *
 * GET /api/formats?url=<url>           — Fetch media info + available formats
 * GET /api/formats/playlist?url=<url>  — Fetch playlist info with entries
 */
export function formatsRoutes(app) {
  app.get("/api/formats", async ({ query }) => {
    const url = query.url;
    const cookieBrowser = query.cookieBrowser || null;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' query parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      // First check if it's a playlist
      const isPlaylist = await detectPlaylist(url, { cookieBrowser });

      if (isPlaylist) {
        const playlistInfo = await getPlaylistInfo(url, { cookieBrowser });
        return playlistInfo;
      }

      // Single video
      const info = await getFormats(url, { cookieBrowser });
      return info;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }
  });

  // Explicit playlist endpoint
  app.get("/api/formats/playlist", async ({ query }) => {
    const url = query.url;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' query parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const info = await getPlaylistInfo(url);
      return info;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }
  });
}
