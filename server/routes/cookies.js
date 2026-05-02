import { saveCookieFile, getCookieStatus, clearCookies, importCookiesFromBrowser } from "../services/cookies.js";

/**
 * Cookie management API routes.
 *
 * POST   /api/settings/cookies  — Upload a cookies.txt file
 * GET    /api/settings/cookies  — Check cookie file status
 * DELETE /api/settings/cookies  — Delete cookie file
 */
export function cookieRoutes(app) {
  // Import cookies directly from a local browser via yt-dlp.
  app.post("/api/settings/cookies/import", async ({ body }) => {
    try {
      const result = await importCookiesFromBrowser(body?.browser);
      return result;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }
  });

  // Upload cookies.txt
  app.post("/api/settings/cookies", async ({ request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: "No file uploaded" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validate it's a text file
      if (!file.name.endsWith(".txt")) {
        return new Response(
          JSON.stringify({ error: "Only .txt files are accepted" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const content = await file.text();

      // Basic validation: check it looks like a Netscape cookies file
      if (!content.includes("# Netscape HTTP Cookie File") && !content.includes("\t")) {
        return new Response(
          JSON.stringify({ error: "This doesn't look like a valid cookies.txt file. It should start with '# Netscape HTTP Cookie File'" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = saveCookieFile(content);
      return result;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });

  // Check cookie file status
  app.get("/api/settings/cookies", () => {
    return getCookieStatus();
  });

  // Clear cookie file
  app.delete("/api/settings/cookies", () => {
    return clearCookies();
  });
}
