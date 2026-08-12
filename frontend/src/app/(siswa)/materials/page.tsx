// frontend/src/app/(siswa)/materials/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";
import { academicService } from "@/services/academic.service";
import { GradeBadge } from "@/components/siswa/GradeBadge";
import { LearnSubject } from "@/types";
import { cn } from "@/lib/utils";
import { BookOpen, Lightbulb, PlayCircle, Headphones, Lock, ArrowRight } from "lucide-react";

interface ExtraBlock {
    kind: string;
    title: string;
    media_url?: string;
    duration_seconds?: number;
    description?: string;
}

const DEFAULT_SUBJECTS: LearnSubject[] = [
    {
        subject_id: "mtk",
        subject_name: "Matematika",
        icon: "calc",
        icon_color: "#2563eb",
        total_children: 8,
        completed_children: 8,
        progress_pct: 100,
        is_mastered: true,
    },
    {
        subject_id: "bind",
        subject_name: "Bahasa Indonesia",
        icon: "book",
        icon_color: "#ec4899",
        total_children: 6,
        completed_children: 2,
        progress_pct: 40,
        is_mastered: false,
    },
    {
        subject_id: "fis",
        subject_name: "Fisika",
        icon: "atom",
        icon_color: "#f97316",
        total_children: 5,
        completed_children: 0,
        progress_pct: 10,
        is_mastered: false,
    },
    {
        subject_id: "kim",
        subject_name: "Kimia",
        icon: "flask",
        icon_color: "#8b5cf6",
        total_children: 4,
        completed_children: 0,
        progress_pct: 0,
        is_mastered: false,
    },
];

const DEFAULT_EXTRAS: ExtraBlock[] = [
    {
        kind: "TIPS",
        title: "Tips & Trik UTBK",
        description: "Strategi menjawab cepat · 12 menit",
    },
    {
        kind: "VIDEO",
        title: "Video Rangkuman",
        description: "Materi inti tiap mapel · 5–8 menit",
    },
    {
        kind: "AUDIO",
        title: "Audio Belajar",
        description: "Podcast ringkas saat perjalanan",
    },
];

function SubjectIcon({ name, color }: { name: string; color: string }) {
    const icons: Record<string, React.ReactNode> = {
        calc: <BookOpen className="h-5 w-5" />,
        book: <BookOpen className="h-5 w-5" />,
        atom: <BookOpen className="h-5 w-5" />,
        flask: <BookOpen className="h-5 w-5" />,
    };
    return (
        <span
            className="h-11 w-11 rounded-xl flex items-center justify-center text-white flex-none"
            style={{ background: color }}
        >
            {icons[name] || <BookOpen className="h-5 w-5" />}
        </span>
    );
}

