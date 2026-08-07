// src/components/admin/audit/AuditStatsCards.tsx
"use client";

import { StatsCard } from "@/components/data-display/stats-card";
import { AuditStats } from "@/services/audit.service";
import { ScrollText, ShieldAlert, AlertTriangle, CalendarClock } from "lucide-react";

export function AuditStatsCards({ stats }: { stats: AuditStats }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Log Audit" value={stats.total_logs} icon={ScrollText} />
            <StatsCard title="Kritis" value={stats.critical_count} icon={ShieldAlert} iconBgColor="bg-red-50 dark:bg-red-950" />
            <StatsCard title="Peringatan" value={stats.warning_count} icon={AlertTriangle} iconBgColor="bg-orange-50 dark:bg-orange-950" />
            <StatsCard title="Kegiatan Hari Ini" value={stats.today_count} icon={CalendarClock} />
        </div>
    );
}