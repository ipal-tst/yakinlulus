// frontend/src/components/siswa/WeeklyExamCard.tsx
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeeklyExam } from "@/types/siswa";
import {
    Trophy,
    Medal,
    CalendarClock,
    Clock,
    FileQuestion,
    Calendar,
    ArrowRight,
} from "lucide-react";

interface WeeklyExamCardProps {
    data: WeeklyExam | null;
    loading?: boolean;
}

function formatSchedule(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
    const fmt = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    return `${fmt.format(s).replaceAll(":", ".")} – ${fmt.format(e).replaceAll(":", ".")}`;
}

export function WeeklyExamCard({ data, loading }: WeeklyExamCardProps) {
    if (loading) {
        return (
            <Card className="rounded-2xl overflow-hidden">
                <Skeleton className="h-44 w-full rounded-none" />
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="rounded-2xl border-primary/30">
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40 shadow-sm">
                        <Trophy className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="font-heading text-base font-semibold text-foreground">
                            Tryout khusus pekan ini belum dijadwalkan
                        </h2>
                        <p className="mx-auto max-w-md text-xs text-muted-foreground">
                            Jadwal tryout mingguan akan muncul di sini sebagai acuan ranking &amp; targetmu.
                        </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
                        <Link href="/exams">
                            Lihat Jadwal Umum <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const schedule = formatSchedule(data.scheduled_start, data.scheduled_end);

    return (
        <Card className="rounded-2xl border-primary/30 shadow-md">
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge className="rounded-full gap-1.5 bg-primary text-primary-foreground px-3 py-1 font-semibold">
                        <Trophy className="h-3.5 w-3.5" /> HASILMU MINGGU INI
                    </Badge>
                    {data.is_ranking_basis && (
                        <Badge
                            variant="outline"
                            className="rounded-full gap-1.5 border-amber-500/30 bg-amber-500/10 px-3 py-1 font-semibold text-amber-600 dark:text-amber-400"
                        >
                            <Medal className="h-3.5 w-3.5" /> ACUAN RANKING &amp; TARGET
                        </Badge>
                    )}
                </div>

                <div>
                    <h2 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
                        {data.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{data.subject_name}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    {schedule && (
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-4 w-4 text-primary" /> Jadwal: {schedule}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" /> {data.duration_minutes} menit
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <FileQuestion className="h-4 w-4 text-primary" /> {data.total_questions} soal
                    </span>
                </div>

                <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 md:text-sm">
                    <Trophy className="h-4 w-4" /> Nilai dari tryout ini = acuan ranking &amp; target kamu
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                    <Button asChild size="lg" className="rounded-xl gap-1.5">
                        <Link href={`/exams/${data.exam_id}`}>
                            Mulai / Lanjutkan <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="rounded-xl gap-1.5">
                        <Link href="/exams">
                            Jadwal Umum <Calendar className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
