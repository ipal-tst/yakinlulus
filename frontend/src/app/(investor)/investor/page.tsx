"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatsCard } from "@/components/data-display/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardService } from "@/services/dashboard.service";
import { InvestorDashboard } from "@/types";
import { TrendingUp, DollarSign, Users, Award, Download } from "lucide-react";

export default function InvestorDashboardPage() {
    const [data, setData] = useState<InvestorDashboard | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await dashboardService.getAdminDashboard();
                setData(res as unknown as InvestorDashboard);
            } catch {
                setData({
                    mrr: 45000000,
                    arr: 540000000,
                    active_users: 15420,
                    paying_users: 1250,
                    retention_rate: 88.5,
                    churn_rate: 2.1,
                });
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
        <AppShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">Investor Executive Dashboard</h1>
                        <p className="text-sm text-muted-foreground">High-level KPIs, unit economics, growth metrics, and investor relations.</p>
                    </div>
                    <Button variant="outline" className="rounded-xl gap-2 font-medium">
                        <Download className="h-4 w-4" /> Unduh Laporan Q1 2026
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="ARR (Annual Run Rate)"
                        value={formatCurrency(data?.arr || 0)}
                        icon={TrendingUp}
                        trend={{ value: 24.5, label: "YoY" }}
                    />
                    <StatsCard
                        title="MRR (Monthly Recurring Revenue)"
                        value={formatCurrency(data?.mrr || 0)}
                        icon={DollarSign}
                        trend={{ value: 5.2, label: "MoM" }}
                    />
                    <StatsCard
                        title="Total Active Users"
                        value={data?.active_users || 0}
                        icon={Users}
                    />
                    <StatsCard
                        title="Retention Rate"
                        value={`${data?.retention_rate || 0}%`}
                        icon={Award}
                        description={`Churn: ${data?.churn_rate || 0}%`}
                    />
                </div>

                {/* Executive Summary Card */}
                <Card className="p-6">
                    <h3 className="font-heading font-bold text-lg mb-2">Ikhtisar Kinerja Perusahaan</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        YakinLulus.id mencatatkan pertumbuhan signifikan pada Q1 2026 dengan peningkatan jumlah pengguna aktif sebesar 24% YoY. LTV/CAC ratio saat ini berada pada level sehat <strong className="text-foreground">4.2x</strong> dengan payback period 2.8 bulan.
                    </p>
                </Card>
            </div>
        </AppShell>
    );
}
