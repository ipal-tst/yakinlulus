import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { notificationService } from "./notification.service";

describe("notificationService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("POSTs /notifications/broadcast", async () => {
    apiMock.mockResolvedValue({ message: "ok" });
    await notificationService.broadcast({ title: "T", message: "M" });
    expect(apiMock).toHaveBeenCalledWith("/notifications/broadcast", { method: "POST", body: { title: "T", message: "M" } });
  });

  it("GETs /notifications/templates", async () => {
    apiMock.mockResolvedValue([]);
    await notificationService.listTemplates();
    expect(apiMock).toHaveBeenCalledWith("/notifications/templates");
  });
});