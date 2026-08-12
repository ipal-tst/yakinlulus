// frontend/src/app/(siswa)/materials/[subjectId]/[chapterId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { academicService } from "@/services/academic.service";
import { LearnChapter, LearnTopic, ContentBlock } from "@/types";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Clock,
    Download,
    Info,
    PlayCircle,
    ArrowRight,
    ChevronLeft,
} from "lucide-react";

const DEFAULT_CHAPTER: LearnChapter = {
    chapter_id: "c1",
    subject_id: "mtk",
    title: "Trigonometri Lanjutan",
    order_index: 4,
    progress_pct: 100,
    correct_count: 50,
    target_correct: 50,
    status: "green",
};

const DEFAULT_TOPICS: LearnTopic[] = [
    {
        topic_id: "t1",
        chapter_id: "c1",
        name: "Pengertian Fungsi",
        order_index: 1,
        competencies: [
            {
                competency_id: "cp1",
                code: "CP/KD 4.1 · Relasi & Fungsi",
                title: "Pengertian Fungsi",
                content_blocks: [
                    {
                        block_type: "PARAGRAPH",
                        block_id: "b1",
                        title: "Fungsi",
                        content:
                            "Fungsi adalah relasi khusus yang memetakan setiap anggota himpunan A (domain) tepat satu ke anggota himpunan B (kodomain). Notasi: f : A → B dengan f(x) menyatakan nilai fungsi untuk input x.",
                    },
                    {
                        block_type: "LATEX",
                        block_id: "b2",
                        title: "Bentuk Umum",
                        content: "f(x) = ax + b",
                        formula: "f(x) = ax + b",
                    },
                    {
                        block_type: "TABLE",
                        block_id: "b3",
                        title: "Sifat-sifat Fungsi",
                        content: "",
                        table_data: {
                            headers: ["Sifat", "Definisi", "Contoh"],
                            rows: [
                                ["Injektif", "Setiap output dipasangkan satu input", "f(x) = 2x"],
                                ["Surjektif", "Setiap output memiliki pasangan", "f(x) = x², x ≥ 0"],
                                ["Bijektif", "Injektif sekaligus surjektif", "f(x) = x + 1"],
                            ],
                        },
                    },
                    {
                        block_type: "CALLOUT",
                        block_id: "b4",
                        title: "Ingat",
                        content:
                            "Fungsi kuadrat f(x) = ax² + bx + c membentuk parabola. Nilai diskriminan D = b² − 4ac menentukan banyak titik potong dengan sumbu-x.",
                    },
                    {
                        block_type: "GRAPH",
                        block_id: "b5",
                        title: "Grafik Fungsi Naik",
                        content:
                            "Grafik fungsi naik — nilai f(x) bertambah seiring x bertambah. Daerah di bawah kurva diarsir untuk menunjukkan integral tentu.",
                    },
                ],
            },
        ],
    },
    {
        topic_id: "t2",
        chapter_id: "c1",
        name: "Komposisi Fungsi",
        order_index: 2,
        competencies: [
            {
                competency_id: "cp2",
                code: "CP/KD 4.2 · Komposisi Fungsi",
                title: "Komposisi Fungsi",
                content_blocks: [
                    {
                        block_type: "PARAGRAPH",
                        block_id: "b1",
                        title: "Komposisi",
                        content:
                            "Komposisi fungsi (f ∘ g)(x) = f(g(x)) berarti hasil g(x) menjadi input bagi f. Urutan penting: f ∘ g ≠ g ∘ f umumnya.",
                    },
                    {
                        block_type: "LATEX",
                        block_id: "b2",
                        title: "Rumus",
                        content: "",
                        formula: "(f ∘ g)(x) = f(g(x))",
                    },
                    {
                        block_type: "CALLOUT",
                        block_id: "b3",
                        title: "Sifat Asosiatif",
                        content:
                            "Sifat asosiatif berlaku: f ∘ (g ∘ h) = (f ∘ g) ∘ h. Sifat ini menghemat pengerjaan soal panjang.",
                    },
                ],
            },
        ],
    },
    {
        topic_id: "t3",
        chapter_id: "c1",
        name: "Invers Fungsi",
        order_index: 3,
        competencies: [
            {
                competency_id: "cp3",
                code: "CP/KD 4.3 · Invers Fungsi",
                title: "Invers Fungsi",
                content_blocks: [
                    {
                        block_type: "PARAGRAPH",
                        block_id: "b1",
                        title: "Invers",
                        content:
                            "Fungsi invers f⁻¹ membalikkan pemetaan: bila y = f(x), maka x = f⁻¹(y). Invers hanya ada untuk fungsi bijektif.",
                    },
                    {
                        block_type: "LATEX",
                        block_id: "b2",
                        title: "Contoh",
                        content: "",
                        formula: "f(x) = (2x + 1)/(x − 3)  ⟹  f⁻¹(x) = (3x + 1)/(x − 2)",
                    },
                    {
                        block_type: "CALLOUT",
                        block_id: "b3",
                        title: "Trik Cepat",
                        content: "Tulis y = f(x), tukar x ↔ y, lalu selesaikan untuk y. Hasilnya adalah f⁻¹(x).",
                    },
                ],
            },
        ],
    },
    {
        topic_id: "t4",
        chapter_id: "c1",
        name: "Video Animasi",
        order_index: 4,
        competencies: [
            {
                competency_id: "cp4",
                code: "VIDEO · Visualisasi Konsep",
                title: "Video Animasi",
                content_blocks: [
                    {
                        block_type: "VIDEO",
                        block_id: "b1",
                        title: "Video: Konsep Fungsi & Komposisi",
                        content: "5 menit · oleh tim kurikulum",
                        duration_seconds: 300,
                        video_url: "",
                    },
                ],
            },
        ],
    },
];

