"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { StatsCard } from "@/components/data-display/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardService } from "@/services/dashboard.service";
import { AdminDashboard } from "@/types/admin";
import { DollarSign, Users, Receipt, TrendingUp } from "lucide-react";

export default function FinanceDashboardPage() {
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
                        {
                            type: "PAYMENT",
                            message: "Budi Santoso paid for Paket Intensif SNBT 6 Bulan",
                            created_at: "2026-03-02",
                        },
                        {
                            type: "PAYMENT",
                            message: "Siti Rahma paid for Paket Tryout Unlimited",
                            created_at: "2026-03-01",
                        },
                    ],
                } as AdminDashboard);
            }
        }
        loadData();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (

            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard Keuangan & Modul Finance</h1>
                    <p className="text-sm text-muted-foreground">Metrik pendapatan, langganan aktif, paket membership, dan pembayaran.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatsCard
                        title="Total Pendapatan (Gross)"
                        value={formatCurrency(data?.total_revenue || 0)}
                        icon={DollarSign}
                        trend={{ value: 18.5, label: "vs bulan lalu" }}
                    />
                    <StatsCard
                        title="Siswa Berlangganan Aktif"
                        value={data?.active_subscribers || 0}
                        icon={Users}
                        trend={{ value: 12, label: "tumbuh" }}
                    />
                    <StatsCard
                        title="MRR (Monthly Recurring Revenue)"
                        value={formatCurrency(data?.monthly_recurring_revenue || 0)}
                        icon={TrendingUp}
                    />
                </div>

                {/* Payment History List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" /> Transaksi Terakhir
                            </CardTitle>
                            <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
                                <Link href="/finance/payments">Lihat Semua Transaksi</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {data?.recent_payments && data.recent_payments.length > 0 ? (
                            <div className="space-y-3">
                                {data.recent_payments.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/60"
                                    >
                                        <div>
                                            <h4 className="font-heading font-semibold text-sm">{p.user_name}</h4>
                                            <p className="text-xs text-muted-foreground">{p.plan_name} • {p.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-heading font-bold text-sm text-primary">
                                                {formatCurrency(p.amount)}
                                            </span>
                                            <span className="block text-[10px] text-green-600 font-semibold">{p.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                Belum ada transaksi recorded.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

    );
}
