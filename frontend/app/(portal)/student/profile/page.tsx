"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import {
    Target,
    Award,
    Download,
    Settings,
    CheckCircle2,
    Shield,
    ChevronRight,
    Bell,
    KeyRound,
    LogOut,
    User as UserIcon,
    Medal,
    FileSpreadsheet,
    TrendingUp,
} from "lucide-react";

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    avatar_url?: string;
    created_at: string;
}

const STATS = [
    { icon: Medal, value: "#12", label: "Peringkat Nasional" },
    { icon: FileSpreadsheet, value: "8", label: "Tryout Selesai" },
    { icon: TrendingUp, value: "690", label: "Skor IRT" },
];

const SETTINGS = [
    { icon: Bell, label: "Notifikasi & Pengingat", danger: false },
    { icon: KeyRound, label: "Ubah Kata Sandi", danger: false },
    { icon: Target, label: "Target & Prioritas", danger: false },
    { icon: LogOut, label: "Keluar", danger: true },
];

export default function StudentProfilePage() {
    const [user, setUser] = React.useState<UserProfile | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchMe() {
            try {
                const res = await apiClient.auth.getMe();
                if (res.success && res.data && typeof res.data === "object") {
                    setUser(res.data as UserProfile);
                } else {
                    // Fallback profile matching database seed
                    setUser({
                        id: "usr-student-01",
                        email: "murid@yakinlulus.id",
                        full_name: "Murid Belajar",
                        role: "STUDENT",
                        is_active: true,
                        created_at: new Date().toISOString(),
                    });
                }
            } catch {
                setUser({
                    id: "usr-student-01",
                    email: "murid@yakinlulus.id",
                    full_name: "Murid Belajar",
                    role: "STUDENT",
                    is_active: true,
                    created_at: new Date().toISOString(),
                });
            } finally {
                setLoading(false);
            }
        }
        fetchMe();
    }, []);

    const fullName = user?.full_name || "Murid Belajar";
    const email = user?.email || "murid@yakinlulus.id";
    const role = user?.role || "STUDENT";
    const initial = fullName.charAt(0).toUpperCase();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider">PROFIL</Badge>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">Profil Saya</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola data akun, target PTN, dan sertifikat Tryout-mu.
                    </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs font-semibold shrink-0">
                    <Settings className="mr-2 h-3.5 w-3.5" /> Pengaturan
                </Button>
            </div>

            {/* Identitas + stat */}
            <Card className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-primary/10 text-primary font-black text-3xl flex items-center justify-center shrink-0">
                        {loading ? <UserIcon className="h-9 w-9 animate-pulse" /> : initial}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg md:text-xl font-extrabold truncate">{fullName}</h2>
                        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] uppercase">{role}</Badge>
                            <Badge variant="success" className="text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Terverifikasi
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 bg-muted/60 rounded-xl p-3 text-center">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="flex flex-col items-center">
                            <stat.icon className="h-4 w-4 text-primary mb-1" />
                            <span className="text-base font-extrabold">{stat.value}</span>
                            <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Target belajar + status akses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 space-y-4 md:col-span-2">
                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-primary" /> Target Sekolah & Jurusan Impian
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 space-y-2">
                            <Badge variant="default" className="text-[10px]">PILIHAN 1 (UTAMA)</Badge>
                            <h4 className="font-extrabold text-sm text-foreground">Institut Teknologi Bandung (ITB)</h4>
                            <p className="text-xs text-muted-foreground">Teknik Informatika • Passing Grade IRT: 710</p>
                            <div className="pt-2 border-t flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Skor IRT Saat Ini:</span>
                                <span className="font-black text-primary">690 (Selisih -20)</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl border space-y-2">
                            <Badge variant="outline" className="text-[10px]">PILIHAN 2</Badge>
                            <h4 className="font-extrabold text-sm text-foreground">Universitas Padjadjaran (UNPAD)</h4>
                            <p className="text-xs text-muted-foreground">Teknik Informatika • Passing Grade IRT: 650</p>
                            <div className="pt-2 border-t flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Status IRT Saat Ini:</span>
                                <span className="font-black text-success">LULUS (+40 Poin)</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="p-5 space-y-4 border-warning/30 bg-warning/5">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-warning-foreground">
                            <Shield className="h-4 w-4 text-warning" /> Status Akses Pembelajaran
                        </h3>
                        <div>
                            <h4 className="font-extrabold text-base">Super App Ultra Pass</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Akses penuh Modul & CBT Engine</p>
                        </div>
                        <ul className="text-xs space-y-1.5 text-muted-foreground font-mono">
                            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Akses 100+ Modul Video HD</li>
                            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> AI Tutor 24/7 Unlimited</li>
                            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Tryout CBT SNBT Nasional</li>
                        </ul>
                    </Card>

                    <Card className="p-5 space-y-3">
                        <h3 className="font-bold text-xs flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-primary" /> Sertifikat Kelulusan Tryout
                        </h3>
                        <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold">
                            <span>Sertifikat Tryout #03 SNBT</span>
                            <Download className="h-3.5 w-3.5 text-primary" />
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Pengaturan */}
            <Card className="p-2">
                <div className="divide-y divide-border px-2">
                    {SETTINGS.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            className="w-full flex justify-between items-center py-3 text-left"
                        >
                            <span className={`flex items-center gap-3 text-sm font-semibold ${item.danger ? "text-danger" : ""}`}>
                                <item.icon className={`h-4 w-4 ${item.danger ? "text-danger" : "text-primary"}`} />
                                {item.label}
                            </span>
                            <ChevronRight className={`h-4 w-4 ${item.danger ? "text-danger/50" : "text-muted-foreground"}`} />
                        </button>
                    ))}
                </div>
            </Card>
        </div>
    );
}
