#!/usr/bin/env bun

/**
 * Streamline Provisioning Script
 *
 * Automatically downloads and installs:
 * 1. python-build-standalone (Python 3.11)
 * 2. Creates isolated venv
 * 3. Installs yt-dlp
 * 4. Installs ffmpeg via imageio
 * 5. Writes ~/.streamline/env.json
 *
 * This script is idempotent — safe to re-run.
 */

import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

const STREAMLINE_DIR = join(homedir(), ".streamline");
const PYTHON_DIR = join(STREAMLINE_DIR, "python");
const VENV_DIR = join(STREAMLINE_DIR, "venv");
const ENV_FILE = join(STREAMLINE_DIR, "env.json");

// ANSI colors
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

/**
 * Get python-build-standalone download URL for current platform.
 */
function getPBSUrl() {
  const platform = process.platform;
  const arch = process.arch;
  const version = "3.11.9";
  const tag = "20241016";

  const matrix = {
    "win32-x64": `cpython-${version}+${tag}-x86_64-pc-windows-msvc-install_only.tar.gz`,
    "win32-arm64": `cpython-${version}+${tag}-aarch64-pc-windows-msvc-install_only.tar.gz`,
    "darwin-x64": `cpython-${version}+${tag}-x86_64-apple-darwin-install_only.tar.gz`,
    "darwin-arm64": `cpython-${version}+${tag}-aarch64-apple-darwin-install_only.tar.gz`,
    "linux-x64": `cpython-${version}+${tag}-x86_64-unknown-linux-gnu-install_only.tar.gz`,
    "linux-arm64": `cpython-${version}+${tag}-aarch64-unknown-linux-gnu-install_only.tar.gz`,
  };

  const key = `${platform}-${arch}`;
  const filename = matrix[key];

  if (!filename) {
    throw new Error(`Unsupported platform: ${key}. Supported: ${Object.keys(matrix).join(", ")}`);
  }

  return `https://github.com/indygreg/python-build-standalone/releases/download/${tag}/${filename}`;
}

/**
 * Get the Python binary path inside the extracted PBS directory.
 */
function getPythonBin() {
  if (process.platform === "win32") {
    return join(PYTHON_DIR, "python", "python.exe");
  }
  return join(PYTHON_DIR, "python", "bin", "python3");
}

/**
 * Get the venv Python binary path.
 */
function getVenvPythonBin() {
  if (process.platform === "win32") {
    return join(VENV_DIR, "Scripts", "python.exe");
  }
  return join(VENV_DIR, "bin", "python3");
}

/**
 * Get the pip binary path in the venv.
 */
function getVenvPipBin() {
  if (process.platform === "win32") {
    return join(VENV_DIR, "Scripts", "pip.exe");
  }
  return join(VENV_DIR, "bin", "pip");
}

/**
 * Run a command and stream output.
 */
