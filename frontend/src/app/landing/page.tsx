"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Trophy,
    ShieldCheck,
    Zap,
    Users,
    Bot,
    Target,
    BarChart3,
    GraduationCap,
    Clock,
    Star,
    ChevronRight,
} from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
            {/* Top Announcement Bar */}
            <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-700 text-white text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full font-bold text-[10px]">NEW</span>
                <span>Pendaftaran Try Out Nasional UTBK SNBT 2026 Gelombang 1 Telah Dibuka!</span>
                <Link href="/register" className="underline font-bold hover:text-white/90 ml-1">
                    Daftar Sekarang &rarr;
                </Link>
            </div>

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-primary-foreground flex items-center justify-center font-extrabold font-heading text-xl shadow-md shadow-primary/20">
                        YL
                    </div>
                    <div className="flex flex-col">
                        <span className="font-heading font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                            YakinLulus.id
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold tracking-wider">EDTECH PLATFORM</span>
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <a href="#features" className="hover:text-primary transition-colors">Fitur Utama</a>
                    <a href="#how-it-works" className="hover:text-primary transition-colors">Cara Kerja</a>
                    <a href="#pricing" className="hover:text-primary transition-colors">Paket Belajar</a>
                    <a href="#testimonials" className="hover:text-primary transition-colors">Testimoni</a>
                </nav>

                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" className="rounded-xl font-medium text-sm">
                        <Link href="/login">Masuk</Link>
                    </Button>
                    <Button asChild className="rounded-xl font-bold shadow-md shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-sm">
                        <Link href="/register">Daftar Gratis</Link>
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-16 pb-24 px-6 max-w-6xl mx-auto text-center space-y-8 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold animate-pulse">
                    <Sparkles className="h-4 w-4" /> Platform Persiapan UTBK SNBT #1 Terbukti Loloskan Ribuan Siswa
                </div>

                <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-5xl mx-auto leading-[1.1]">
                    Taklukkan UTBK SNBT 2026 dengan <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">CBT IRT Akurat</span> & AI Tutor
                </h1>

                <p className="text-muted-foreground text-base sm:text-xl max-w-3xl mx-auto leading-relaxed font-normal">
                    Simulasi try out berstandar BPPP Kemendikbud, analisis rasionalisasi kelulusan PTN impian, serta pendampingan AI Tutor 24/7 untuk memastikan kelulusanmu.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 gap-2">
                        <Link href="/register">
                            Coba Try Out Gratis Sekarang <ArrowRight className="h-5 w-5" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 rounded-2xl text-base font-semibold border-border hover:bg-muted/60">
                        <Link href="/login">Masuk ke Dashboard</Link>
                    </Button>
                </div>

                {/* Stats Cards Banner */}
                <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
                    <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:border-primary/40 transition-all">
                        <span className="font-heading font-extrabold text-3xl sm:text-4xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent block">15,000+</span>
                        <span className="text-xs font-medium text-muted-foreground mt-1 block">Siswa Aktif Terdaftar</span>
                    </div>
                    <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:border-primary/40 transition-all">
                        <span className="font-heading font-extrabold text-3xl sm:text-4xl bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent block">88.5%</span>
                        <span className="text-xs font-medium text-muted-foreground mt-1 block">Tingkat Kelulusan PTN</span>
                    </div>
                    <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:border-primary/40 transition-all">
                        <span className="font-heading font-extrabold text-3xl sm:text-4xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent block">50,000+</span>
                        <span className="text-xs font-medium text-muted-foreground mt-1 block">Bank Soal & Pembahasan</span>
                    </div>
                    <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:border-primary/40 transition-all">
                        <span className="font-heading font-extrabold text-3xl sm:text-4xl bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent block">IRT 100%</span>
                        <span className="text-xs font-medium text-muted-foreground mt-1 block">Scoring Standard BPPP</span>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 bg-muted/40 border-y border-border/80">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-semibold">Fitur Unggulan</Badge>
                        <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight">Semua yang Kamu Butuhkan untuk Lulus SNBT</h2>
                        <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                            Dirancang khusus oleh tim pakar edukasi dan insinyur AI untuk memberikan pengalaman belajar terbaik.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="p-8 space-y-5 rounded-3xl hover:border-primary/50 transition-all shadow-xs hover:shadow-lg border-border">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                <Zap className="h-7 w-7" />
                            </div>
                            <h3 className="font-heading font-bold text-xl">Ujian CBT Presisi IRT</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Simulasi sistem ujian nyata dengan timer otomatis per subtes, ragu-ragu, dan pembobotan Item Response Theory 3-PL persis standar BPPP.
                            </p>
                        </Card>

                        <Card className="p-8 space-y-5 rounded-3xl hover:border-green-500/50 transition-all shadow-xs hover:shadow-lg border-border">
                            <div className="h-14 w-14 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center font-bold">
                                <Bot className="h-7 w-7" />
                            </div>
                            <h3 className="font-heading font-bold text-xl">AI Tutor Personal 24/7</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Bingung pembahasan soal? Tanya AI Tutor kapan saja untuk mendapatkan pemahaman konseptual, trik cepat, dan penjelasan kontekstual.
                            </p>
                        </Card>

                        <Card className="p-8 space-y-5 rounded-3xl hover:border-orange-500/50 transition-all shadow-xs hover:shadow-lg border-border">
                            <div className="h-14 w-14 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                                <Trophy className="h-7 w-7" />
                            </div>
                            <h3 className="font-heading font-bold text-xl">Rasionalisasi PTN & Leaderboard</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Hitung rasionalisasi kelulusan jurusan impian secara realtime dan ukur posisimu dibanding puluhan ribu peserta se-Indonesia.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-semibold">Langkah Mudah</Badge>
                    <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight">4 Langkah Menuju PTN Impian</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { step: "01", title: "Daftar Akun", desc: "Buat akun gratis dalam 1 menit dan pilih target PTN serta jurusan impianmu." },
                        { step: "02", title: "Ikuti Try Out", desc: "Kerjakan Try Out CBT dengan timer & suasana simulasi ujian sesungguhnya." },
                        { step: "03", title: "Analisis IRT", desc: "Dapatkan analisis nilai IRT mendalam serta rekomendasi materi lemah." },
                        { step: "04", title: "Diskusi AI Tutor", desc: "Tingkatkan pemahaman topik lemah dengan pendampingan AI Tutor 24/7." },
                    ].map((item, idx) => (
                        <div key={idx} className="p-6 rounded-3xl bg-card border border-border space-y-3 relative overflow-hidden group hover:border-primary transition-all">
                            <span className="font-heading font-extrabold text-5xl text-primary/15 group-hover:text-primary/30 transition-colors block">
                                {item.step}
                            </span>
                            <h3 className="font-heading font-bold text-lg text-foreground">{item.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-6 bg-muted/40 border-t border-border/80">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-semibold">Paket Langganan</Badge>
                        <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight">Pilih Paket Belajar Terbaik</h2>
                        <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                            Harga terjangkau untuk akses fitur pembelajaran terlengkap tanpa biaya tersembunyi.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Free Starter */}
                        <Card className="p-8 space-y-6 flex flex-col justify-between rounded-3xl border-border">
                            <div className="space-y-4">
                                <h3 className="font-heading font-bold text-xl">Starter (Gratis)</h3>
                                <div className="font-heading font-extrabold text-4xl">Rp 0</div>
                                <p className="text-xs text-muted-foreground">Untuk mencoba fitur awal platform YakinLulus.</p>
                                <hr className="border-border" />
                                <ul className="space-y-3 text-xs text-muted-foreground">
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> 1x Try Out UTBK SNBT Gratis</li>
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> Akses Modul Rangkuman Teori</li>
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> Ranking Peringkat Nasional</li>
                                </ul>
                            </div>
                            <Button asChild variant="outline" className="w-full rounded-2xl font-bold h-12">
                                <Link href="/register">Coba Sekarang</Link>
                            </Button>
                        </Card>

                        {/* Pro Intensif (Featured) */}
                        <Card className="p-8 space-y-6 flex flex-col justify-between rounded-3xl border-2 border-primary shadow-2xl relative bg-card">
                            <Badge className="absolute -top-3.5 right-6 bg-primary text-primary-foreground font-bold px-3 py-1 text-xs shadow-md">
                                Terpopuler
                            </Badge>
                            <div className="space-y-4">
                                <h3 className="font-heading font-bold text-xl text-primary">Paket Intensif SNBT</h3>
                                <div className="font-heading font-extrabold text-4xl text-foreground">
                                    Rp 149.000 <span className="text-xs text-muted-foreground font-normal">/ 3 Bulan</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Solusi lengkap menuju kelulusan PTN 2026.</p>
                                <hr className="border-border" />
                                <ul className="space-y-3 text-xs text-foreground font-medium">
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> 20+ Paket Try Out IRT Akurat</li>
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Pendampingan AI Tutor 24/7</li>
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Rasionalisasi PTN Realtime</li>
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Pembahasan Video & PDF Solusi</li>
                                </ul>
                            </div>
                            <Button asChild className="w-full rounded-2xl font-bold h-12 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-blue-600">
                                <Link href="/register">Pilih Paket Intensif</Link>
                            </Button>
                        </Card>

                        {/* School / B2B */}
                        <Card className="p-8 space-y-6 flex flex-col justify-between rounded-3xl border-border">
                            <div className="space-y-4">
                                <h3 className="font-heading font-bold text-xl">Paket Sekolah / B2B</h3>
                                <div className="font-heading font-extrabold text-4xl">Custom</div>
                                <p className="text-xs text-muted-foreground">Untuk SMA/MA/Kemitraan B2B Rombel.</p>
                                <hr className="border-border" />
                                <ul className="space-y-3 text-xs text-muted-foreground">
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> Lisensi Kolektif Rombel Sekolah</li>
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> Dashboard Analitik Guru & Kepala Sekolah</li>
                                    <li className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> Bank Ujian Custom Sekolah</li>
                                </ul>
                            </div>
                            <Button asChild variant="outline" className="w-full rounded-2xl font-bold h-12">
                                <Link href="/register">Hubungi Tim Kami</Link>
                            </Button>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 px-6 max-w-6xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-semibold">Testimoni Alumni</Badge>
                    <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight">Kisah Sukses Pejuang PTN</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            name: "Bintang Pamungkas",
                            target: "Teknik Informatika UI",
                            score: "Skor UTBK: 742",
                            text: "Try Out YakinLulus persis banget sama soal asli UTBK SNBT kemarin! Rasionalisasi jurusan bantu banget untuk tentuin strategi pilihan PTN.",
                        },
                        {
                            name: "Siti Rahmawati",
                            target: "Kedokteran UGM",
                            score: "Skor UTBK: 765",
                            text: "Fitur AI Tutor-nya luar biasa membantu pas malam hari waktu bingung ngerjain soal Penalaran Matematika yang rumit.",
                        },
                        {
                            name: "Rizky Ramadhan",
                            target: "STEI ITB",
                            score: "Skor UTBK: 758",
                            text: "Pembahasan soalnya ringkas dan jelas. Nilai IRT-nya beneran presisi sama hasil yang keluar di pengumuman SNBT!",
                        },
                    ].map((testi, idx) => (
                        <Card key={idx} className="p-8 rounded-3xl space-y-4 border-border hover:border-primary/40 transition-all shadow-xs">
                            <div className="flex items-center gap-1 text-amber-500">
                                {Array(5).fill(0).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-amber-500" />
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">"{testi.text}"</p>
                            <div className="pt-2 border-t border-border">
                                <h4 className="font-heading font-bold text-sm text-foreground">{testi.name}</h4>
                                <p className="text-[11px] text-primary font-medium">{testi.target}</p>
                                <span className="text-[10px] text-muted-foreground">{testi.score}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 border-t border-border bg-card text-xs text-muted-foreground">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">YL</div>
                            <span className="font-heading font-bold text-lg text-foreground">YakinLulus.id</span>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                            Platform EdTech & CBT berbasis riset presisi untuk mendukung kesuksesan siswa Indonesia meraih pendidikan tinggi impian.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-heading font-bold text-sm text-foreground">Navigasi</h4>
                        <ul className="space-y-2">
                            <li><a href="#features" className="hover:text-foreground">Fitur Utama</a></li>
                            <li><a href="#pricing" className="hover:text-foreground">Paket Belajar</a></li>
                            <li><a href="#testimonials" className="hover:text-foreground">Kisah Sukses</a></li>
                            <li><Link href="/login" className="hover:text-foreground">Masuk Akun</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-heading font-bold text-sm text-foreground">Peran Pengguna</h4>
                        <ul className="space-y-2">
                            <li><Link href="/login" className="hover:text-foreground">Dashboard Siswa</Link></li>
                            <li><Link href="/login" className="hover:text-foreground">Portal Guru & Author</Link></li>
                            <li><Link href="/login" className="hover:text-foreground">Portal Staff & B2B</Link></li>
                            <li><Link href="/login" className="hover:text-foreground">Finance & Investor</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <p>© 2026 YakinLulus.id EdTech Platform. All Rights Reserved.</p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-foreground">Privasi</a>
                        <a href="#" className="hover:text-foreground">Syarat & Ketentuan</a>
                        <a href="#" className="hover:text-foreground">Bantuan</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
