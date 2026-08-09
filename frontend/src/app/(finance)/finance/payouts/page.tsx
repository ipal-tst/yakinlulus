"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banknote, CheckCircle2, Clock, Send } from "lucide-react";

export default function FinancePayoutsPage() {
    const [payouts, setPayouts] = useState([
        { id: "po-1", guru_name: "Dr. Aris Setiawan", bank_account: "BCA 8410293812", amount: 3450000, status: "PENDING", date: "2026-03-01" },
        { id: "po-2", guru_name: "Novi Fitriani, M.Pd", bank_account: "Mandiri 13700192837", amount: 2800000, status: "PAID", date: "2026-02-28" },
    ]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
    };

    const handleApprove = (id: string) => {
        setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "PAID" } : p)));
    };

    return (

            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Manajemen Payout & Royalti Guru</h1>
                    <p className="text-sm text-muted-foreground">Proses pengajuan pencairan komisi dan royalti pembuat soal/materi.</p>
                </div>

                <Card className="p-4 divide-y divide-border">
                    {payouts.map((p) => (
                        <div key={p.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant={p.status === "PAID" ? "success" : "default"} className="text-[10px]">
                                        {p.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">{p.bank_account}</span>
                                </div>
                                <h3 className="font-heading font-bold text-base">{p.guru_name}</h3>
                                <p className="text-xs text-muted-foreground">Tanggal Pengajuan: {p.date}</p>
                            </div>

                            <div className="flex items-center gap-4 self-end md:self-auto">
                                <span className="font-heading font-bold text-lg text-primary">{formatCurrency(p.amount)}</span>
                                {p.status === "PENDING" && (
                                    <Button onClick={() => handleApprove(p.id)} size="sm" className="rounded-xl gap-1.5 font-bold">
                                        <Send className="h-3.5 w-3.5" /> Transfer Payout
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </Card>
            </div>

    );
}
