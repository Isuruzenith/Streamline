#!/usr/bin/env bun
/**
 * build-binaries.js
 * Builds standalone executables for all supported platforms.
 * Run: bun scripts/build-binaries.js
 */

import { spawnSync } from "child_process";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const OUT_DIR = "binaries";

const TARGETS = [
  { name: "streamline-macos-arm64", target: "bun-darwin-arm64" },
  { name: "streamline-macos-x64", target: "bun-darwin-x64" },
  { name: "streamline-linux-x64", target: "bun-linux-x64" },
  { name: "streamline-windows-x64", target: "bun-windows-x64", ext: ".exe" },
];

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR);

console.log("Building frontend...");
const buildResult = spawnSync("bun", ["run", "build"], { stdio: "inherit", shell: true });
if (buildResult.status !== 0) {
  console.error("Frontend build failed");
  process.exit(1);
}

for (const { name, target, ext = "" } of TARGETS) {
  const outPath = join(OUT_DIR, `${name}${ext}`);
  console.log(`Compiling ${target} -> ${outPath}`);

  const result = spawnSync(
    "bun",
    [
      "build",
      "--compile",
      "--target", target,
      "--outfile", outPath,
      "server/index.js",
    ],
    { stdio: "inherit", shell: true }
  );

  if (result.status !== 0) {
    console.error(`Build failed for ${target}`);
    process.exit(1);
  }
  console.log(`  done ${outPath}`);
}

console.log("\nAll binaries built successfully.");
