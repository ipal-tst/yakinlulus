"use client";

import * as React from "react";
import Link from "next/link";
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
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState("");
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
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
                        Pemulihan Kata Sandi Akun YakinLulus.id
                    </p>
                </div>

                <Card className="shadow-xl border">
                    <CardHeader className="space-y-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">Lupa Kata Sandi?</CardTitle>
                        <CardDescription className="text-xs">
                            Masukkan email terdaftar Anda untuk menerima tautan pemulihan kata sandi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSubmitted ? (
                            <div className="p-4 rounded-xl bg-success/10 border border-success/30 space-y-3 text-center">
                                <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
                                <h3 className="font-bold text-sm text-success">Instruksi Reset Terkirim!</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Tautan pemulihan telah dikirim ke <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam email Anda.
                                </p>
                                <div className="pt-2">
                                    <Link href="/reset-password">
                                        <Button variant="outline" size="sm" className="w-full text-xs">
                                            Simulasi Klik Tautan Reset Email
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Alamat Email Terdaftar</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            placeholder="nama@yakinlulus.id"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-9 text-xs"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full text-xs font-bold" disabled={isLoading}>
                                    {isLoading ? "Mengirim Tautan..." : "Kirim Tautan Pemulihan Email"}
                                </Button>
                            </form>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground">
                        Ingat kata sandi Anda?{" "}
                        <Link href="/login" className="ml-1 text-primary font-bold hover:underline">
                            Masuk di sini
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
