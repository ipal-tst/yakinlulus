"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { Lock, Mail, ShieldCheck, UserCheck, GraduationCap, Users, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

function LoginFormContent() {
    const searchParams = useSearchParams();
    const reason = searchParams?.get("reason");
    const registered = searchParams?.get("registered");

    const [email, setEmail] = React.useState("admin@yakinlulus.id");
    const [password, setPassword] = React.useState("Admin@123!");
    const [showPassword, setShowPassword] = React.useState(false);
    const [selectedRole, setSelectedRole] = React.useState<"student" | "teacher" | "admin">("admin");
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const handleSelectRole = (role: "student" | "teacher" | "admin") => {
        setSelectedRole(role);
        setErrorMessage(null);
        if (role === "student") {
            setEmail("murid@yakinlulus.id");
            setPassword("Admin@123!");
        } else if (role === "teacher") {
            setEmail("guru@yakinlulus.id");
            setPassword("Admin@123!");
        } else if (role === "admin") {
            setEmail("admin@yakinlulus.id");
            setPassword("Admin@123!");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const res = await apiClient.auth.login({ email, password });

            if (res.success && res.data) {
                const dataObj = res.data as any;
                const user = dataObj.user || {};
                const token = dataObj.token || (typeof dataObj === "string" ? dataObj : "");
                const role = (user.role || selectedRole).toLowerCase();

                // Store in apiClient & localStorage
                if (token) {
                    apiClient.setAuthToken(token);
                }
                if (typeof window !== "undefined") {
                    localStorage.setItem("yl_user", JSON.stringify(user));
                    localStorage.setItem("yakinlulus-role", role);
                    localStorage.setItem("yakinlulus-token", token);

                    // Set auth cookies for Next.js middleware
                    document.cookie = `yakinlulus-role=${role}; path=/; max-age=86400; SameSite=Lax`;
                    document.cookie = `yakinlulus-token=${token}; path=/; max-age=86400; SameSite=Lax`;
                }

                // Determine redirect destination
                let dest = "/student";
                if (role === "admin" || role === "staff") {
                    dest = "/admin/users";
                } else if (role === "teacher") {
                    dest = "/teacher";
                }

                window.location.href = dest;
            } else {
                setErrorMessage(res.error || "Gagal masuk: Periksa kembali email dan kata sandi Anda.");
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Terjadi kesalahan jaringan saat otentikasi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-6">
            {/* Brand Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1565C0] text-white font-extrabold text-xl shadow-lg">
                    YL
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">{APP_CONFIG.name}</h1>
                <p className="text-sm text-[#64748B]">
                    Masuk ke Portal Belajar & CBT Enterprise
                </p>
            </div>

            {/* Notification Badge if redirected with reason or newly registered */}
            {registered && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Pendaftaran berhasil! Silakan masuk dengan email dan kata sandi Anda.</span>
                </div>
            )}

            {reason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                        {reason === "unauthorized_admin"
                            ? "Akses ditolak: Anda memerlukan hak akses Administrator."
                            : reason === "unauthorized_teacher"
                                ? "Akses ditolak: Anda memerlukan hak akses Guru/Pengajar."
                                : "Silakan masuk terlebih dahulu untuk mengakses portal."}
                    </span>
                </div>
            )}

            {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Login Form Card */}
            <Card className="shadow-xl border border-[#E2E8F0] bg-white">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-lg text-[#1E293B]">Masuk Akun</CardTitle>
                    <CardDescription className="text-xs text-[#64748B]">
                        Pilih peran di bawah ini atau masukkan kredensial terdaftar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Role Quick Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                            Pilih Peran Akses (Real Database Auth)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => handleSelectRole("admin")}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${selectedRole === "admin"
                                    ? "border-[#F9A825] bg-[#FFF8E1] text-[#B78103] font-bold shadow-xs"
                                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                                    }`}
                            >
                                <Users className="h-5 w-5 mb-1" />
                                Admin
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectRole("teacher")}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${selectedRole === "teacher"
                                    ? "border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32] font-bold shadow-xs"
                                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                                    }`}
                            >
                                <UserCheck className="h-5 w-5 mb-1" />
                                Guru
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectRole("student")}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${selectedRole === "student"
                                    ? "border-[#1565C0] bg-[#E3F2FD] text-[#1565C0] font-bold shadow-xs"
                                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                                    }`}
                            >
                                <GraduationCap className="h-5 w-5 mb-1" />
                                Siswa
                            </button>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#1E293B]">Email Terdaftar</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                                <Input
                                    type="email"
                                    placeholder="nama@yakinlulus.id"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9 text-xs border-[#E2E8F0]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-[#1E293B]">Kata Sandi</label>
                                <Link href="/forgot-password" className="text-xs text-[#1565C0] hover:underline font-medium">
                                    Lupa kata sandi?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
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
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-4 text-xs font-bold bg-[#1565C0] hover:bg-[#0D47A1] text-white py-2.5"
                            disabled={isLoading}
                        >
                            {isLoading ? "Memproses Otentikasi..." : `Masuk Portal (${selectedRole.toUpperCase()})`}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center border-t border-[#E2E8F0] py-4 text-xs text-[#64748B]">
                    Belum memiliki akun?{" "}
                    <Link href="/register" className="ml-1 text-[#1565C0] font-bold hover:underline">
                        Daftar Sekarang
                    </Link>
                </CardFooter>
            </Card>

            <div className="flex items-center justify-center gap-2 text-xs text-[#64748B]">
                <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
                <span>Keamanan Enkripsi SSL 256-bit & JWT Postgres Auth</span>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 sm:p-8 relative">
            {/* Top Back Link */}
            <div className="absolute top-6 left-6">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2 text-xs text-[#64748B] hover:text-[#1E293B]">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
                    </Button>
                </Link>
            </div>

            <React.Suspense fallback={<div className="text-xs text-[#64748B]">Memuat halaman login...</div>}>
                <LoginFormContent />
            </React.Suspense>
        </div>
    );
}
