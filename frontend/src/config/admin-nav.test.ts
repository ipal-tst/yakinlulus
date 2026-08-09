import { describe, it, expect } from "vitest";
import { getAdminNav, isNavActive, findActiveNav, flattenNav, dashboardHref } from "./admin-nav";

describe("admin-nav", () => {
  it("filters groups by role: FINANCE does not see Master Akademik", () => {
    const finance = getAdminNav("FINANCE");
    const titles = finance.map((g) => g.title);
    expect(titles).toContain("Finance & Membership");
    expect(titles).not.toContain("Master Akademik");
  });

  it("always puts Dashboard first", () => {
    const nav = getAdminNav("STAFF");
    expect(nav[0].title).toBe("Dashboard");
    expect(nav[0].items[0].href).toBe("/staff");
  });

  it("SUPER_ADMIN sees every group", () => {
    const nav = getAdminNav("SUPER_ADMIN");
    const titles = nav.map((g) => g.title);
    expect(titles).toEqual(
      expect.arrayContaining(["Master Akademik", "Konten & Ujian", "Finance & Membership"])
    );
  });

  it("hides group when no item matches role", () => {
    const guru = getAdminNav("GURU");
    const titles = guru.map((g) => g.title);
    expect(titles).not.toContain("Finance & Membership");
    expect(titles).toContain("Konten & Ujian");
  });

  it("matches active nav by prefix, dashboard routes by exact", () => {
    expect(isNavActive("/admin/materials", "/admin/materials")).toBe(true);
    expect(isNavActive("/admin/materials", "/admin")).toBe(false);
    expect(isNavActive("/admin", "/admin/exams")).toBe(false);
    expect(isNavActive("/admin", "/admin")).toBe(true);
  });

  it("findActiveNav returns the matching item", () => {
    const nav = getAdminNav("STAFF");
    const m = findActiveNav(nav, "/staff/schools");
    expect(m?.item.title).toBe("Kelola Sekolah");
    expect(m?.group.title).toBe("Master Akademik");
  });

  it("flattenNav lists all reachable items", () => {
    const nav = getAdminNav("STAFF");
    const flat = flattenNav(nav);
    expect(flat.every((i) => i.href.startsWith("/"))).toBe(true);
    expect(flat.length).toBeGreaterThan(0);
  });

  it("dashboardHref maps every role", () => {
    expect(dashboardHref("SUPER_ADMIN")).toBe("/admin");
    expect(dashboardHref("GURU")).toBe("/guru");
    expect(dashboardHref("SISWA")).toBe("/siswa");
  });
});