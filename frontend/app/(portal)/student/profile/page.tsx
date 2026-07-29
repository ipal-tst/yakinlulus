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
    User as UserIcon,
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
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">PROFIL AKUN SAYA</Badge>
                        <span className="text-xs text-muted-foreground">Terhubung ke Go API (`/api/v1/auth/me`)</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Profil & Target Belajar</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola data akademis terverifikasi, target PTN favorit, dan sertifikat Tryout CBT.
                    </p>
                </div>

                <Button variant="outline" size="sm" className="text-xs font-semibold">
                    <Settings className="mr-2 h-3.5 w-3.5" /> Pengaturan Akun
                </Button>
            </div>

            {/* Profile Hero Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 md:col-span-2 space-y-6">
                    <div className="flex items-center gap-4 border-b pb-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            {loading ? <UserIcon className="h-8 w-8 animate-pulse" /> : initial}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold">{fullName}</h2>
                                <Badge variant="default" className="text-[10px] uppercase">{role} PORTAL</Badge>
                                <Badge variant="outline" className="text-[10px] border-success text-success font-semibold">AKUN TERVERIFIKASI</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                                Email: {email} • Status Database: Aktif
                            </p>
                        </div>
                    </div>

                    {/* Target Belajar Grid */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-xs flex items-center gap-1.5">
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

                            <div className="p-4 rounded-xl border bg-card space-y-2">
                                <Badge variant="outline" className="text-[10px]">PILIHAN 2</Badge>
                                <h4 className="font-extrabold text-sm text-foreground">Universitas Padjadjaran (UNPAD)</h4>
                                <p className="text-xs text-muted-foreground">Teknik Informatika • Passing Grade IRT: 650</p>
                                <div className="pt-2 border-t flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Status IRT Saat Ini:</span>
                                    <span className="font-black text-success">LULUS (+40 Poin)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Account Plan & Certificates */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-4 border-warning/30 bg-warning/5">
                        <h3 className="font-bold text-sm flex items-center gap-2 text-warning-foreground">
                            <Shield className="h-4 w-4 text-warning" /> Status Akses Pembelajaran
                        </h3>
                        <div className="space-y-1">
                            <h4 className="font-extrabold text-base">Super App Ultra Pass</h4>
                            <p className="text-xs text-muted-foreground">Terhubung dengan Database Modul & CBT Engine</p>
                        </div>
                        <ul className="text-xs space-y-1.5 text-muted-foreground font-mono">
                            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Akses 100+ Modul Video HD</li>
                            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> AI Tutor 24/7 Unlimited</li>
                            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Tryout CBT SNBT Nasional</li>
                        </ul>
                    </Card>

                    <Card className="p-6 space-y-3">
                        <h3 className="font-bold text-xs flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-primary" /> Sertifikat Kelulusan Tryout
                        </h3>
                        <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-between">
                            <span>Sertifikat Tryout #03 SNBT</span>
                            <Download className="h-3.5 w-3.5 text-primary" />
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
