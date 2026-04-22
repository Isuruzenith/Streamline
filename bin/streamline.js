#!/usr/bin/env bun

/**
 * Streamline CLI entry point.
 * Starts the server and opens the browser.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const ENV_FILE = join(homedir(), ".streamline", "env.json");
const PORT = parseInt(process.env.PORT || "7979", 10);

// ANSI
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

async function main() {
  console.log("");
  console.log(`  ${cyan("◈")} ${bold("Streamline")}`);
  console.log("");

  // Check environment
  if (existsSync(ENV_FILE)) {
    try {
      const env = JSON.parse(readFileSync(ENV_FILE, "utf-8"));
      console.log(`  ${dim("▸")} Reading ${dim(ENV_FILE)}`);

      if (env.pythonPath || env.venvPath) {
        console.log(`  ${green("✓")} Environment healthy`);
      } else {
        console.log(`  ${red("⚠")} Some dependencies may be missing`);
        console.log(`  ${dim("  → Run")} bun scripts/provision.js ${dim("to repair")}`);
      }
    } catch {
      console.log(`  ${red("⚠")} Could not read env.json`);
    }
  } else {
    console.log(`  ${red("⚠")} No environment found at ${dim(ENV_FILE)}`);
    console.log(`  ${dim("  → Run")} bun scripts/provision.js ${dim("to set up")}`);
  }

  // Check port availability
  let actualPort = PORT;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const testServer = Bun.serve({
        port: actualPort,
        fetch: () => new Response(""),
      });
      testServer.stop();
      break;
    } catch {
      console.log(
        `  ${dim("▸")} Port ${actualPort} is taken, trying ${actualPort + 1}...`
      );
      actualPort++;
    }
  }

  // Set port for the server
  process.env.PORT = String(actualPort);
  process.env.NODE_ENV = "production";

  // Start server
  console.log(`  ${cyan("→")} Starting server on port ${actualPort}...`);
  console.log("");

  await import("../server/index.js");

  // Open browser
  const url = `http://localhost:${actualPort}`;
  try {
    const openCmd =
      process.platform === "win32"
        ? ["cmd", "/c", "start", url]
        : process.platform === "darwin"
          ? ["open", url]
          : ["xdg-open", url];

    Bun.spawn(openCmd, { stdout: "ignore", stderr: "ignore" });
  } catch {
    console.log(`  ${dim("Open in browser:")} ${url}`);
  }
}

main().catch((err) => {
  console.error(red(`\n  ✗ Failed to start: ${err.message}\n`));
  process.exit(1);
});
