import { describe, it, expect } from "vitest";
import { dumpKPI, mapExamStatus, mapScoreDistribution, formatPct, formatAvg, uptimeLabel } from "./dashboard-mappers";
import { AdminDashboard, CBTMonitoring } from "@/types/admin";

const dash = {
  kpi: { total_students: 120, total_teachers: 8, total_questions: 340, total_materials: 55, total_exams: 12, total_users: 0, active_today: 0, total_schools: 0 },
  active_users: { online_now: 3, active_24h: 88 },
  school_stats: { total: 10, active: 7, verified: 4 },
} as AdminDashboard;

describe("dumpKPI", () => {
  it("memetakan field operasional yang benar", () => {
    const k = dumpKPI(dash);
    expect(k).toEqual({
      students: 120,
      teachers: 8,
      active24: 88,
      onlineNow: 3,
      schoolActive: 7,
      schoolTotal: 10,
      schoolVerified: 4,
      contentQuestions: 340,
      contentMaterials: 55,
      contentExams: 12,
    });
  });
});

describe("mapExamStatus", () => {
  it("memetakan scheduled→Draft, running→Published, finished→Archived", () => {
    const m: CBTMonitoring = { scheduled: 2, running: 5, finished: 9 };
    expect(mapExamStatus(m)).toEqual([
      { label: "Draft", value: 2 },
      { label: "Published", value: 5 },
      { label: "Archived", value: 9 },
    ]);
  });
});

describe("mapScoreDistribution", () => {
  it("memetakan 4 bracket", () => {
    const d = mapScoreDistribution({
      score_distribution: { bracket_700_plus: 3, bracket_600_699: 4, bracket_500_599: 5, bracket_below_500: 2 },
      total_participants: 14,
    });
    expect(d).toHaveLength(4);
    expect(d[0].name).toBe("≥700");
    expect(d.reduce((s, x) => s + x.value, 0)).toBe(14);
  });
  it("mengembalikan empty saat nihil", () => {
    expect(mapScoreDistribution({})).toEqual([]);
  });
});

describe("formatPct / formatAvg / uptimeLabel", () => {
  it("pass_rate tetap % (0-100) tanpa dikali 100", () => {
    expect(formatPct(85)).toBe("85.0%");
    expect(formatPct(0)).toBe("0.0%");
    expect(formatPct(undefined)).toBe("-");
  });
  it("formatAvg 1 desimal", () => {
    expect(formatAvg(64.25)).toBe("64.3");
    expect(formatAvg(undefined)).toBe("-");
  });
  it("uptime", () => {
    expect(uptimeLabel(undefined)).toBe("-");
    expect(uptimeLabel(50)).toBe("2 hari");
    expect(uptimeLabel(5)).toBe("5 jam");
  });
});