"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { StatsCard } from "@/components/data-display/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/services/dashboard.service";
import { Users, Building2, Target, ArrowRight, Shield, Database, HardDrive, Activity, RefreshCw, AlertCircle } from "lucide-react";

export default function StaffDashboardPage() {
    const dashQuery = useQuery({
        queryKey: ["staff-dashboard"],
        queryFn: () => dashboardService.getAdminDashboard(),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });

    const data = dashQuery.data ?? null;
    const refetchAll = () => {
        dashQuery.refetch();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard Staff & Ops</h1>
                    <p className="text-sm text-muted-foreground">Ringkasan operasional platform, registrasi sekolah, dan audit log.</p>
                </div>
                <Button variant="outline" size="sm" onClick={refetchAll} className="rounded-lg">
                    <RefreshCw className={dashQuery.isFetching ? "animate-spin" : ""} />
                    Muat Ulang
                </Button>
            </div>

            {dashQuery.error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Gagal memuat data dashboard. Periksa koneksi lalu coba lagi.</span>
                    <Button variant="ghost" size="sm" onClick={refetchAll} className="ml-auto rounded-lg">
                        Coba Lagi
                    </Button>
                </div>
            )}

            {/* Stats */}
            {dashQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatsCard
                        title="Total Pengguna Terdaftar"
                        value={data?.kpi.total_users || 0}
                        icon={Users}
                    />
                    <StatsCard
                        title="Sekolah Mitramu"
                        value={data?.kpi.total_schools || 0}
                        icon={Building2}
                    />
                    <StatsCard
                        title="Target Sekolah Aktif"
                        value={data?.kpi.total_teachers || 0}
                        icon={Target}
                    />
                </div>
            )}

            {/* System Health */}
            {dashQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                </div>
            ) : (
                data?.system_health && (
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
                )
            )}

            {/* Quick Menu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <Link href="/staff/schools" className="flex items-center justify-between">
                        <div>
                            <h4 className="font-heading font-semibold text-sm">Kelola Sekolah</h4>
                            <p className="text-xs text-muted-foreground">Mitra sekolah & data siswa</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary" />
                    </Link>
                </Card>
                <Card className="p-4 hover:border-primary transition-colors">
                    <Link href="/staff/notifications" className="flex items-center justify-between">
                        <div>
                            <h4 className="font-heading font-semibold text-sm">Broadcast Notifikasi</h4>
                            <p className="text-xs text-muted-foreground">Kirim pengumuman massal</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary" />
                    </Link>
                </Card>
            </div>
        </div>
    );
}