async function run(cmd, args, opts = {}) {
  const proc = Bun.spawn([cmd, ...args], {
    stdout: "inherit",
    stderr: "inherit",
    ...opts,
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")} (exit ${exitCode})`);
  }
}

/**
 * Run a command and capture output.
 */
async function runCapture(cmd, args) {
  const proc = Bun.spawn([cmd, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const output = await new Response(proc.stdout).text();
  await proc.exited;
  return output.trim();
}

async function main() {
  console.log("");
  console.log(cyan("  ◈ Streamline — provisioning environment"));
  console.log("");

  // Ensure base dir
  mkdirSync(STREAMLINE_DIR, { recursive: true });

  // ─── Step 1: Python ─────────────────────────────────────
  const pythonBin = getPythonBin();

  if (existsSync(pythonBin)) {
    log(green("✓"), `Python already installed at ${dim(pythonBin)}`);
  } else {
    log(dim("▸"), "Downloading Python 3.11.9 (python-build-standalone)...");
    const url = getPBSUrl();
    log(dim("  →"), dim(url));

    try {
      mkdirSync(PYTHON_DIR, { recursive: true });

      // Download
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: HTTP ${response.status}`);
      }

      const tarPath = join(STREAMLINE_DIR, "python.tar.gz");
      const buffer = await response.arrayBuffer();
      writeFileSync(tarPath, Buffer.from(buffer));
      log(dim("  →"), `Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB`);

      // Extract
      log(dim("▸"), "Extracting...");
      await run("tar", ["xzf", tarPath, "-C", PYTHON_DIR]);

      // Cleanup tarball
      try {
        const { unlinkSync } = await import("fs");
        unlinkSync(tarPath);
      } catch { }

      if (existsSync(pythonBin)) {
        log(green("✓"), `Python 3.11.9 installed at ${dim(PYTHON_DIR)}`);
      } else {
        throw new Error("Python binary not found after extraction");
      }
    } catch (err) {
      log(red("✗"), `Failed to install Python: ${err.message}`);
      log(dim("  →"), "You can install Python manually or retry later.");
      log(dim("  →"), "Streamline will attempt to use system Python as fallback.");
    }
  }

  // ─── Step 2: Venv ───────────────────────────────────────
  const venvPython = getVenvPythonBin();

  if (existsSync(venvPython)) {
    log(green("✓"), `Venv already exists at ${dim(VENV_DIR)}`);
  } else {
    log(dim("▸"), "Creating isolated venv...");
    try {
      const pythonToUse = existsSync(pythonBin) ? pythonBin : "python3";
      await run(pythonToUse, ["-m", "venv", VENV_DIR]);
      log(green("✓"), `Venv created at ${dim(VENV_DIR)}`);
    } catch (err) {
      log(red("✗"), `Failed to create venv: ${err.message}`);
    }
  }

  // ─── Step 3: yt-dlp ─────────────────────────────────────
  const pipBin = getVenvPipBin();

  if (existsSync(pipBin)) {
    log(dim("▸"), "Installing yt-dlp with browser/cookie support...");
    try {
      await run(pipBin, ["install", "--upgrade", "yt-dlp[default,curl-cffi]"]);
      const version = await runCapture(
        join(VENV_DIR, process.platform === "win32" ? "Scripts" : "bin", "yt-dlp"),
        ["--version"]
      );
      log(green("✓"), `yt-dlp ${version} installed`);
    } catch (err) {
      log(red("✗"), `Failed to install yt-dlp: ${err.message}`);
    }
  } else {
    log(red("✗"), "pip not found — cannot install yt-dlp");
  }

  // ─── Step 4: ffmpeg ─────────────────────────────────────
  if (existsSync(pipBin)) {
    log(dim("▸"), "Installing ffmpeg via imageio...");
    try {
      await run(pipBin, ["install", "--upgrade", "imageio[ffmpeg]"]);
      log(green("✓"), "ffmpeg installed via imageio");
    } catch (err) {
      log(red("✗"), `Failed to install ffmpeg: ${err.message}`);
      log(dim("  →"), "Trying system ffmpeg as fallback...");
    }
  }

  // ─── Step 5: Write env.json ─────────────────────────────
  log(dim("▸"), "Writing env manifest...");

  let ffmpegPath = "ffmpeg";
  // Try to find imageio ffmpeg
  try {
    const result = await runCapture(getVenvPythonBin(), [
      "-c",
      "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())",
    ]);
    if (result && existsSync(result)) {
      ffmpegPath = result;
    }
  } catch {
    // fallback to system ffmpeg
  }

  let ytdlpVersion = null;
  try {
    const ytdlpBin = join(
      VENV_DIR,
      process.platform === "win32" ? "Scripts" : "bin",
      process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
    );
    if (existsSync(ytdlpBin)) {
      ytdlpVersion = await runCapture(ytdlpBin, ["--version"]);
    }
  } catch { }

  const manifest = {
    pythonPath: existsSync(pythonBin) ? pythonBin : null,
    venvPath: existsSync(venvPython) ? VENV_DIR : null,
    ytdlpVersion,
    ffmpegPath,
    installedAt: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
  };

  writeFileSync(ENV_FILE, JSON.stringify(manifest, null, 2));
  log(green("✓"), `Manifest written to ${dim(ENV_FILE)}`);

  console.log("");
  log(cyan("✓"), "All dependencies ready. Run: streamline");
  console.log("");
}

main().catch((err) => {
  console.error(red(`\n  ✗ Provisioning failed: ${err.message}\n`));
  process.exit(1);
});
