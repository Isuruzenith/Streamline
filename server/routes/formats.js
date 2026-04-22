import { getFormats } from "../services/ytdlp.js";

/**
 * Formats API route.
 *
 * GET /api/formats?url=<url> — Fetch media info + available formats
 */
export function formatsRoutes(app) {
  app.get("/api/formats", async ({ query }) => {
    const url = query.url;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' query parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const info = await getFormats(url);
      return info;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }
  });
}
