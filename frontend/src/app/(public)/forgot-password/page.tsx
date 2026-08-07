"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError("");

        try {
            await authService.forgotPassword(email);
            setSuccess(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal mengirim permintaan reset password.";
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
                        Lupa Kata Sandi?
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Masukkan email Anda. Kami akan mengirimkan tautan reset kata sandi.
                    </p>
                </div>

                <Card className="shadow-md">
                    <CardContent className="pt-6">
                        {success ? (
                            <div className="text-center py-4 space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <h3 className="font-heading font-semibold text-lg">Email Terkirim!</h3>
                                <p className="text-xs text-muted-foreground">
                                    Jika email <strong>{email}</strong> terdaftar, tautan pemulihan kata sandi telah dikirim ke kotak masuk Anda.
                                </p>
                                <Button asChild className="w-full rounded-xl">
                                    <Link href="/login">Kembali ke halaman Masuk</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Email Terdaftar
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

                                <Button
                                    type="submit"
                                    className="w-full h-11 rounded-xl font-semibold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        "Sending..."
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            Kirim Tautan Reset <Mail className="h-4 w-4" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        )}

                        <div className="mt-6 text-center text-xs text-muted-foreground">
                            <Link href="/login" className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline">
                                <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke halaman Masuk
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
