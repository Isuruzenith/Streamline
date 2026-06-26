#!/usr/bin/env node

/**
 * Streamline CLI entry point.
 * Starts the server, provisions dependencies when needed, and opens the browser.
 * Runs under Node.js and automatically installs Bun runtime if missing.
 */

import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { spawn, execSync } from "child_process";
import { fileURLToPath } from "url";
import net from "net";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENV_FILE = join(homedir(), ".streamline", "env.json");
const PORT = parseInt(process.env.PORT || "7979", 10);
const PACKAGE_ROOT = join(__dirname, "..");
const PACKAGE_JSON = join(PACKAGE_ROOT, "package.json");
const PROVISION_SCRIPT = join(PACKAGE_ROOT, "scripts", "provision.js");

// ANSI
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;

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

function getBunExecutable() {
  // 1. Try running globally
  try {
    execSync("bun --version", { stdio: "ignore" });
    return "bun";
  } catch {}

  // 2. Try default local installation paths
  const home = homedir();
  const localBun = join(
    home,
    ".bun",
    "bin",
    process.platform === "win32" ? "bun.exe" : "bun"
  );

  if (existsSync(localBun)) {
    return localBun;
  }

  return null;
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function installBun() {
  console.log(`  ${cyan("->")} Installing Bun...`);
  try {
    if (process.platform === "win32") {
      execSync('powershell -c "irm bun.sh/install.ps1 | iex"', { stdio: "inherit" });
    } else {
      execSync("curl -fsSL https://bun.sh/install | bash", { stdio: "inherit" });
    }
    console.log(`  ${green("✓")} Bun installed successfully!`);
    return true;
  } catch (err) {
    console.error(red(`\n  x Failed to install Bun: ${err.message}`));
    return false;
  }
}

async function runProvision(bunBin) {
  console.log(`  ${cyan("->")} Provisioning yt-dlp and ffmpeg...`);
  const provision = spawn(bunBin, [PROVISION_SCRIPT], {
    cwd: PACKAGE_ROOT,
    stdio: "inherit",
  });

  return new Promise((resolve, reject) => {
    provision.on("close", (exitCode) => {
      if (exitCode !== 0) {
        reject(
          new Error("Provisioning failed. Go to Settings > Environment and click Repair.")
        );
      } else {
        resolve();
      }
    });
  });
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
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

  // 1. Resolve Bun runtime
  let bunBin = getBunExecutable();
  if (!bunBin) {
    console.log(`  ${yellow("!")} Bun runtime is required to run Streamline, but it was not found.`);
    const answer = await askQuestion("  Would you like to install Bun now? (Y/n): ");
    const norm = answer.trim().toLowerCase();
    const wantsInstall = norm === "y" || norm === "yes" || norm === "";

    if (wantsInstall) {
      const ok = installBun();
      if (ok) {
        bunBin = getBunExecutable();
      }
    }

    if (!bunBin) {
      console.log(
        red(`\n  x Bun is required to run Streamline. Please install it manually from https://bun.sh and try again.\n`)
      );
      process.exit(1);
    }
  }

  // 2. Check provisioning state
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
    await runProvision(bunBin);
  }

  // 3. Check port availability
  let actualPort = PORT;
  for (let attempt = 0; attempt < 10; attempt++) {
    const available = await isPortAvailable(actualPort);
    if (available) {
      break;
    } else {
      console.log(
        `  ${dim(">")} Port ${actualPort} is taken, trying ${actualPort + 1}...`
      );
      actualPort++;
    }
  }

  // 4. Start server using Bun
  console.log(`  ${cyan("->")} Starting server on port ${actualPort}...`);
  console.log("");

  const serverPath = join(PACKAGE_ROOT, "server", "index.js");
  const server = spawn(bunBin, [serverPath], {
    cwd: PACKAGE_ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(actualPort),
      NODE_ENV: "production",
    },
  });

  // 5. Open browser
  const url = `http://localhost:${actualPort}`;
  try {
    const openCmd =
      process.platform === "win32"
        ? ["cmd", "/c", "start", url]
        : process.platform === "darwin"
          ? ["open", url]
          : ["xdg-open", url];

    setTimeout(() => {
      spawn(openCmd[0], openCmd.slice(1), { stdio: "ignore", detached: true }).unref();
    }, 1500);
  } catch {
    console.log(`  ${dim("Open in browser:")} ${url}`);
  }

  server.on("close", (code) => {
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error(red(`\n  x Failed to start: ${err.message}\n`));
  process.exit(1);
});
