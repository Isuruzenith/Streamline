#!/usr/bin/env bun

/**
 * Streamline Provisioning Script
 *
 * Automatically downloads and installs:
 * 1. python-build-standalone (Python 3.11)
 * 2. Creates isolated venv
 * 3. Installs yt-dlp
 * 4. Downloads ffmpeg and ffprobe from GitHub releases
 * 5. Writes ~/.streamline/env.json
 *
 * This script is idempotent — safe to re-run.
 */

import { homedir } from "os";
import { join, basename } from "path";
import { chmodSync, existsSync, mkdirSync, readdirSync, writeFileSync, createWriteStream } from "fs";

const STREAMLINE_DIR = join(homedir(), ".streamline");
const PYTHON_DIR = join(STREAMLINE_DIR, "python");
const VENV_DIR = join(STREAMLINE_DIR, "venv");
const FFMPEG_DIR = join(STREAMLINE_DIR, "ffmpeg");
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
 * Downloads a file from a URL and saves it to destPath, showing a live TUI progress bar.
 */
async function downloadWithProgress(url, destPath, label = "Downloading") {
  const resp = await fetch(url, { redirect: "follow" });
  if (!resp.ok) {
    throw new Error(`Failed to download: HTTP ${resp.status}`);
  }

  const contentLength = parseInt(resp.headers.get("content-length") || "0", 10);
  const fileStream = createWriteStream(destPath);
  
  if (!resp.body) {
    throw new Error("Response body is not readable");
  }

  const reader = resp.body.getReader();
  let downloadedBytes = 0;
  const barWidth = 30;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;

        if (contentLength > 0) {
          const pct = (downloadedBytes / contentLength) * 100;
          const filledWidth = Math.round((downloadedBytes / contentLength) * barWidth);
          const bar = "█".repeat(filledWidth) + "░".repeat(barWidth - filledWidth);
          const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(1);
          const totalMB = (contentLength / 1024 / 1024).toFixed(1);
          process.stdout.write(`\r  → ${label}: [${bar}] ${pct.toFixed(0)}% (${downloadedMB}/${totalMB} MB)`);
        } else {
          const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(1);
          process.stdout.write(`\r  → ${label}: ${downloadedMB} MB`);
        }
      }
    }
  } finally {
    await new Promise((resolve) => fileStream.end(resolve));
  }
  process.stdout.write("\n");
}

/**
 * Get python-build-standalone download URL for current platform.
 */
