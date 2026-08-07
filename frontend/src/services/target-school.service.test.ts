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
    expect(apiMock).toHaveBeenCalledWith("/target-schools");
  });

  it("POSTs /target-schools", async () => {
    apiMock.mockResolvedValue({ id: "t1" });
    await targetSchoolService.createTargetSchool({ name: "ITB", level: "SMA", max_total_score: 1000, subjects: ["FIS"] });
    expect(apiMock).toHaveBeenCalledWith("/target-schools", { method: "POST", body: { name: "ITB", level: "SMA", max_total_score: 1000, subjects: ["FIS"] } });
  });

  it("DELETEs /target-schools/:id", async () => {
    apiMock.mockResolvedValue({ message: "ok" });
    await targetSchoolService.deleteTargetSchool("t1");
    expect(apiMock).toHaveBeenCalledWith("/target-schools/t1", { method: "DELETE" });
  });
});