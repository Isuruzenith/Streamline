import { describe, it, expect } from "bun:test";

const BASE = "http://localhost:7979";

describe("GET /api/formats", () => {
  it("returns 400 when url param is missing", async () => {
    const res = await fetch(`${BASE}/api/formats`);
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-URL string", async () => {
    const res = await fetch(`${BASE}/api/formats?url=not-a-url`);
    expect(res.status).toBe(400);
  });
});
