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

  it("exposes score_distribution & total_participants from overview", async () => {
    apiMock.mockResolvedValue({
      total_participants: 14,
      avg_score: 61.2,
      pass_rate: 42.85,
      score_distribution: { bracket_700_plus: 3, bracket_600_699: 4, bracket_500_599: 5, bracket_below_500: 2 },
    });
    const res = await analyticsService.getAdminOverview();
    expect(res.score_distribution?.bracket_700_plus).toBe(3);
    expect(res.total_participants).toBe(14);
  });
});