function BlockRenderer({ block }: { block: ContentBlock }) {
    switch (block.block_type) {
        case "PARAGRAPH":
            return (
                <p className="text-[15px] leading-relaxed text-muted-foreground">{block.content}</p>
            );
        case "LATEX":
            return (
                <div className="rounded-xl border border-border border-l-4 border-l-primary bg-muted/50 px-5 py-4 font-mono text-[15px] text-foreground overflow-x-auto">
                    {block.formula || block.content}
                </div>
            );
        case "TABLE": {
            const td = block.table_data as { headers?: string[]; rows?: (string | number)[][] } | undefined;
            if (!td?.headers) return null;
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr>
                                {td.headers.map((h, i) => (
                                    <th
                                        key={i}
                                        className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-2 border border-border bg-muted/50"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {td.rows?.map((row, ri) => (
                                <tr key={ri}>
                                    {row.map((cell, ci) => (
                                        <td key={ci} className="px-3 py-2 border border-border text-[13px]">
                                            {String(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        case "CALLOUT":
            return (
                <div className="flex gap-3 rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3 text-sm text-orange-700 dark:text-orange-200">
                    <Info className="h-4 w-4 flex-none text-orange-500 shrink-0" />
                    <span>
                        <b className="font-bold">{block.title}: </b>
                        {block.content}
                    </span>
                </div>
            );
        case "GRAPH": {
            // Simple function curve mock (parabola rising / sine)
            const points = Array.from({ length: 60 }, (_, i) => {
                const x = (i / 59) * 300;
                const y = 130 - Math.pow(i / 59, 1.6) * 100;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(" ");
            return (
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <svg viewBox="0 0 300 140" className="w-full h-40" preserveAspectRatio="none">
                        <line x1="0" y1="70" x2="300" y2="70" stroke="var(--border)" strokeWidth="1" />
                        <line x1="150" y1="0" x2="150" y2="140" stroke="var(--border)" strokeWidth="1" />
                        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2.5" />
                        <polygon points={`0,140 ${points} 300,140`} fill="#2563eb" opacity="0.08" />
                    </svg>
                    <p className="text-xs text-muted-foreground text-center mt-2">{block.content}</p>
                </div>
            );
        }
        case "VIDEO":
            return (
                <div className="rounded-xl overflow-hidden border border-border">
                    <div className="aspect-video bg-primary flex items-center justify-center text-white">
                        <div className="text-center p-6">
                            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary">
                                <PlayCircle className="h-6 w-6" />
                            </span>
                            <p className="mt-3 font-semibold text-sm">{block.title}</p>
                            <p className="text-xs opacity-90 mt-1">{block.content}</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {Math.round((block.duration_seconds || 0) / 60)} menit
                        </span>
                        <Badge variant="outline" className="text-[10px]">Pratinjau</Badge>
                    </div>
                </div>
            );
        case "CODE":
            return (
                <pre className="rounded-xl bg-muted/60 border border-border px-4 py-3 text-xs overflow-x-auto font-mono">
                    {block.content}
                </pre>
            );
        default:
            return block.content ? <p className="text-sm text-muted-foreground">{block.content}</p> : null;
    }
}

export default function ChapterDetailPage() {
    const params = useParams();
    const subjectId = (params?.subjectId as string) || "mtk";
    const chapterId = (params?.chapterId as string) || "c1";

    const [chapter, setChapter] = useState<LearnChapter | null>(null);
    const [topics, setTopics] = useState<LearnTopic[]>([]);
    const [activeTopic, setActiveTopic] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await academicService.getChapterDetail(subjectId, chapterId);
                if (res && Array.isArray(res.topics) && res.topics.length > 0) {
                    setChapter({ ...DEFAULT_CHAPTER, ...res.chapter });
                    setTopics(res.topics);
                } else {
                    setChapter(DEFAULT_CHAPTER);
                    setTopics(DEFAULT_TOPICS);
                }
            } catch {
                setChapter(DEFAULT_CHAPTER);
                setTopics(DEFAULT_TOPICS);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [subjectId, chapterId]);

    const current = topics[activeTopic];
    const cp = current?.competencies[0];

    return (
        <AppShell>
            <div className="space-y-4 max-w-6xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/materials" className="hover:text-primary font-medium">Belajar</Link>
                    <span className="text-muted-foreground/40">/</span>
                    <Link href={`/materials/${subjectId}`} className="hover:text-primary font-medium">
                        {subjectId === "mtk" ? "Matematika" : "Mapel"}
                    </Link>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="text-foreground font-semibold">
                        Bab {chapter?.order_index || "—"} · {chapter?.title || "—"}
                    </span>
                </div>

                {/* Chapter header card */}
                {loading ? (
                    <Card className="p-5">
                        <Skeleton className="h-6 w-56" />
                        <Skeleton className="h-2 w-full mt-4" />
                    </Card>
                ) : chapter ? (
                    <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs font-semibold">
                                    Bab {chapter.order_index} · {chapter.title}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">SMA · Kelas 12 UTBK</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Materi lengkap {topics.length} topik dengan CP/KD. Bacaa &amp; pahami lalu uji dengan
                                ujian bab.
                            </p>
                        </div>
                        <div className="w-full sm:w-56">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-muted-foreground">Progres belajar</span>
                                <b className="font-mono">{chapter.progress_pct}%</b>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
                                    style={{ width: `${chapter.progress_pct}%` }}
                                />
                            </div>
                        </div>
                    </Card>
                ) : null}

                {/* Body: topic sidebar + content */}
                {loading ? (
                    <Card className="p-6">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full mt-4" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                        <Skeleton className="h-16 w-full mt-4" />
                    </Card>
                ) : topics.length > 0 && current && cp ? (
                    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-5 items-start">
                        {/* Topic sidebar (sticky) */}
                        <div className="md:sticky md:top-20 rounded-2xl border border-border bg-card p-2.5 space-y-0.5">
                            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2.5 pb-2 pt-1">
                                Topik dalam Bab
                            </h3>
                            {topics.map((tp, i) => (
                                <button
                                    key={tp.topic_id}
                                    onClick={() => setActiveTopic(i)}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-left transition-colors",
                                        i === activeTopic
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-muted-foreground hover:bg-muted"
                                    )}
                                    aria-selected={i === activeTopic}
                                >
                                    <span
                                        className={cn(
                                            "h-[18px] w-[18px] rounded-full border flex items-center justify-center text-[10px] flex-none",
                                            i < activeTopic
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : i === activeTopic
                                                    ? "border-primary border-dashed text-primary"
                                                    : "border-border"
                                        )}
                                    >
                                        {i < activeTopic ? <Check className="h-3 w-3" /> : i + 1}
                                    </span>
                                    {tp.name}
                                </button>
                            ))}
                        </div>

                        {/* Content area */}
                        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5 min-w-0">
                            <div>
                                <span className="inline-flex items-center rounded-md bg-primary/10 text-primary font-mono text-xs font-bold px-2.5 py-1">
                                    {cp.code}
                                </span>
                                <h1 className="font-heading text-xl md:text-2xl font-extrabold text-foreground mt-3">
                                    {cp.title}
                                </h1>
                            </div>

                            <div className="space-y-5">
                                {cp.content_blocks.map((blk) => (
                                    <BlockRenderer key={blk.block_id} block={blk} />
                                ))}
                            </div>

                            {/* Prev / next navigation */}
                            <div className="flex items-center justify-between pt-5 mt-5 border-t border-border/60">
                                <div>
                                    <div className="text-[11px] text-muted-foreground">Sebelumnya</div>
                                    {activeTopic > 0 ? (
                                        <button
                                            onClick={() => setActiveTopic(activeTopic - 1)}
                                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" /> {topics[activeTopic - 1].name}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/60">—</span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-[11px] text-muted-foreground">Berikutnya</div>
                                    {activeTopic < topics.length - 1 ? (
                                        <button
                                            onClick={() => setActiveTopic(activeTopic + 1)}
                                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                        >
                                            {topics[activeTopic + 1].name} <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/60">Selesai</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Exam CTA footer */}
                {chapter && (
                    <div className="rounded-2xl bg-primary text-white px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold">Sudah paham materi bab ini?</h3>
                            <p className="text-[13px] opacity-90 mt-0.5">
                                Ukur pemahaman dengan ujian bab — 10 soal, tanpa timer.
                            </p>
                        </div>
                        <Button
                            asChild
                            className="bg-white text-primary hover:bg-primary-foreground rounded-xl font-semibold"
                        >
                            <Link href={subjectId === "mtk" ? "/exams" : "/exams"}>
                                Kerjakan Ujian Bab {chapter.order_index}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Back to chapters */}
                <div className="pt-1">
                    <Button asChild variant="ghost" size="sm" className="gap-2 text-xs">
                        <Link href={`/materials/${subjectId}`}>
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Bab
                        </Link>
                    </Button>
                </div>
            </div>
        </AppShell>
    );
}