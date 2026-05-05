import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import useStore from "@/hooks/useStore";
import ProgressCard from "@/components/ProgressCard";

describe("ProgressCard", () => {
  it("renders nothing when there are no downloads", () => {
    useStore.setState({ downloads: [], activeDownloadId: null });
    const { container } = render(<ProgressCard />);
    expect(container.firstChild).toBeNull();
  });

  it("renders title and percentage for an active download", () => {
    useStore.setState({
      downloads: [{
        id: "1", title: "My Video", status: "downloading",
        progress: 47, speed: 500000, eta: "0:30", filesize: 10000000,
        thumbnail: null, error: null, filepath: null, log: [],
      }],
      activeDownloadId: "1",
    });
    render(<ProgressCard />);
    expect(screen.getByText("My Video")).toBeInTheDocument();
    expect(screen.getByText(/47%/)).toBeInTheDocument();
  });

  it("shows error message on failed download", () => {
    useStore.setState({
      downloads: [{
        id: "2", title: "Bad Video", status: "error",
        error: "HTTP 403 Forbidden", progress: 0,
        thumbnail: null, filepath: null, log: [],
      }],
      activeDownloadId: "2",
    });
    render(<ProgressCard />);
    expect(screen.getByText(/403/)).toBeInTheDocument();
  });
});
