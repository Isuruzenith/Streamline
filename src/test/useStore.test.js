import { describe, it, expect, beforeEach, vi } from "vitest";
import useStore from "@/hooks/useStore";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true })));
  useStore.setState({
    downloads: [],
    activeDownloadId: null,
    toast: null,
  });
});

describe("addDownload", () => {
  it("appends a download with queued status", () => {
    useStore.getState().addDownload({ id: "test-1", title: "Test Video", url: "https://example.com" });
    const { downloads } = useStore.getState();
    expect(downloads).toHaveLength(1);
    expect(downloads[0].status).toBe("queued");
  });
});

describe("updateDownload", () => {
  it("updates only the targeted item", () => {
    useStore.setState({
      downloads: [
        { id: "a", status: "queued", progress: 0 },
        { id: "b", status: "queued", progress: 0 },
      ],
    });
    useStore.getState().updateDownload("a", { status: "downloading", progress: 42 });
    const { downloads } = useStore.getState();
    expect(downloads.find((download) => download.id === "a").progress).toBe(42);
    expect(downloads.find((download) => download.id === "b").status).toBe("queued");
  });
});

describe("removeDownload", () => {
  it("removes the item from the list", () => {
    useStore.setState({ downloads: [{ id: "x", status: "complete" }] });
    useStore.getState().removeDownload("x");
    expect(useStore.getState().downloads).toHaveLength(0);
  });
});

describe("retryDownload", () => {
  it("resets status to queued", () => {
    useStore.setState({
      downloads: [{ id: "err", status: "error", error: "404", progress: 50, log: ["line"] }],
    });
    useStore.getState().retryDownload("err");
    const download = useStore.getState().downloads[0];
    expect(download.status).toBe("queued");
    expect(download.error).toBeNull();
    expect(download.progress).toBe(0);
  });
});

describe("showToast", () => {
  it("sets toast with the correct message and type", () => {
    useStore.getState().showToast("Hello", "success");
    const { toast } = useStore.getState();
    expect(toast.message).toBe("Hello");
    expect(toast.type).toBe("success");
  });
});
