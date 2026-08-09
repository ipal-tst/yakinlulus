"use client";
import { Users, Wifi, GraduationCap, BookOpenCheck, Building2, Layers } from "lucide-react";
import { StatsCard } from "@/components/data-display/stats-card";
import { dumpKPI } from "@/lib/dashboard-mappers";
import type { AdminDashboard } from "@/types/admin";

export function AdminKPIGrid({ dash }: { dash: AdminDashboard | null }) {
    const k = dumpKPI(dash);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatsCard title="Pengguna Aktif 24j" value={k.active24} icon={Users} />
            <StatsCard title="Online Sekarang" value={k.onlineNow} icon={Wifi} description="live" />
            <StatsCard title="Total Siswa" value={k.students} icon={GraduationCap} />
            <StatsCard title="Total Guru" value={k.teachers} icon={BookOpenCheck} />
            <StatsCard
                title="Sekolah Aktif"
                value={k.schoolActive}
                description={`terdaftar ${k.schoolTotal} · terverifikasi ${k.schoolVerified}`}
                icon={Building2}
            />
            <StatsCard
                title="Konten Platform"
                value={k.contentQuestions}
                description={`${k.contentMaterials} materi · ${k.contentExams} ujian`}
                icon={Layers}
            />
        </div>
    );
}