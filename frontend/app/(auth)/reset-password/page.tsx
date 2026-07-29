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
import { Lock, ArrowLeft, CheckCircle2, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: "Kosong", color: "bg-muted" };
        if (pass.length < 6) return { score: 1, label: "Lemah", color: "bg-destructive" };
        if (pass.length < 10) return { score: 2, label: "Sedang", color: "bg-warning" };
        return { score: 3, label: "Sangat Kuat", color: "bg-success" };
    };

    const strength = getPasswordStrength(newPassword);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return;

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        }, 600);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-8 relative">
            <div className="absolute top-6 left-6">
                <Link href="/login">
                    <Button variant="ghost" size="sm" className="gap-2 text-xs">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Login
                    </Button>
                </Link>
            </div>

            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-xl shadow-lg">
                        YL
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">{APP_CONFIG.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        Pembaruan Kata Sandi Baru
                    </p>
                </div>

                <Card className="shadow-xl border">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-lg">Setel Ulang Kata Sandi</CardTitle>
                        <CardDescription className="text-xs">
                            Buat kata sandi baru yang kuat untuk mengamankan akun Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSuccess ? (
                            <div className="p-4 rounded-xl bg-success/10 border border-success/30 space-y-3 text-center">
                                <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
                                <h3 className="font-bold text-sm text-success">Kata Sandi Berhasil Diperbarui!</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Mengalihkan Anda secara otomatis ke halaman login...
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Kata Sandi Baru</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Minimal 8 karakter"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="pl-9 pr-9 text-xs"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    {newPassword && (
                                        <div className="space-y-1 pt-1">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-muted-foreground">Kekuatan Sandi:</span>
                                                <span className="font-bold">{strength.label}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${strength.color} transition-all duration-300`}
                                                    style={{ width: `${(strength.score / 3) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Konfirmasi Kata Sandi Baru</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Ulangi kata sandi baru"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-9 text-xs"
                                            required
                                        />
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-[10px] text-destructive font-medium pt-1">
                                            Kata sandi konfirmasi tidak cocok!
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full text-xs font-bold"
                                    disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                                >
                                    {isLoading ? "Menyimpan Sandi Baru..." : "Simpan Kata Sandi Baru"}
                                </Button>
                            </form>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-success mr-1.5" />
                        <span>Enkripsi kata sandi terikat dengan standar bcrypt JS</span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
