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
import { APP_CONFIG } from "@/config/app";
import { Mail, ArrowLeft, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";

export default function VerifyEmailPage() {
    const router = useRouter();
    const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
    const [countdown, setCountdown] = React.useState(60);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isVerified, setIsVerified] = React.useState(false);

    React.useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input box
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            setIsVerified(true);
            setTimeout(() => {
                router.push("/student");
            }, 1200);
        }, 600);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-8 relative">
            <div className="absolute top-6 left-6">
                <Link href="/register">
                    <Button variant="ghost" size="sm" className="gap-2 text-xs">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Pendaftaran
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
                        Verifikasi Kode OTP Alamat Email
                    </p>
                </div>

                <Card className="shadow-xl border">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-2">
                            <Mail className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">Masukkan Kode OTP</CardTitle>
                        <CardDescription className="text-xs">
                            Kami telah mengirimkan 6 digit kode OTP verifikasi ke email Anda.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {isVerified ? (
                            <div className="p-4 rounded-xl bg-success/10 border border-success/30 space-y-3 text-center">
                                <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
                                <h3 className="font-bold text-sm text-success">Email Berhasil Terverifikasi!</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Mengalihkan Anda secara otomatis ke Portal Siswa YakinLulus.id...
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-6">
                                {/* 6 Digit OTP Inputs */}
                                <div className="flex items-center justify-center gap-2">
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            id={`otp-input-${idx}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className="h-12 w-11 rounded-lg border border-input text-center text-lg font-bold font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden bg-background shadow-xs"
                                        />
                                    ))}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full text-xs font-bold"
                                    disabled={isLoading || otp.some((d) => !d)}
                                >
                                    {isLoading ? "Memverifikasi Kode..." : "Verifikasi & Aktifkan Akun"}
                                </Button>
                            </form>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col items-center justify-center border-t py-4 text-xs text-muted-foreground space-y-2">
                        <div className="flex items-center gap-1.5">
                            <span>Tidak menerima kode?</span>
                            {countdown > 0 ? (
                                <span className="font-mono text-primary font-bold">Kirim ulang ({countdown}s)</span>
                            ) : (
                                <button
                                    onClick={() => setCountdown(60)}
                                    className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" /> Kirim Ulang OTP
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px]">
                            <ShieldCheck className="h-3.5 w-3.5 text-success" />
                            <span>Keamanan Terjamin SSL 256-bit</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
