import { checkEnvironment, resolvePythonBin } from "../services/environment.js";

const UPDATE_PACKAGES = {
  ytdlp: "yt-dlp[default,curl-cffi]",
  ffmpeg: "imageio[ffmpeg]",
};

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

  app.post("/api/env/update", async ({ body }) => {
    const dependency = String(body?.dependency || "").toLowerCase();
    const pkg = UPDATE_PACKAGES[dependency];

    if (!pkg) {
      return new Response(
        JSON.stringify({ error: "Unsupported dependency. Use ytdlp or ffmpeg." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const pythonBin = resolvePythonBin();
      const proc = Bun.spawn([pythonBin, "-m", "pip", "install", "--upgrade", pkg], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        return new Response(
          JSON.stringify({ success: false, error: stderr || stdout || "Update failed" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return { success: true, env: await checkEnvironment(), log: stdout };
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });

  app.get("/api/env/updates", async () => {
    try {
      const pythonBin = resolvePythonBin();
      const proc = Bun.spawn([
        pythonBin,
        "-m",
        "pip",
        "list",
        "--outdated",
        "--format=json",
      ], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        return new Response(
          JSON.stringify({ error: stderr || "Could not check updates" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const outdated = JSON.parse(stdout || "[]");
      const relevant = outdated.filter((pkg) =>
        ["yt-dlp", "imageio", "imageio-ffmpeg"].includes(pkg.name)
      );

      return { outdated: relevant };
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });
}
