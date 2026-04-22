import { checkEnvironment } from "../services/environment.js";

/**
 * Environment API routes.
 *
 * GET  /api/env        — Returns dependency health status
 * POST /api/env/repair — Triggers re-provisioning
 */
export function envRoutes(app) {
  // Health check
  app.get("/api/env", async () => {
    try {
      const status = await checkEnvironment();
      return status;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });

  // Repair
  app.post("/api/env/repair", async () => {
    try {
      // Run the provision script
      const proc = Bun.spawn(["bun", "scripts/provision.js"], {
        cwd: import.meta.dir.replace(/[/\\]server[/\\]routes$/, ""),
        stdout: "pipe",
        stderr: "pipe",
      });

      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);

      const exitCode = await proc.exited;

      if (exitCode === 0) {
        // Re-check environment after repair
        const status = await checkEnvironment();
        return { success: true, env: status, log: stdout };
      } else {
        return new Response(
          JSON.stringify({ success: false, error: stderr || "Repair failed", log: stdout }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });
}
