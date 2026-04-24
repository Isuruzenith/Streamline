import { historyService } from "../services/history.js";

/**
 * History API routes.
 *
 * GET    /api/history      — List download history
 * DELETE /api/history      — Clear all history
 * DELETE /api/history/:id  — Remove single entry
 */
export function historyRoutes(app) {
  app.get("/api/history", () => {
    return historyService.list();
  });

  app.delete("/api/history", () => {
    historyService.clear();
    return { success: true };
  });

  app.delete("/api/history/:id", ({ params }) => {
    historyService.remove(params.id);
    return { success: true };
  });
}
