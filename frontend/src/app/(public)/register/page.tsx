"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, AlertCircle } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !email || !password) {
            setError("Semua bidang wajib diisi");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await authService.register({
                full_name: fullName,
                email,
                password,
                role: "SISWA",
            });
            setAuth(res.user, res.token);
            router.push("/");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal pendaftaran. Silakan coba lagi.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 rounded-2xl bg-primary text-primary-foreground items-center justify-center font-bold font-heading text-2xl shadow-lg shadow-primary/20">
                        YL
                    </div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                        Daftar Akun Siswa Baru
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Bergabunglah dengan YakinLulus.id untuk mulai belajar & latihan hari ini!
                    </p>
                </div>

                <Card className="shadow-md">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Nama Lengkap
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Nama Lengkap Anda"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Kata Sandi
                                </label>
                                <Input
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl font-semibold shadow-sm mt-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    "Mendaftarkan..."
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Daftar Sekarang <UserPlus className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-xs text-muted-foreground">
                            Sudah memiliki akun?{" "}
                            <Link href="/login" className="text-primary font-semibold hover:underline">
                                Masuk di sini
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
