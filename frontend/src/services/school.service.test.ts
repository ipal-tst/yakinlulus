import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { schoolService } from "./school.service";

describe("schoolService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /schools", async () => {
    apiMock.mockResolvedValue([]);
    await schoolService.listSchools();
    expect(apiMock).toHaveBeenCalledWith("/schools", { params: undefined });
  });

  it("POSTs /schools", async () => {
    apiMock.mockResolvedValue({ id: "s1" });
    await schoolService.createSchool({ name: "SMA X" } as any);
    expect(apiMock).toHaveBeenCalledWith("/schools", { method: "POST", body: { name: "SMA X", school_name: "SMA X" } });
  });

  it("PATCHes /schools/:id/status", async () => {
    apiMock.mockResolvedValue({ id: "s1" });
    await schoolService.toggleStatus("s1", "INACTIVE");
    expect(apiMock).toHaveBeenCalledWith("/schools/s1/status", { method: "PATCH", body: { status: "INACTIVE" } });
  });
});