function getPBSUrl() {
  const platform = process.platform;
  const arch = process.arch;
  const version = "3.11.10";
  const tag = "20241016";

  const matrix = {
    "win32-x64": `cpython-${version}+${tag}-x86_64-pc-windows-msvc-install_only.tar.gz`,
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

function getToolBinaryName(name) {
  return process.platform === "win32" ? `${name}.exe` : name;
}

function getSystemPythonCommands() {
  if (process.platform === "win32") {
    return [
      { cmd: "python", args: [] },
      { cmd: "py", args: ["-3"] },
    ];
  }

  return [
    { cmd: "python3", args: [] },
    { cmd: "python", args: [] },
  ];
}

/**
 * Get ffmpeg/ffprobe download URLs for the current platform.
 *
 * Sources:
 * - Windows/Linux: BtbN/FFmpeg-Builds (GitHub, GPL builds with all codecs)
 * - macOS: ffmpeg.martin-riedl.de (signed + notarized, native arm64 + amd64)
 *
 * Martin Riedl's scripting redirect API provides stable URLs:
 *   https://ffmpeg.martin-riedl.de/redirect/latest/{macos,linux}/{amd64,arm64}/{release}/{ffmpeg.zip,...}
 */
function getFfmpegDownloadInfo() {
  const platform = process.platform;
  const arch = process.arch;

  // BtbN/FFmpeg-Builds release tag — GPL build with all codecs
  const tag = "latest";
  const btbnBase = `https://github.com/BtbN/FFmpeg-Builds/releases/download/${tag}`;

  const matrix = {
    "win32-x64": {
      url: `${btbnBase}/ffmpeg-master-latest-win64-gpl.zip`,
      archiveType: "zip",
    },
    "linux-x64": {
      url: `${btbnBase}/ffmpeg-master-latest-linux64-gpl.tar.xz`,
      archiveType: "tar.xz",
    },
    "linux-arm64": {
      url: `${btbnBase}/ffmpeg-master-latest-linuxarm64-gpl.tar.xz`,
      archiveType: "tar.xz",
    },
  };

  // macOS: use Martin Riedl's stable redirect API (signed + notarized, native arm64)
  if (platform === "darwin") {
    const macArch = arch === "arm64" ? "arm64" : "amd64";
    const riedlBase = `https://ffmpeg.martin-riedl.de/redirect/latest/macos/${macArch}/release`;
    return {
      platform: `darwin-${arch}`,
      ffmpegUrl: `${riedlBase}/ffmpeg.zip`,
      ffprobeUrl: `${riedlBase}/ffprobe.zip`,
      archiveType: "zip-separate",
    };
  }

  const key = `${platform}-${arch}`;
  const info = matrix[key];

  if (!info) {
    throw new Error(
      `Unsupported platform for ffmpeg download: ${key}. Supported: ${Object.keys(matrix).join(", ")}, darwin-x64, darwin-arm64`
    );
  }

  return { platform: key, ...info };
}

/**
 * Download and extract ffmpeg + ffprobe binaries to FFMPEG_DIR.
 */
async function downloadFfmpegTools() {
  mkdirSync(FFMPEG_DIR, { recursive: true });

  const info = getFfmpegDownloadInfo();
  const ffmpegDest = join(FFMPEG_DIR, getToolBinaryName("ffmpeg"));
  const ffprobeDest = join(FFMPEG_DIR, getToolBinaryName("ffprobe"));

  // macOS: download ffmpeg and ffprobe as separate zip files
  if (info.platform === "darwin") {
    for (const [name, url, dest] of [
      ["ffmpeg", info.ffmpegUrl, ffmpegDest],
      ["ffprobe", info.ffprobeUrl, ffprobeDest],
    ]) {
      log(dim("  ->"), `Downloading ${name}...`);
      const zipPath = join(STREAMLINE_DIR, `${name}.zip`);
      await downloadWithProgress(url, zipPath, `Downloading ${name}`);

      // Extract — macOS zip contains just the binary at root level
      const tmpDir = join(STREAMLINE_DIR, `${name}_tmp`);
      mkdirSync(tmpDir, { recursive: true });
      await run("unzip", ["-o", zipPath, "-d", tmpDir]);

      const extractedBin = join(tmpDir, name);
      if (existsSync(extractedBin)) {
        const { copyFileSync, rmSync } = await import("fs");
        copyFileSync(extractedBin, dest);
        chmodSync(dest, 0o755);
        rmSync(tmpDir, { recursive: true, force: true });
      }

      // Cleanup zip
      try {
        const { unlinkSync } = await import("fs");
        unlinkSync(zipPath);
      } catch {}
    }

    return { ffmpegPath: ffmpegDest, ffprobePath: ffprobeDest, ffmpegLocation: FFMPEG_DIR };
  }

  // Windows / Linux: download single archive containing both binaries
  log(dim("  ->"), dim(info.url));

  const archiveName = info.archiveType === "zip" ? "ffmpeg-archive.zip" : "ffmpeg-archive.tar.xz";
  const archivePath = join(STREAMLINE_DIR, archiveName);
  await downloadWithProgress(info.url, archivePath, "Downloading ffmpeg package");

  // Extract to temp dir
  const extractDir = join(STREAMLINE_DIR, "ffmpeg_extract");
  mkdirSync(extractDir, { recursive: true });

  if (info.archiveType === "zip") {
    // Windows: use PowerShell to extract zip
    await run("powershell", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -Path '${archivePath}' -DestinationPath '${extractDir}' -Force`,
    ]);
  } else {
    // Linux: use tar
    await run("tar", ["xf", archivePath, "-C", extractDir]);
  }

  // Find the ffmpeg and ffprobe binaries inside the extracted directory
  const ffmpegBinName = getToolBinaryName("ffmpeg");
  const ffprobeBinName = getToolBinaryName("ffprobe");

  const extractedFfmpeg = findBinary(extractDir, ffmpegBinName);
  const extractedFfprobe = findBinary(extractDir, ffprobeBinName);

  if (!extractedFfmpeg) throw new Error("ffmpeg binary not found in downloaded archive");
  if (!extractedFfprobe) throw new Error("ffprobe binary not found in downloaded archive");

  // Copy to final destination
  const { copyFileSync, rmSync } = await import("fs");
  copyFileSync(extractedFfmpeg, ffmpegDest);
  copyFileSync(extractedFfprobe, ffprobeDest);

  if (process.platform !== "win32") {
    chmodSync(ffmpegDest, 0o755);
    chmodSync(ffprobeDest, 0o755);
  }

  // Cleanup
  try {
    rmSync(extractDir, { recursive: true, force: true });
    const { unlinkSync } = await import("fs");
    unlinkSync(archivePath);
  } catch {}

  return { ffmpegPath: ffmpegDest, ffprobePath: ffprobeDest, ffmpegLocation: FFMPEG_DIR };
}

/**
 * Recursively find a binary by name inside a directory (max depth 4).
 */
function findBinary(dir, binaryName, depth = 0) {
  if (depth > 4) return null;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isFile() && entry.name === binaryName) {
        return fullPath;
      }
      if (entry.isDirectory()) {
        const found = findBinary(fullPath, binaryName, depth + 1);
        if (found) return found;
      }
    }
  } catch {}
  return null;
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

async function runFirstSuccessful(commands, args) {
  let lastError = null;
  for (const command of commands) {
    try {
      await run(command.cmd, [...command.args, ...args]);
      return;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("No usable Python executable found");
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
    log(green("OK"), `Python already installed at ${dim(pythonBin)}`);
  } else {
    log(dim("▸"), "Downloading isolated Python 3.11.10 environment...");
    log(dim("  ℹ"), "Why? Streamline needs an isolated Python environment to run yt-dlp securely.");

    try {
      const url = getPBSUrl();
      log(dim("  →"), dim(url));
      mkdirSync(PYTHON_DIR, { recursive: true });

      // Download
      const tarPath = join(STREAMLINE_DIR, "python.tar.gz");
      await downloadWithProgress(url, tarPath, "Downloading Python");

      // Extract
      log(dim("▸"), "Extracting...");
      await run("tar", ["xzf", tarPath, "-C", PYTHON_DIR]);

      // Cleanup tarball
      try {
        const { unlinkSync } = await import("fs");
        unlinkSync(tarPath);
      } catch { }

      if (existsSync(pythonBin)) {
        log(green("OK"), `Python 3.11.10 installed at ${dim(PYTHON_DIR)}`);
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
      if (existsSync(pythonBin)) {
        await run(pythonBin, ["-m", "venv", VENV_DIR]);
      } else {
        await runFirstSuccessful(getSystemPythonCommands(), ["-m", "venv", VENV_DIR]);
      }
      log(green("✓"), `Venv created at ${dim(VENV_DIR)}`);
    } catch (err) {
      log(red("✗"), `Failed to create venv: ${err.message}`);
    }
  }

  // ─── Step 3: yt-dlp ─────────────────────────────────────
  const pipBin = getVenvPipBin();

  if (existsSync(pipBin)) {
    log(dim("▸"), "Installing/updating yt-dlp (media downloader engine)...");
    log(dim("  ℹ"), "Why? yt-dlp extracts media from YouTube and 1000+ other supported websites.");
    try {
      await run(pipBin, ["install", "--upgrade", "yt-dlp[default,curl-cffi]"]);
      const version = await runCapture(
        join(
          VENV_DIR,
          process.platform === "win32" ? "Scripts" : "bin",
          process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
        ),
        ["--version"]
      );
      log(green("✓"), `yt-dlp ${version} installed`);
    } catch (err) {
      log(red("✗"), `Failed to install yt-dlp: ${err.message}`);
    }
  } else {
    log(red("✗"), "pip not found — cannot install yt-dlp");
  }

  // ─── Step 4: ffmpeg + ffprobe ──────────────────────────
  const ffmpegBinPath = join(FFMPEG_DIR, getToolBinaryName("ffmpeg"));
  const ffprobeBinPath = join(FFMPEG_DIR, getToolBinaryName("ffprobe"));

  let ffmpegTools = null;

  if (existsSync(ffmpegBinPath) && existsSync(ffprobeBinPath)) {
    log(green("✓"), `ffmpeg already installed at ${dim(FFMPEG_DIR)}`);
    ffmpegTools = {
      ffmpegPath: ffmpegBinPath,
      ffprobePath: ffprobeBinPath,
      ffmpegLocation: FFMPEG_DIR,
    };
  } else {
    log(dim("▸"), "Downloading ffmpeg and ffprobe...");
    log(dim("  ℹ"), "Why? Required to merge high-quality video & audio tracks and convert formats.");
    try {
      ffmpegTools = await downloadFfmpegTools();
      log(green("✓"), `ffmpeg and ffprobe installed at ${dim(FFMPEG_DIR)}`);
    } catch (err) {
      log(red("✗"), `Failed to download ffmpeg: ${err.message}`);

      // Fallback: try imageio[ffmpeg] via pip (installs a platform-native ffmpeg binary)
      if (existsSync(pipBin)) {
        log(dim("  →"), "Trying imageio[ffmpeg] as fallback...");
        try {
          await run(pipBin, ["install", "--upgrade", "imageio[ffmpeg]"]);
          const venvPy = getVenvPythonBin();
          const imageioBin = await runCapture(venvPy, [
            "-c",
            "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())",
          ]);
          if (imageioBin && existsSync(imageioBin)) {
            mkdirSync(FFMPEG_DIR, { recursive: true });
            const { copyFileSync } = await import("fs");
            copyFileSync(imageioBin, ffmpegBinPath);
            if (process.platform !== "win32") chmodSync(ffmpegBinPath, 0o755);
            ffmpegTools = {
              ffmpegPath: ffmpegBinPath,
              ffprobePath: "ffprobe",  // imageio only provides ffmpeg, not ffprobe
              ffmpegLocation: FFMPEG_DIR,
            };
            log(green("✓"), `ffmpeg installed via imageio at ${dim(FFMPEG_DIR)}`);
            log(dim("  →"), "ffprobe will use system PATH — install ffprobe manually if needed.");
          }
        } catch (imageioErr) {
          log(red("✗"), `imageio fallback also failed: ${imageioErr.message}`);
        }
      }

      if (!ffmpegTools) {
        log(dim("  →"), "Streamline will attempt to use system ffmpeg as fallback.");
      }
    }
  }

  // Detect ffmpeg version
  let ffmpegVersion = null;
  if (ffmpegTools?.ffmpegPath && existsSync(ffmpegTools.ffmpegPath)) {
    try {
      const versionOutput = await runCapture(ffmpegTools.ffmpegPath, ["-version"]);
      ffmpegVersion = versionOutput.match(/ffmpeg version (\S+)/)?.[1] || "installed";
    } catch {}
  }

  let ffprobeVersion = null;
  if (ffmpegTools?.ffprobePath && existsSync(ffmpegTools.ffprobePath)) {
    try {
      const versionOutput = await runCapture(ffmpegTools.ffprobePath, ["-version"]);
      ffprobeVersion = versionOutput.match(/ffprobe version (\S+)/)?.[1] || "installed";
    } catch {}
  }

  // ─── Step 5: Write env.json ─────────────────────────────
  log(dim("▸"), "Writing env manifest...");

  let ffmpegPath = ffmpegTools?.ffmpegPath || "ffmpeg";
  let ffprobePath = ffmpegTools?.ffprobePath || "ffprobe";
  let ffmpegLocation = ffmpegTools?.ffmpegLocation || null;

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
    ffprobePath,
    ffmpegLocation,
    ffmpegVersion: ffmpegVersion || null,
    ffprobeVersion: ffprobeVersion || null,
    installedAt: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
  };

  writeFileSync(ENV_FILE, JSON.stringify(manifest, null, 2));
  log(green("✓"), `Manifest written to ${dim(ENV_FILE)}`);

  console.log("");
  log(cyan("✓"), "All dependencies ready. Run: streamline-md");
  console.log("");
}

main().catch((err) => {
  console.error(red(`\n  ✗ Provisioning failed: ${err.message}\n`));
  process.exit(1);
});
