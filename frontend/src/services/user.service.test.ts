import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { userService } from "./user.service";

describe("userService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /auth/users", async () => {
    apiMock.mockResolvedValue({ items: [] });
    await userService.listUsers({ page: 1, limit: 20 });
    expect(apiMock).toHaveBeenCalledWith("/auth/users", { params: { page: 1, limit: 20 } });
  });

  it("POSTs /auth/users", async () => {
    apiMock.mockResolvedValue({ id: "u1" });
    await userService.createUser({ email: "a@b.c", password: "x", full_name: "A", role: "SISWA" });
    expect(apiMock).toHaveBeenCalledWith("/auth/users", { method: "POST", body: { email: "a@b.c", password: "x", full_name: "A", role: "SISWA" } });
  });

  it("PATCHes /auth/users/:id/activate", async () => {
    apiMock.mockResolvedValue({ id: "u1", is_active: false });
    await userService.toggleActivate("u1", false);
    expect(apiMock).toHaveBeenCalledWith("/auth/users/u1/activate", { method: "PATCH", body: { active: false } });
  });
});