function statusBadge(sub: LearnSubject, tgt: number) {
    const pct = sub.progress_pct;
    if (sub.is_mastered || pct >= 100)
        return { label: "Dikuasai", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
    if (pct > 0)
        return { label: "Berjalan", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    return { label: "Belum mulai", cls: "bg-muted text-muted-foreground border-border" };
}

export default function MaterialsPage() {
    const { user } = useAuthStore();
    const [level, setLevel] = useState("SMA");
    const [subjects, setSubjects] = useState<LearnSubject[]>([]);
    const [extras, setExtras] = useState<ExtraBlock[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await academicService.getLearnCatalog();
                if (res && Array.isArray(res.subjects) && res.subjects.length > 0) {
                    setSubjects(res.subjects);
                    setExtras(res.extras || []);
                } else {
                    setSubjects(DEFAULT_SUBJECTS);
                    setExtras(DEFAULT_EXTRAS);
                }
            } catch {
                setSubjects(DEFAULT_SUBJECTS);
                setExtras(DEFAULT_EXTRAS);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const levelTabs = ["SD", "SMP", "SMA"];

    return (
        <AppShell>
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Halo, {user?.full_name?.split(" ")[0] || "Raka"}!
                            <span className="text-foreground/80"> Ingin belajar apa hari ini?</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            Materi ditampilkan sesuai jenjangmu. Kuasai soal benar per bab untuk menuntaskan mapel.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <GradeBadge educationLevel={user?.education_level} grade={user?.grade} />
                    </div>
                </div>

                {/* TABS JENJANG */}
                <div className="inline-flex rounded-xl border border-border bg-card p-1 gap-1">
                    {levelTabs.map((lv) => {
                        const active = lv === level;
                        const locked = lv !== level;
                        return (
                            <button
                                key={lv}
                                disabled={locked}
                                onClick={() => setLevel(lv)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                                    active && "bg-primary text-primary-foreground",
                                    !active && locked && "text-muted-foreground/60 cursor-not-allowed flex items-center gap-1.5",
                                    !active && !locked && "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {locked && <Lock className="h-3 w-3" />}
                                {lv}
                            </button>
                        );
                    })}
                </div>

                {/* DAFTAR MAPEL */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">Mata Pelajaran</h2>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Card key={i} className="p-5">
                                    <Skeleton className="h-11 w-11 rounded-xl" />
                                    <Skeleton className="h-4 w-24 mt-4" />
                                    <Skeleton className="h-2 w-full mt-4" />
                                    <Skeleton className="h-3 w-16 mt-3" />
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {subjects.map((sub) => {
                                const st = statusBadge(sub, 50);
                                return (
                                    <Link href={`/materials/${sub.subject_id}`} key={sub.subject_id}>
                                        <Card className="p-5 hover:border-primary/50 hover:shadow-md transition-all h-full cursor-pointer">
                                            <div className="flex items-center justify-between mb-3">
                                                <SubjectIcon name={sub.icon} color={sub.icon_color} />
                                                <Badge variant="outline" className={cn("text-[10px] font-semibold", st.cls)}>
                                                    {st.label}
                                                </Badge>
                                            </div>
                                            <h3 className="font-bold text-base text-foreground">{sub.subject_name}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {sub.total_children} bab · peminatan &amp; wajib
                                            </p>
                                            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-4">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${sub.progress_pct}%`,
                                                        background: sub.is_mastered || sub.progress_pct >= 100 ? "#16a34a" : sub.progress_pct > 0 ? "#f97316" : "#94a3b8",
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[11px] text-muted-foreground">
                                                    {sub.completed_children} dari {sub.total_children} bab hijau
                                                </span>
                                                <span
                                                    className="text-xs font-bold font-mono"
                                                    style={{
                                                        color: sub.is_mastered
                                                            ? "#16a34a"
                                                            : sub.progress_pct > 0
                                                                ? "#f97316"
                                                                : "#94a3b8",
                                                    }}
                                                >
                                                    {sub.progress_pct}%
                                                </span>
                                            </div>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* NON-MAPEL */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">Tips &amp; Materi Bonus</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(extras.length > 0 ? extras : DEFAULT_EXTRAS).map((ex, i) => {
                            const meta: Record<string, { icon: React.ReactNode; cls: string }> = {
                                TIPS: {
                                    icon: <Lightbulb className="h-5 w-5" />,
                                    cls: "bg-primary/10 text-primary",
                                },
                                VIDEO: {
                                    icon: <PlayCircle className="h-5 w-5" />,
                                    cls: "bg-orange-500/10 text-orange-600",
                                },
                                AUDIO: {
                                    icon: <Headphones className="h-5 w-5" />,
                                    cls: "bg-emerald-500/10 text-emerald-600",
                                },
                            };
                            const m = meta[ex.kind] || meta.TIPS;
                            return (
                                <Card key={i} className="p-4 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                                    <span className={cn("h-11 w-11 rounded-xl flex items-center justify-center flex-none", m.cls)}>
                                        {m.icon}
                                    </span>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-foreground truncate">{ex.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {ex.description}
                                        </p>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}