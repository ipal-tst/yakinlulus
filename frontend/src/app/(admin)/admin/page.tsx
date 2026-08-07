"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatsCard } from "@/components/data-display/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/services/dashboard.service";
import { AdminDashboard } from "@/types/admin";
import {
    Users,
    Building2,
    ArrowRight,
    Shield,
    Database,
    HardDrive,
    Activity,
    BookOpen,
    FileCheck,
    HelpCircle,
    AlertCircle,
    Clock,
} from "lucide-react";

export default function AdminDashboardPage() {
    const [data, setData] = useState<AdminDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await dashboardService.getAdminDashboard();
            setData(res);
        } catch (err: any) {
            setError(err?.message || "Gagal memuat data dashboard super admin.");
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard Super Admin</h1>
                        <p className="text-sm text-muted-foreground">Ringkasan sistem, pengguna, dan status operasional platform realtime.</p>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                        <Button variant="ghost" size="sm" onClick={loadData} className="ml-auto rounded-lg">
                            Coba Lagi
                        </Button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 rounded-2xl" />
                        ))
                    ) : (
                        <>
                            <StatsCard title="Total Pengguna Aktif" value={data?.active_users?.online_now || 0} icon={Users} />
                            <StatsCard title="Sekolah Terdaftar" value={data?.school_stats?.total || 0} icon={Building2} />
                            <StatsCard title="Total Soal" value={data?.kpi?.total_questions || 0} icon={HelpCircle} />
                            <StatsCard title="Total Materi" value={data?.kpi?.total_materials || 0} icon={BookOpen} />
                            <StatsCard title="Total Ujian" value={data?.kpi?.total_exams || 0} icon={FileCheck} />
                            <StatsCard title="Siswa Aktif (24h)" value={data?.active_users?.active_24h || 0} icon={Users} />
                            <StatsCard title="CBT Berjalan" value={data?.cbt_monitoring?.running || 0} icon={Activity} />
                            <StatsCard title="CBT Terjadwal" value={data?.cbt_monitoring?.scheduled || 0} icon={FileCheck} />
                        </>
                    )}
                </div>

                {/* System Health */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 rounded-2xl" />
                        ))}
                    </div>
                ) : data?.system_health ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <Card className="p-4 hover:border-primary transition-colors rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="font-semibold text-sm">API Status</p>
                                    <p className="text-xs text-muted-foreground capitalize">{data.system_health.api_status || "Healthy"}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 hover:border-primary transition-colors rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="font-semibold text-sm">DB Status</p>
                                    <p className="text-xs text-muted-foreground capitalize">{data.system_health.db_status || "Healthy"}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 hover:border-primary transition-colors rounded-2xl">
                            <div className="flex items-center gap-3">
                                <HardDrive className="h-5 w-5 text-orange-500" />
                                <div>
                                    <p className="font-semibold text-sm">Storage</p>
                                    <p className="text-xs text-muted-foreground">{data.system_health.storage_usage || 0}% used</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 hover:border-primary transition-colors rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Activity className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="font-semibold text-sm">Uptime</p>
                                    <p className="text-xs text-muted-foreground">{Math.floor((data.system_health.uptime_hours || 0) / 24)} hari</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : null}

                {/* Quick Navigation Menu */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 hover:border-primary transition-colors rounded-2xl">
                        <Link href="/admin/academic" className="flex items-center justify-between">
                            <div>
                                <h4 className="font-heading font-semibold text-sm">Master Akademik</h4>
                                <p className="text-xs text-muted-foreground">Kelola jenjang, kelas, mapel, bab</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-primary" />
                        </Link>
                    </Card>
                    <Card className="p-4 hover:border-primary transition-colors rounded-2xl">
                        <Link href="/staff/users" className="flex items-center justify-between">
                            <div>
                                <h4 className="font-heading font-semibold text-sm">Kelola User</h4>
                                <p className="text-xs text-muted-foreground">Aktifkan/nonaktifkan akun</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-primary" />
                        </Link>
                    </Card>
                    <Card className="p-4 hover:border-primary transition-colors rounded-2xl">
                        <Link href="/admin/analytics" className="flex items-center justify-between">
                            <div>
                                <h4 className="font-heading font-semibold text-sm">Analitik &amp; Laporan</h4>
                                <p className="text-xs text-muted-foreground">Laporan sistem &amp; performa</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-primary" />
                        </Link>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Aktivitas Sistem Terbaru
                    </h3>
                    {isLoading ? (
                        <Skeleton className="h-16 w-full rounded-2xl" />
                    ) : !data?.recent_activity || data.recent_activity.length === 0 ? (
                        <Card className="p-6 text-center text-muted-foreground rounded-2xl">
                            <p className="text-xs">Belum ada catatan aktivitas sistem terbaru di database.</p>
                        </Card>
                    ) : (
                        data.recent_activity.map((item, i) => (
                            <Card key={i} className="p-3.5 rounded-xl flex items-center justify-between">
                                <p className="text-xs text-foreground font-medium">{item.message}</p>
                                <span className="text-[10px] text-muted-foreground shrink-0">{item.created_at}</span>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppShell>
    );
}
