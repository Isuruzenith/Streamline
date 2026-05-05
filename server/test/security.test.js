import { describe, expect, it } from "bun:test";
import { homedir } from "os";
import { join } from "path";
import { __downloadRouteTest } from "../routes/download.js";
import { DownloadQueue } from "../services/queue.js";
import { __ytdlpTest } from "../services/ytdlp.js";

describe("open-folder validation", () => {
  it("rejects non-local and out-of-root paths", () => {
    expect(() => __downloadRouteTest.getOpenableFolder("http://evil.com/file")).toThrow(
      "absolute local path"
    );
    expect(() => __downloadRouteTest.getOpenableFolder("/etc/passwd")).toThrow(
      "outside Streamline downloads"
    );
  });

  it("accepts files under the default Streamline download root", () => {
    const filepath = join(homedir(), "Downloads", "Streamline", "video.mp4");
    expect(__downloadRouteTest.getOpenableFolder(filepath)).toBe(
      join(homedir(), "Downloads", "Streamline")
    );
  });
});

describe("yt-dlp custom flag filtering", () => {
  it("blocks dangerous output, input, and execution flags", () => {
    const flags = __ytdlpTest.parseCustomFlags(
      "--print-to-file after_move /tmp/leak.txt --write-pages --load-pages /tmp/pages --exec echo --no-playlist"
    );

    expect(flags).toEqual(["--no-playlist"]);
  });

  it("blocks dangerous equals-form flags while preserving unrelated safe args", () => {
    const flags = __ytdlpTest.parseCustomFlags(
      "--print-to-file=after_move:%(filepath)s --cookies=/tmp/cookies.txt --restrict-filenames"
    );

    expect(flags).toEqual(["--restrict-filenames"]);
  });
});

describe("yt-dlp format selection", () => {
  it("keeps default MP4 downloads on MP4-compatible streams", () => {
    expect(__ytdlpTest.getFormatSelectionArgs({
      preset: "best",
      videoFormat: "mp4",
    })).toContain("bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]");
  });

  it("preserves the useful ffmpeg error detail from post-processing output", () => {
    const message = __ytdlpTest.getYtdlpErrorMessage(
      [
        "ERROR: Postprocessing:   Stream #1:0 -> #0:1 (copy)",
        "[mp4 @ 000001] Could not find tag for codec opus in stream #1, codec not currently supported in container",
        "Conversion failed!",
      ].join("\n"),
      1
    );

    expect(message).toContain("codec opus");
    expect(message).toContain("not currently supported");
  });
});

describe("metadata cache eviction", () => {
  it("caps the metadata cache at 250 entries", () => {
    __ytdlpTest.metadataCache.clear();

    for (let i = 0; i < 260; i += 1) {
      __ytdlpTest.setCached("formats", `https://example.com/${i}`, { i });
    }

    expect(__ytdlpTest.metadataCache.size).toBeLessThanOrEqual(250);
  });
});

describe("download queue IDs", () => {
  it("rejects duplicate download IDs", () => {
    const queue = new DownloadQueue();
    queue.processNext = () => {};

    queue.add({ downloadId: "dup-id", url: "https://example.com/1" });

    expect(() => queue.add({ downloadId: "dup-id", url: "https://example.com/2" })).toThrow(
      "Duplicate downloadId"
    );
    expect(queue.queue).toHaveLength(1);
  });
});
