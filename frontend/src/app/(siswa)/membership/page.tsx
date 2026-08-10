// frontend/src/app/(siswa)/membership/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { academicService } from "@/services/academic.service";
import { ExamPackage } from "@/types";
import { CreditCard, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

const MEMBERSHIP_LABEL: Record<string, string> = {
    ACTIVE: "Aktif",
    TRIAL: "Trial",
    INACTIVE: "Nonaktif",
};

const EDUCATION_LABEL: Record<string, string> = {
    SD: "SD",
    SMP: "SMP",
    SMA: "SMA",
    UNIVERSITY: "Kuliah",
};

export default function MembershipPage() {
    const { user } = useAuthStore();
    const [packages, setPackages] = useState<ExamPackage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getExamPackages();
                setPackages(Array.isArray(res) ? res : []);
            } catch {
                // Fallback demo (infrastruktur belum sepenuhnya siap)
                setPackages([
                    { id: "p-1", code: "UTBK-1", name: "Paket Try Out UTBK Bulanan", education_level: "SMA", is_active: true, created_at: "", updated_at: "" },
                    { id: "p-2", code: "UTBK-3", name: "Paket Try Out UTBK 3 Bulan", education_level: "SMA", is_active: true, created_at: "", updated_at: "" },
                    { id: "p-3", code: "SMP-1", name: "Paket Latihan SMP", education_level: "SMP", is_active: true, created_at: "", updated_at: "" },
                    { id: "p-4", code: "SD-PRO", name: "Paket SD Premium", education_level: "SD", is_active: true, created_at: "", updated_at: "" },
                ]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const status = user?.membership_status || "INACTIVE";

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Membership</h1>
                    <p className="text-sm text-muted-foreground">Pantau status keanggotaan dan pilih paket try out yang sesuai dengan kebutuhan belajarmu.</p>
                </div>

                {/* Status Membership */}
                <Card className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Status Keanggotaan</p>
                                <p className="font-heading font-bold text-lg">
                                    {MEMBERSHIP_LABEL[status] ?? "Nonaktif"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {status === "TRIAL" && <Badge variant="secondary">Masa percobaan</Badge>}
                            {status === "ACTIVE" && <Badge className="bg-green-100 text-green-700">Aktif</Badge>}
                            {status === "INACTIVE" && <Badge variant="outline">Belum berlangganan</Badge>}
                            <Button className="rounded-xl">
                                <Sparkles className="h-4 w-4" />
                                Perpanjang
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Paket Tersedia */}
                <div>
                    <h2 className="font-heading text-lg font-bold mb-1">Paket Tersedia</h2>
                    <p className="text-sm text-muted-foreground mb-4">Pilih paket untuk mengakses try out dan materi exclusive.</p>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {packages.map((pkg) => (
                                <Card key={pkg.id} className="p-6 flex flex-col">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline">
                                            {EDUCATION_LABEL[pkg.education_level] ?? pkg.education_level}
                                        </Badge>
                                    </div>
                                    <h3 className="font-heading font-bold text-base mb-1">{pkg.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                                        Kode paket: <span className="font-mono">{pkg.code}</span>
                                    </p>
                                    <div className="flex-1" />
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button className="w-full rounded-xl" disabled={!pkg.is_active}>
                                            Pilih Paket
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Pembayaran dan aktivasi paket sedang disiapkan. Hubungi admin untuk informasi paket dan pembayaran.</p>
                </div>
            </div>
        </AppShell>
    );
}