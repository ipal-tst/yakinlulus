import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

import { dashboardService } from "./dashboard.service";
import { api } from "@/lib/api";

const apiMock = vi.mocked(api);

describe("dashboardService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /dashboard/admin for admin dashboard", async () => {
    apiMock.mockResolvedValue({ kpi: {} });
    const res = await dashboardService.getAdminDashboard();
    expect(apiMock).toHaveBeenCalledWith("/dashboard/admin", {});
    expect(res).toEqual({ kpi: {} });
  });
});