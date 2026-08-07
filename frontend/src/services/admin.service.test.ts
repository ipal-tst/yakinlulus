import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { adminService } from "./admin.service";

describe("adminService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /admin/health", async () => {
    apiMock.mockResolvedValue({ services: [] });
    await adminService.getHealth();
    expect(apiMock).toHaveBeenCalledWith("/admin/health");
  });

  it("GETs /admin/logs with limit", async () => {
    apiMock.mockResolvedValue({ logs: [] });
    await adminService.getLogs(100);
    expect(apiMock).toHaveBeenCalledWith("/admin/logs", { params: { limit: 100 } });
  });
});