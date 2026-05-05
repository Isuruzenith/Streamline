import { describe, it, expect } from "vitest";
import { formatBytes } from "@/lib/utils";

describe("formatBytes", () => {
  it("returns '0 B' for 0", () => expect(formatBytes(0)).toBe("0 B"));
  it("formats kilobytes", () => expect(formatBytes(1024)).toBe("1.0 KB"));
  it("formats megabytes", () => expect(formatBytes(1048576)).toBe("1.0 MB"));
  it("handles null", () => expect(formatBytes(null)).toBe("—"));
  it("handles large values", () => expect(formatBytes(1073741824)).toBe("1.0 GB"));
});
