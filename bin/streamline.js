#!/usr/bin/env bun

/**
 * Streamline CLI entry point.
 * Starts the server, provisions dependencies when needed, and opens the browser.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const ENV_FILE = join(homedir(), ".streamline", "env.json");
const PORT = parseInt(process.env.PORT || "7979", 10);
const PACKAGE_ROOT = join(import.meta.dir, "..");
const PACKAGE_JSON = join(PACKAGE_ROOT, "package.json");
const PROVISION_SCRIPT = join(PACKAGE_ROOT, "scripts", "provision.js");

// ANSI
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

function getPackageVersion() {
  try {
    return JSON.parse(readFileSync(PACKAGE_JSON, "utf-8")).version || "unknown";
  } catch {
    return "unknown";
  }
}

function printHelp() {
  console.log(`Streamline ${getPackageVersion()}

Usage:
  streamline-md [options]

Options:
  -h, --help       Show this help message
  -v, --version    Show the installed version

Environment:
  PORT             Server port to use (default: 7979)
`);
}

async function runProvision() {
  console.log(`  ${cyan("->")} Provisioning yt-dlp and ffmpeg...`);
  const provision = Bun.spawn([process.execPath, PROVISION_SCRIPT], {
    cwd: PACKAGE_ROOT,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await provision.exited;
  if (exitCode !== 0) {
    throw new Error("Provisioning failed. Go to Settings > Environment and click Repair.");
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--version") || args.includes("-v")) {
    console.log(getPackageVersion());
    return;
  }
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  console.log("");
  console.log(`  ${cyan("*")} ${bold("Streamline")}`);
  console.log("");

  let needsProvision = false;
  if (existsSync(ENV_FILE)) {
    try {
      const env = JSON.parse(readFileSync(ENV_FILE, "utf-8"));
      console.log(`  ${dim(">")} Reading ${dim(ENV_FILE)}`);

      if (env.pythonPath || env.venvPath) {
        console.log(`  ${green("OK")} Environment healthy`);
      } else {
        console.log(`  ${red("!")} Some dependencies may be missing`);
        needsProvision = true;
      }
    } catch {
      console.log(`  ${red("!")} Could not read env.json`);
      needsProvision = true;
    }
  } else {
    console.log(`  ${red("!")} No environment found at ${dim(ENV_FILE)}`);
    needsProvision = true;
  }

  if (needsProvision) {
    await runProvision();
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
        `  ${dim(">")} Port ${actualPort} is taken, trying ${actualPort + 1}...`
      );
      actualPort++;
    }
  }

  // Set port for the server
  process.env.PORT = String(actualPort);
  process.env.NODE_ENV = "production";

  // Start server
  console.log(`  ${cyan("->")} Starting server on port ${actualPort}...`);
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

    setTimeout(() => {
      Bun.spawn(openCmd, { stdout: "ignore", stderr: "ignore" });
    }, 1500);
  } catch {
    console.log(`  ${dim("Open in browser:")} ${url}`);
  }
}

main().catch((err) => {
  console.error(red(`\n  x Failed to start: ${err.message}\n`));
  process.exit(1);
});
