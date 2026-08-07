"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatsCard } from "@/components/data-display/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardService } from "@/services/dashboard.service";
import { AdminDashboard } from "@/types/admin";
import {
    Users,
    Building2,
    Target,
    Bell,
    ArrowRight,
    Shield,
    Database,
    HardDrive,
    Activity,
    BookOpen,
    FileCheck,
    HelpCircle,
    BarChart3,
} from "lucide-react";

export default function AdminDashboardPage() {
    const [data, setData] = useState<AdminDashboard | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await dashboardService.getAdminDashboard();
                setData(res);
            } catch {
                setData({
                    kpi: {
                        total_users: 15420,
                        active_today: 1240,
                        total_schools: 85,
                        total_teachers: 320,
                        total_students: 12500,
                        total_exams: 450,
                        total_materials: 1200,
                        total_questions: 15000,
                    },
                    system_health: {
                        api_status: "healthy",
                        db_status: "healthy",
                        storage_usage: 45,
                        uptime_hours: 720,
                    },
                    active_users: {
                        online_now: 1240,
                        active_24h: 5200,
                    },
                    school_stats: {
                        total: 85,
                        active: 78,
                        verified: 72,
                    },
                    cbt_monitoring: {
                        scheduled: 12,
                        running: 3,
                        finished: 15,
                    },
                    recent_activity: [
                        { type: "CREATE_USER", message: "Staff Admin created Siswa Baru (Ahmad)", created_at: "10 menit yang lalu" },
                        { type: "UPDATE_SCHOOL", message: "Staff Admin updated SMA Negeri 1 Jakarta", created_at: "1 jam yang lalu" },
                    ],
                });
            }
        }
        loadData();
    }, []);

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard Super Admin</h1>
                    <p className="text-sm text-muted-foreground">Ringkasan sistem, pengguna, dan status operasional platform.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard title="Total Pengguna Aktif" value={data?.active_users?.online_now || 0} icon={Users} />
                    <StatsCard title="Sekolah Terdaftar" value={data?.school_stats?.total || 0} icon={Building2} />
                    <StatsCard title="Total Soal" value={data?.kpi.total_questions || 0} icon={HelpCircle} />
                    <StatsCard title="Total Materi" value={data?.kpi.total_materials || 0} icon={BookOpen} />
                    <StatsCard title="Total Ujian" value={data?.kpi.total_exams || 0} icon={FileCheck} />
                    <StatsCard title="Siswa Aktif (24h)" value={data?.active_users?.active_24h || 0} icon={Users} />
                    <StatsCard title="CBT Berjalan" value={data?.cbt_monitoring?.running || 0} icon={Activity} />
                    <StatsCard title="CBT Terjadwal" value={data?.cbt_monitoring?.scheduled || 0} icon={FileCheck} />
                </div>

                {/* System Health */}
                {data?.system_health && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <Card className="p-4 hover:border-primary transition-colors">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="font-semibold text-sm">API Status</p>
                                    <p className="text-xs text-muted-foreground capitalize">{data.system_health.api_status}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 hover:border-primary transition-colors">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="font-semibold text-sm">DB Status</p>
                                    <p className="text-xs text-muted-foreground capitalize">{data.system_health.db_status}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 hover:border-primary transition-colors">
                            <div className="flex items-center gap-3">
                                <HardDrive className="h-5 w-5 text-orange-500" />
                                <div>
                                    <p className="font-semibold text-sm">Storage</p>
                                    <p className="text-xs text-muted-foreground">{data.system_health.storage_usage}% used</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 hover:border-primary transition-colors">
                            <div className="flex items-center gap-3">
                                <Activity className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="font-semibold text-sm">Uptime</p>
                                    <p className="text-xs text-muted-foreground">{Math.floor((data.system_health.uptime_hours || 0) / 24)} hari</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Quick Menu */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 hover:border-primary transition-colors">
                        <Link href="/admin/academic" className="flex items-center justify-between">
                            <div>
                                <h4 className="font-heading font-semibold text-sm">Master Akademik</h4>
                                <p className="text-xs text-muted-foreground">Kelola jenjang, kelas, mapel, bab</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-primary" />
                        </Link>
                    </Card>
                    <Card className="p-4 hover:border-primary transition-colors">
                        <Link href="/staff/users" className="flex items-center justify-between">
                            <div>
                                <h4 className="font-heading font-semibold text-sm">Kelola User</h4>
                                <p className="text-xs text-muted-foreground">Aktifkan/nonaktifkan akun</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-primary" />
                        </Link>
                    </Card>
                    <Card className="p-4 hover:border-primary transition-colors">
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
                {data?.recent_activity && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Aktivitas Terbaru</h3>
                        {data.recent_activity.map((item, i) => (
                            <Card key={i} className="p-3">
                                <p className="text-sm text-muted-foreground">{item.message}</p>
                                <span className="text-xs text-muted-foreground/60">{item.created_at}</span>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
