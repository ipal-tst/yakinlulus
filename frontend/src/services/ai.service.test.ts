import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { aiService } from "./ai.service";

describe("aiService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /ai/config", async () => {
    apiMock.mockResolvedValue({ model: "gpt-4o" });
    await aiService.getConfig();
    expect(apiMock).toHaveBeenCalledWith("/ai/config");
  });

  it("POSTs /ai/test-connection", async () => {
    apiMock.mockResolvedValue({ ok: true });
    await aiService.testConnection();
    expect(apiMock).toHaveBeenCalledWith("/ai/test-connection", { method: "POST" });
  });
});