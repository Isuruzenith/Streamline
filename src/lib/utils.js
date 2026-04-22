import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes into human-readable size
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Format speed in MiB/s
 */
export function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond) return "—";
  const mib = bytesPerSecond / (1024 * 1024);
  if (mib >= 1) return `${mib.toFixed(1)} MiB/s`;
  const kib = bytesPerSecond / 1024;
  return `${kib.toFixed(0)} KiB/s`;
}

/**
 * Generate a short unique ID
 */
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
