"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Search, Download, ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function FinanceTransactionsPage() {
    const [search, setSearch] = useState("");
    const [transactions] = useState([
        { id: "trx-1001", user: "Budi Santoso", package: "Paket Intensif SNBT 2026", amount: 250000, date: "2026-03-01 14:10", status: "PAID", method: "QRIS" },
        { id: "trx-1002", user: "Siti Rahma", package: "Try Out UTBK #5 Single Pass", amount: 49000, date: "2026-03-01 13:45", status: "PAID", method: "BCA Virtual Account" },
        { id: "trx-1003", user: "SMA Negeri 8 Jakarta", package: "B2B School License 500 Seats", amount: 15000000, date: "2026-02-28 09:00", status: "PAID", method: "Bank Transfer" },
    ]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
    };

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">Riwayat Transaksi & Pembayaran</h1>
                        <p className="text-sm text-muted-foreground">Monitoring arus kas masuk dari pembelian paket try out, langganan siswa, dan lisensi B2B.</p>
                    </div>
                    <Button variant="outline" className="rounded-xl gap-2 font-medium">
                        <Download className="h-4 w-4" /> Ekspor Laporan CSV
                    </Button>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari ID transaksi atau nama..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Card className="p-4 space-y-3">
                    {transactions.map((t) => (
                        <div key={t.id} className="p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary transition-all">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="success" className="text-[10px] gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> {t.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{t.method}</span>
                                    <span className="text-[10px] text-muted-foreground">{t.date}</span>
                                </div>
                                <h3 className="font-heading font-bold text-base text-foreground">{t.package}</h3>
                                <p className="text-xs text-muted-foreground">Pembayar: {t.user} (ID: {t.id})</p>
                            </div>

                            <div className="text-right self-end md:self-auto">
                                <span className="font-heading font-bold text-lg text-primary">{formatCurrency(t.amount)}</span>
                                <span className="block text-[10px] text-muted-foreground">Lunas</span>
                            </div>
                        </div>
                    ))}
                </Card>
            </div>
        </AppShell>
    );
}
