import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { schoolService } from "./school.service";

describe("schoolService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /school", async () => {
    apiMock.mockResolvedValue([]);
    await schoolService.listSchools();
    expect(apiMock).toHaveBeenCalledWith("/school", {});
  });

  it("POSTs /school", async () => {
    apiMock.mockResolvedValue({ id: "s1" });
    await schoolService.createSchool({ name: "SMA X" });
    expect(apiMock).toHaveBeenCalledWith("/school", { method: "POST", body: { name: "SMA X" } });
  });

  it("PATCHes /school/:id/status", async () => {
    apiMock.mockResolvedValue({ id: "s1" });
    await schoolService.toggleStatus("s1", "INACTIVE");
    expect(apiMock).toHaveBeenCalledWith("/school/s1/status", { method: "PATCH", body: { status: "INACTIVE" } });
  });
});