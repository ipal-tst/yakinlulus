// src/components/admin/analytics/OverviewKPISection.tsx
"use client";

import { StatsCard } from "@/components/data-display/stats-card";
import { AdminOverview } from "@/services/analytics.service";
import { Users, GraduationCap, FileCheck, HelpCircle } from "lucide-react";

export function OverviewKPISection({ overview }: { overview: AdminOverview }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Siswa" value={overview.total_students ?? 0} icon={Users} />
            <StatsCard title="Total Pengajar/Guru" value={overview.total_teachers ?? 0} icon={GraduationCap} />
            <StatsCard title="Paket Ujian Dipublikasi" value={overview.total_exams ?? 0} icon={FileCheck} />
            <StatsCard title="Total Soal Terdaftar" value={overview.total_questions ?? 0} icon={HelpCircle} />
        </div>
    );
}