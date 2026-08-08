"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Email dan kata sandi wajib diisi");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await authService.login({ email: email.trim(), password });
            setAuth(res.user, res.token);

            // Route based on role
            const role = res.user.role;
            if (role === "SUPER_ADMIN") router.push("/admin");
            else if (role === "STAFF") router.push("/staff");
            else if (role === "GURU") router.push("/guru");
            else if (role === "FINANCE") router.push("/finance");
            else if (role === "INVESTOR") router.push("/investor");
            else if (role === "SISWA" || role === "SUPER_SISWA") router.push("/siswa");
            else router.push("/");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal masuk. Periksa email & kata sandi Anda.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans text-foreground antialiased flex flex-col justify-between selection:bg-primary/20">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
                <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity">
                            <div className="h-9 w-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-extrabold font-heading text-lg shadow-md shadow-primary/20">
                                YL
                            </div>
                            <span className="font-heading text-xl font-bold tracking-tight text-primary">
                                Yakinlulus.id
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full pt-20 min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
                {/* Ambient Background Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-green-500/5 rounded-full blur-3xl mix-blend-multiply pointer-events-none" />
                </div>

                {/* Login Form Card */}
                <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-8 md:p-10 relative z-10 my-8">
                    <div className="flex flex-col items-center mb-8 text-center space-y-2">
                        <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
                            Selamat Datang
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Silakan masuk ke akun Anda untuk melanjutkan belajar.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {/* Email Input */}
                        <div className="flex flex-col gap-2 relative">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="email">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full bg-background pl-10 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col gap-2 relative">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="password">
                                    Kata Sandi
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-primary hover:underline font-medium transition-colors"
                                >
                                    Lupa sandi?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full bg-background pl-10 pr-12 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-3 mt-[-4px]">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                            />
                            <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
                                Ingat saya
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            <span>{loading ? "Memproses..." : "Masuk"}</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-border/60" />
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Atau masuk dengan</span>
                        <div className="flex-1 h-px bg-border/60" />
                    </div>

                    {/* Google OAuth Button */}
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => setError("Google Sign-In akan terhubung dengan Supabase OAuth.")}
                            className="w-full bg-background hover:bg-muted text-foreground text-sm font-medium py-3 rounded-xl border border-border hover:border-muted-foreground/30 transition-all flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Google</span>
                        </button>
                    </div>

                    {/* Register Link */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Belum punya akun?{" "}
                            <Link href="/register" className="font-semibold text-primary hover:underline transition-colors">
                                Daftar Sekarang
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer Copyright */}
                <div className="py-6 text-center opacity-60 text-xs text-muted-foreground">
                    <p>© 2026 Yakinlulus.id. Sistem Pembelajaran Terpadu.</p>
                </div>
            </main>
        </div>
    );
}
