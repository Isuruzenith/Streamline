import { exportCookies, getCookieStatus, clearCookies } from "../services/cookies.js";

/**
 * Cookie management API routes.
 *
 * POST   /api/cookies/export  — Export cookies from browser to file
 * GET    /api/cookies/status  — Check cookie file status
 * DELETE /api/cookies         — Delete cookie file
 */
export function cookieRoutes(app) {
  // Export cookies from a browser
  app.post("/api/cookies/export", async ({ body }) => {
    const { browser } = body;
    if (!browser) {
      return new Response(
        JSON.stringify({ error: "Missing 'browser' in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await exportCookies(browser);
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    return result;
  });

  // Check cookie file status
  app.get("/api/cookies/status", () => {
    return getCookieStatus();
  });

  // Clear cookie file
  app.delete("/api/cookies", () => {
    return clearCookies();
  });
}
