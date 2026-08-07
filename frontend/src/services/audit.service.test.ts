import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { auditService } from "./audit.service";

describe("auditService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /audit-logs/stats", async () => {
    apiMock.mockResolvedValue({ total_logs: 100 });
    await auditService.getStats();
    expect(apiMock).toHaveBeenCalledWith("/audit-logs/stats");
  });

  it("GETs /audit-logs", async () => {
    apiMock.mockResolvedValue([]);
    await auditService.getLogs({ page: 1, limit: 20 });
    expect(apiMock).toHaveBeenCalledWith("/audit-logs", { params: { page: 1, limit: 20 } });
  });
});