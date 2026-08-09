import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { targetSchoolService } from "./target-school.service";

describe("targetSchoolService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /target-schools", async () => {
    apiMock.mockResolvedValue([]);
    await targetSchoolService.listTargetSchools();
    expect(apiMock).toHaveBeenCalledWith("/target-schools", { params: undefined });
  });

  it("GETs /target-schools with filter params", async () => {
    apiMock.mockResolvedValue([]);
    const params = { level: "SMA", province: "DKI Jakarta", q: "Negeri" };
    await targetSchoolService.listTargetSchools(params);
    expect(apiMock).toHaveBeenCalledWith("/target-schools", { params });
  });

  it("POSTs /target-schools", async () => {
    apiMock.mockResolvedValue({ id: "t1" });
    await targetSchoolService.createTargetSchool({ school_id: "s1", name: "ITB", level: "SMA", max_total_score: 1000, subjects: ["FIS"] });
    expect(apiMock).toHaveBeenCalledWith("/target-schools", { method: "POST", body: { school_id: "s1", name: "ITB", level: "SMA", max_total_score: 1000, subjects: ["FIS"] } });
  });

  it("DELETEs /target-schools/:id", async () => {
    apiMock.mockResolvedValue({ message: "ok" });
    await targetSchoolService.deleteTargetSchool("t1");
    expect(apiMock).toHaveBeenCalledWith("/target-schools/t1", { method: "DELETE" });
  });
});