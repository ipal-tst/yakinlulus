export type KPIValues = {
    students: number;
    teachers: number;
    active24: number;
    onlineNow: number;
    schoolActive: number;
    schoolTotal: number;
    schoolVerified: number;
    contentQuestions: number;
    contentMaterials: number;
    contentExams: number;
};
export type ExamStatus = { label: "Draft" | "Published" | "Archived"; value: number };
export type ScoreBracket = { name: string; value: number; color: string };

export function dumpKPI(d: { kpi?: any; active_users?: any; school_stats?: any }): KPIValues {
    const k = d.kpi ?? {};
    const a = d.active_users ?? {};
    const s = d.school_stats ?? {};
    return {
        students: k.total_students ?? 0,
        teachers: k.total_teachers ?? 0,
        active24: a.active_24h ?? 0,
        onlineNow: a.online_now ?? 0,
        schoolActive: s.active ?? 0,
        schoolTotal: s.total ?? 0,
        schoolVerified: s.verified ?? 0,
        contentQuestions: k.total_questions ?? 0,
        contentMaterials: k.total_materials ?? 0,
        contentExams: k.total_exams ?? 0,
    };
}

export function mapExamStatus(m: { scheduled?: number; running?: number; finished?: number }): ExamStatus[] {
    return [
        { label: "Draft", value: m.scheduled ?? 0 },
        { label: "Published", value: m.running ?? 0 },
        { label: "Archived", value: m.finished ?? 0 },
    ];
}

const BRACKET_COLORS = ["#2563eb", "#16a34a", "#f97316", "#7c3aed"];

export function mapScoreDistribution(overview: any): ScoreBracket[] {
    const sd = overview?.score_distribution;
    if (!sd) return [];
    const items: [string, number][] = [
        ["≥700", sd.bracket_700_plus ?? 0],
        ["600–699", sd.bracket_600_699 ?? 0],
        ["500–599", sd.bracket_500_599 ?? 0],
        ["<500", sd.bracket_below_500 ?? 0],
    ];
    return items.filter(([, v]) => v > 0).map(([name, value], i) => ({ name, value, color: BRACKET_COLORS[i % BRACKET_COLORS.length] }));
}

export function formatPct(v?: number): string {
    if (v === undefined || v === null) return "-";
    return `${v.toFixed(1)}%`;
}

export function formatAvg(v?: number): string {
    if (v === undefined || v === null) return "-";
    return v.toFixed(1);
}

export function uptimeLabel(h?: number): string {
    if (h === undefined || h === null || h <= 0) return "-";
    if (h < 24) return `${Math.round(h)} jam`;
    return `${Math.floor(h / 24)} hari`;
}