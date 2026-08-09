import { TargetSchool } from "@/services/target-school.service";

export type TargetRow = {
  id: string; name: string; level: string; province: string; city: string;
  minScore?: number; maxScore?: number; maxTotalScore: number; academicYear?: string; isActive: boolean; subjects: string[];
};

// province/city diisi backend via join katalog (Task 3). Type di-extend Task 6;
// mapper terima tipe gabungan supaya Task 5 compile mandiri tanpa `any`.
type TargetSchoolResolved = TargetSchool & { province?: string; city?: string; district?: string };

export function dumpTargetRow(t: TargetSchoolResolved): TargetRow {
  return {
    id: t.id, name: t.name, level: t.level,
    province: t.province ?? "", city: t.city ?? "",
    minScore: t.min_score, maxScore: t.max_score, maxTotalScore: t.max_total_score,
    academicYear: t.academic_year, isActive: t.is_active, subjects: t.subjects ?? [],
  };
}

export function defaultMaxTotal(level: string): number {
  return level === "UNIVERSITY" ? 700 : 400;
}

export function formatScoreRange(min?: number, max?: number, total?: number, level?: string): string {
  if (min === undefined || max === undefined) return "-";
  const t = total && total > 0 ? total : defaultMaxTotal(level ?? "");
  return `${min}–${max} / ${t}`;
}

export function sortedProvinces(schools: { province?: string }[]): string[] {
  return Array.from(new Set(schools.map((s) => s.province ?? "").filter(Boolean))).sort((a, b) => a.localeCompare(b, "id"));
}