"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_CONFIG } from "@/config/app";
import { Mail, User, GraduationCap, CheckCircle2, Lock, ArrowLeft, Phone, Eye, EyeOff, Gift, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function RegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [educationLevel, setEducationLevel] = React.useState("SMA Kelas 10-12");
    const [schoolName, setSchoolName] = React.useState("");
    const [targetUniv, setTargetUniv] = React.useState("Institut Teknologi Bandung (ITB) - Teknik Informatika");
    const [password, setPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [agreeTerms, setAgreeTerms] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    // Password strength logic
    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: "Kosong", color: "bg-muted" };
        if (pass.length < 6) return { score: 1, label: "Lemah", color: "bg-rose-500" };
        if (pass.length < 10) return { score: 2, label: "Sedang", color: "bg-amber-500" };
        return { score: 3, label: "Sangat Kuat", color: "bg-emerald-500" };
    };

    const strength = getPasswordStrength(password);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const res = await apiClient.auth.register({
                email,
                password,
                full_name: fullName,
                role: "STUDENT",
            });

            if (res.success) {
                router.push("/login?registered=true");
            } else {
                setErrorMessage(res.error || "Gagal mendaftarkan akun. Email mungkin sudah terdaftar.");
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Terjadi kesalahan koneksi saat registrasi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 sm:p-8 relative">
            <div className="absolute top-6 left-6">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2 text-xs text-[#64748B] hover:text-[#1E293B]">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
                    </Button>
                </Link>
            </div>

            <div className="w-full max-w-md space-y-6 pt-10">
                {/* 500 Beta Tester Promo Alert */}
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-amber-800">
                        <Gift className="h-4 w-4 animate-bounce text-amber-600" /> PROMO 500 BETA TESTERS FIRST COME FIRST SERVED
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                        Daftar sekarang & nikmati <strong>Gratis 6 Bulan Akses Premium</strong> Rp 10.000/bulan!
                    </p>
                </div>

                <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1565C0] text-white font-extrabold text-xl shadow-lg">
                        YL
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">{APP_CONFIG.name}</h1>
                    <p className="text-xs text-[#64748B]">
                        SaaS EdTech Super App — Belajar Berkualitas Cuma Rp 10.000/bulan
                    </p>
                </div>

                {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <Card className="shadow-xl border border-[#E2E8F0] bg-white">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-lg text-[#1E293B]">Pendaftaran Akun Siswa</CardTitle>
                        <CardDescription className="text-xs text-[#64748B]">
                            Isi formulir di bawah ini untuk membuat akun terintegrasi database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#1E293B]">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                                    <Input
                                        placeholder="Contoh: Budi Santoso"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-9 text-xs border-[#E2E8F0]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#1E293B]">Alamat Email Aktif</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                                    <Input
                                        type="email"
                                        placeholder="budi@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9 text-xs border-[#E2E8F0]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#1E293B]">Nomor WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                                    <Input
                                        placeholder="081234567890"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="pl-9 text-xs border-[#E2E8F0]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#1E293B]">Jenjang Belajar</label>
                                    <select
                                        value={educationLevel}
                                        onChange={(e) => setEducationLevel(e.target.value)}
                                        className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#1565C0]"
                                    >
                                        <option value="SD Kelas 4-6">SD (Kelas 4-6)</option>
                                        <option value="SMP Kelas 7-9">SMP (Kelas 7-9)</option>
                                        <option value="SMA Kelas 10-12">SMA (Kelas 10-12)</option>
                                        <option value="Gap Year UTBK">Gap Year / UTBK</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#1E293B]">Asal Sekolah</label>
                                    <Input
                                        placeholder="Nama Sekolah"
                                        value={schoolName}
                                        onChange={(e) => setSchoolName(e.target.value)}
                                        className="text-xs border-[#E2E8F0]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#1E293B]">Target PTN / Sekolah Lanjutan</label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                                    <select
                                        value={targetUniv}
                                        onChange={(e) => setTargetUniv(e.target.value)}
                                        className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white px-3 pl-9 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#1565C0]"
                                    >
                                        <option value="Institut Teknologi Bandung (ITB) - Teknik Informatika">ITB - Teknik Informatika</option>
                                        <option value="Universitas Indonesia (UI) - Kedokteran">UI - Kedokteran</option>
                                        <option value="Universitas Gadjah Mada (UGM) - Hukum">UGM - Hukum</option>
                                        <option value="Institut Teknologi Sepuluh Nopember (ITS) - Sistem Informasi">ITS - Sistem Informasi</option>
                                        <option value="Universitas Padjadjaran (UNPAD) - Komunikasi">UNPAD - Ilmu Komunikasi</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#1E293B]">Buat Kata Sandi</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Minimal 8 karakter"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-9 pr-9 text-xs border-[#E2E8F0]"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {password && (
                                    <div className="space-y-1 pt-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-[#64748B]">Kekuatan Sandi:</span>
                                            <span className="font-bold text-[#1E293B]">{strength.label}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${strength.color} transition-all duration-300`}
                                                style={{ width: `${(strength.score / 3) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    className="h-4 w-4 rounded border-[#E2E8F0] text-[#1565C0] focus:ring-[#1565C0]"
                                    required
                                />
                                <label htmlFor="terms" className="text-[11px] text-[#64748B] leading-none cursor-pointer">
                                    Saya menyetujui <span className="text-[#1565C0] underline font-medium">Syarat & Ketentuan</span> YakinLulus.id
                                </label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full mt-4 text-xs font-bold bg-[#1565C0] hover:bg-[#0D47A1] text-white py-2.5"
                                disabled={isLoading || !agreeTerms}
                            >
                                {isLoading ? "Mendaftarkan Akun..." : "Buat Akun & Klaim 6 Bulan Gratis"}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex justify-center border-t border-[#E2E8F0] py-4 text-xs text-[#64748B]">
                        Sudah memiliki akun?{" "}
                        <Link href="/login" className="ml-1 text-[#1565C0] font-bold hover:underline">
                            Masuk di sini
                        </Link>
                    </CardFooter>
                </Card>

                <div className="flex items-center justify-center gap-2 text-xs text-[#64748B]">
                    <CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />
                    <span>Akses Super App EdTech Rp 10.000/bulan & CBT Offline-Resilient</span>
                </div>
            </div>
        </div>
    );
}
