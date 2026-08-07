import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { analyticsService } from "./analytics.service";

describe("analyticsService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /analytics/admin/overview", async () => {
    apiMock.mockResolvedValue({});
    await analyticsService.getAdminOverview();
    expect(apiMock).toHaveBeenCalledWith("/analytics/admin/overview");
  });

  it("GETs /analytics/admin/reports/exams", async () => {
    apiMock.mockResolvedValue([]);
    await analyticsService.getExamReports();
    expect(apiMock).toHaveBeenCalledWith("/analytics/admin/reports/exams");
  });
});