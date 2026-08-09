import { describe, it, expect } from "vitest";
import { dumpTargetRow, formatScoreRange, sortedProvinces, defaultMaxTotal } from "./target-school-mappers";
import { TargetSchool } from "@/services/target-school.service";

const t = { id: "a", name: "SMA N 1", level: "SMA", min_score: 320, max_score: 380, max_total_score: 400, subjects: ["Mat"], academic_year: "2025/2026", is_active: true, created_at: "", updated_at: "" } as TargetSchool;

describe("dumpTargetRow", () => {
  it("maps backend fields", () => {
    expect(dumpTargetRow(t)).toEqual({
      id: "a", name: "SMA N 1", level: "SMA", province: "", city: "",
      minScore: 320, maxScore: 380, maxTotalScore: 400, academicYear: "2025/2026", isActive: true, subjects: ["Mat"],
    });
  });
});

describe("formatScoreRange", () => {
  it("renders min–max / total", () => {
    expect(formatScoreRange(320, 380, 400, "SMA")).toBe("320–380 / 400");
  });
  it("fallback max_total by level", () => {
    expect(formatScoreRange(500, 650, 0, "UNIVERSITY")).toBe("500–650 / 700");
  });
  it("empty for no scores", () => {
    expect(formatScoreRange(undefined, undefined, 400, "SMA")).toBe("-");
  });
});

describe("sortedProvinces", () => {
  it("dedups and sorts non-empty", () => {
    expect(sortedProvinces([{ province: "Jawa Barat" }, { province: "" }, { province: "DKI Jakarta" }, { province: "Jawa Barat" }]))
      .toEqual(["DKI Jakarta", "Jawa Barat"]);
  });
});

describe("defaultMaxTotal", () => {
  it("SMP/SMA 400, UNIVERSITY 700", () => {
    expect(defaultMaxTotal("SMA")).toBe(400);
    expect(defaultMaxTotal("UNIVERSITY")).toBe(700);
  });
});