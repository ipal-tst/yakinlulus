// frontend/src/app/(siswa)/ranking/page.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/siswa/EmptyState";
import { SectionHeader } from "@/components/siswa/SectionHeader";
import { useAuthStore } from "@/stores/auth.store";
import { academicService } from "@/services/academic.service";
import { ApiError } from "@/lib/api";
import {
    type ExamPackageWithMeta,
    type LeaderboardMode,
    type MyRankSummary,
    type RankingRow,
} from "@/types/siswa";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    BarChart3,
    Crown,
    Info,
    ListOrdered,
    Medal,
    Minus,
    TrendingDown,
    TrendingUp,
    Trophy,
    Users,
} from "lucide-react";

const ALL = "";
const MAX_LIMIT = 100;
const MODES: { key: LeaderboardMode; label: string; icon: typeof Trophy }[] = [
    { key: "BEST", label: "Nilai Terbaik (1-attempt)", icon: Trophy },
    { key: "AVERAGE", label: "Rata-rata (multi ujian)", icon: BarChart3 },
];

function fmtScore(n: number | undefined | null): string {
    if (n === undefined || n === null || !Number.isFinite(n)) return "—";
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <span className="text-sm font-semibold text-foreground">{children}</span>
        </div>
    );
}

function DeltaBadge({ delta }: { delta?: number }) {
    if (delta === undefined) {
        return (
            <Badge variant="outline" className="text-xs">
                —
            </Badge>
        );
    }
    if (delta > 0) {
        return (
            <Badge
                variant="secondary"
                className="text-xs gap-1 text-emerald-600 dark:text-emerald-400"
            >
                <TrendingUp className="h-3 w-3" /> naik {delta}
            </Badge>
        );
    }
    if (delta < 0) {
        return (
            <Badge
                variant="secondary"
                className="text-xs gap-1 text-orange-600 dark:text-orange-400"
            >
                <TrendingDown className="h-3 w-3" /> turun {Math.abs(delta)}
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="text-xs gap-1 text-muted-foreground">
            <Minus className="h-3 w-3" /> tetap
        </Badge>
    );
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-400">
                <Crown className="h-4 w-4" />
            </span>
        );
    }
    if (rank === 2) {
        return (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <Medal className="h-4 w-4" />
            </span>
        );
    }
    if (rank === 3) {
        return (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-orange-300 bg-orange-100 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/20 dark:text-orange-400">
                <Medal className="h-4 w-4" />
            </span>
        );
    }
    return (
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted px-1 text-xs font-bold text-muted-foreground">
            {rank}
        </span>
    );
}

export default function RankingPage() {
    const { user } = useAuthStore();

    const [mode, setMode] = useState<LeaderboardMode>("BEST");
    const [packageId, setPackageId] = useState(ALL);
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [subjectId, setSubjectId] = useState(ALL);

    const [packages, setPackages] = useState<ExamPackageWithMeta[]>([]);
    const [rows, setRows] = useState<RankingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modeNotice, setModeNotice] = useState<string | null>(null);

    const [myRank, setMyRank] = useState<MyRankSummary | null>(null);
    const [myRankFromApi, setMyRankFromApi] = useState(false);

    const [sortKey, setSortKey] = useState<"rank" | "total" | "average">("rank");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [retryToken, setRetryToken] = useState(0);

    // Load package filter options.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await academicService.getExamPackagesWithMeta();
                if (!cancelled) setPackages(Array.isArray(res) ? res : []);
            } catch {
                if (!cancelled) setPackages([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Load leaderboard (mode + filters) and my rank summary.
    useEffect(() => {
        let cancelled = false;

        async function myRankCall(): Promise<MyRankSummary | null> {
            try {
                if (mode === "AVERAGE") {
                    return await academicService.getMyRank({
                        package_ids: packageId || undefined,
                        month: month || undefined,
                    });
                }
                return await academicService.getMyRank({
                    package_id: packageId || undefined,
                    month: month || undefined,
                });
            } catch {
                return null;
            }
        }

        async function load() {
            setLoading(true);
            setError(null);
            setModeNotice(null);
            try {
                let data: RankingRow[] = [];

                if (mode === "AVERAGE") {
                    try {
                        data = await academicService.getLeaderboardAggregate({
                            package_ids: packageId || undefined,
                            month: month || undefined,
                            limit: MAX_LIMIT,
                        });
                    } catch (e) {
                        if (e instanceof ApiError && e.status === 404) {
                            setMode("BEST");
                            setModeNotice(
                                "Mode peringkat rata-rata belum tersedia di server. Menampilkan peringkat nilai terbaik (1-attempt)."
                            );
                            data = await academicService.getLeaderboard({
                                package_id: packageId || undefined,
                                month: month || undefined,
                                limit: MAX_LIMIT,
                            });
                        } else {
                            throw e;
                        }
                    }
                } else {
                    data = await academicService.getLeaderboard({
                        package_id: packageId || undefined,
                        month: month || undefined,
                        limit: MAX_LIMIT,
                    });
                }

                if (cancelled) return;

                setRows(Array.isArray(data) ? data : []);
                const res = await myRankCall();
                if (cancelled) return;
                if (res) {
                    setMyRank(res);
                    setMyRankFromApi(true);
                } else {
                    setMyRank(null);
                    setMyRankFromApi(false);
                }
            } catch (e) {
                if (!cancelled) {
                    setRows([]);
                    setMyRank(null);
                    setMyRankFromApi(false);
                    setError(e instanceof Error ? e.message : "Gagal memuat data peringkat.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [mode, packageId, month, retryToken]);

    // Unique subject keys across loaded rows, kept in discovery order.
    const subjectKeys = useMemo(() => {
        const keys = new Set<string>();
        rows.forEach((r) => {
            Object.keys(r.subject_scores ?? {}).forEach((k) => keys.add(k));
        });
        return Array.from(keys);
    }, [rows]);

    const subjectColumns = useMemo(() => {
        if (subjectId) {
            const idx = subjectKeys.indexOf(subjectId);
            return [{ key: subjectId, label: idx >= 0 ? `Mapel ${idx + 1}` : "Nilai Mapel" }];
        }
        return subjectKeys.map((k, i) => ({ key: k, label: `Mapel ${i + 1}` }));
    }, [subjectId, subjectKeys]);

    // Ordering: subject view ranks by the chosen subject; otherwise apply optional
    // client-side sort (total / average), keeping API rank as the authoritative #.
    const displayedOrder = useMemo(() => {
        if (subjectId) {
            return [...rows].sort(
                (a, b) =>
                    (b.subject_scores?.[subjectId] ?? -Infinity) -
                        (a.subject_scores?.[subjectId] ?? -Infinity) ||
                    a.rank - b.rank
            );
        }
        if (sortKey === "rank") return rows;
        const dir = sortDir === "asc" ? 1 : -1;
        return [...rows].sort((a, b) => (a[sortKey] - b[sortKey]) * dir);
    }, [rows, subjectId, sortKey, sortDir]);

    const myRow = useMemo(() => {
        if (!user) return null;
        return (
            rows.find(
                (r) =>
                    (user.id && r.user_id === user.id) ||
                    (r.full_name &&
                        user.full_name &&
                        r.full_name.trim().toLowerCase() === user.full_name.trim().toLowerCase())
            ) ?? null
        );
    }, [rows, user]);

    const isMe = (r: RankingRow) =>
        !!user &&
        ((user.id && r.user_id === user.id) ||
            (r.full_name &&
                user.full_name &&
                r.full_name.trim().toLowerCase() === user.full_name.trim().toLowerCase()));

    const posisi = useMemo(() => {
        if (myRankFromApi && myRank) {
            return { rank: myRank.rank, total: myRank.total_siswa, delta: myRank.delta_rank };
        }
        if (displayedOrder.length > 0 && myRow) {
            const idx = displayedOrder.findIndex((r) => r.user_id === myRow.user_id);
            return { rank: idx >= 0 ? idx + 1 : myRow.rank, total: rows.length, delta: undefined };
        }
        return null;
    }, [myRankFromApi, myRank, displayedOrder, myRow, rows.length]);

    const topPct =
        posisi && posisi.total > 0 && posisi.rank > 0
            ? (posisi.rank / posisi.total) * 100
            : null;

    const podiumSlots = useMemo(
        () => [
            { row: displayedOrder[1], rank: 2 },
            { row: displayedOrder[0], rank: 1 },
            { row: displayedOrder[2], rank: 3 },
        ],
        [displayedOrder]
    );

    function toggleSort(key: "total" | "average") {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    }

    function resetFilters() {
        setPackageId(ALL);
        setSubjectId(ALL);
        setMonth("");
        setMode("BEST");
        setSortKey("rank");
        setSortDir("asc");
    }

    return (
        <AppShell>
            <div className="space-y-6 font-sans">
                {/* Header */}
                <SectionHeader
                    icon={Trophy}
                    title="Peringkat Nasional"
                    subtitle="Posisi kompetitif kamu di seluruh siswa YakinLulus.id berdasarkan hasil ujian."
                />

                {/* Posisi Saya */}
                {loading ? (
                    <Card className="rounded-2xl">
                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-2xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-7 w-16" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6 sm:ml-auto">
                                <Skeleton className="h-10 w-16" />
                                <Skeleton className="h-10 w-16" />
                                <Skeleton className="h-10 w-16" />
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="rounded-2xl">
                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Posisi Saya
                                    </p>
                                    <div className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
                                        {posisi ? `#${posisi.rank}` : "#—"}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:ml-auto sm:grid-cols-3">
                                <Stat label="Perubahan">
                                    <DeltaBadge delta={posisi?.delta} />
                                </Stat>
                                <Stat label="Total Siswa">
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        {posisi ? fmtScore(posisi.total) : "—"}
                                    </span>
                                </Stat>
                                <Stat label="Persentase">
                                    {topPct !== null ? `Top ${topPct.toFixed(1)}%` : "—"}
                                </Stat>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Picker / Filter */}
                <Card className="rounded-2xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Mode Peringkat
                        </span>
                        <div
                            role="tablist"
                            aria-label="Mode peringkat"
                            className="inline-flex items-center gap-1 rounded-xl bg-muted p-1"
                        >
                            {MODES.map((m) => (
                                <button
                                    key={m.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === m.key}
                                    onClick={() => setMode(m.key)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                        mode === m.key
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <m.icon className="h-3.5 w-3.5" />
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                Paket Ujian
                            </span>
                            <Select value={packageId} onValueChange={(v) => setPackageId(v ?? ALL)}>
                                <SelectTrigger className="h-11 w-full rounded-xl">
                                    <SelectValue placeholder="Semua Paket" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>Semua Paket</SelectItem>
                                    {packages.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name || p.code || p.id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                Bulan (opsional)
                            </span>
                            <Input
                                type="month"
                                value={month}
                                title="YYYY-MM"
                                aria-label="Filter bulan (YYYY-MM)"
                                className="h-11 rounded-xl"
                                onChange={(e) => setMonth(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                                Mapel (opsional)
                            </span>
                            <Select
                                value={subjectId}
                                disabled={subjectKeys.length === 0}
                                onValueChange={(v) => setSubjectId(v ?? ALL)}
                            >
                                <SelectTrigger className="h-11 w-full rounded-xl">
                                    <SelectValue placeholder="Semua Mapel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>Semua Mapel</SelectItem>
                                    {subjectKeys.map((k, i) => (
                                        <SelectItem key={k} value={k}>
                                            Mapel {i + 1}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {modeNotice && (
                    <div className="flex items-start gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-xs text-orange-600 dark:text-orange-400">
                        <Info className="h-4 w-4 shrink-0" />
                        <p>{modeNotice}</p>
                    </div>
                )}

                {/* Leaderboard body */}
                {loading ? (
                    <>
                        {/* Podium skeleton */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {[0, 1, 2].map((i) => (
                                <Card key={i} className="rounded-2xl">
                                    <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                                        <Skeleton className="h-5 w-5" />
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-7 w-16" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Table skeleton */}
                        <Card className="overflow-hidden rounded-2xl">
                            <div className="space-y-2 border-b px-4 py-4">
                                <Skeleton className="h-5 w-44" />
                                <Skeleton className="h-3 w-64" />
                            </div>
                            <div className="divide-y divide-border">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4 px-4 py-3"
                                    >
                                        <Skeleton className="h-7 w-7 rounded-full" />
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3.5 w-40" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="hidden h-4 w-16 sm:block" />
                                        <Skeleton className="hidden h-4 w-12 md:block" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                ) : error ? (
                    <EmptyState
                        icon={AlertTriangle}
                        title="Gagal Memuat Peringkat"
                        description={error}
                        actionLabel="Coba Lagi"
                        onAction={() => setRetryToken((t) => t + 1)}
                    />
                ) : rows.length === 0 ? (
                    <EmptyState
                        icon={ListOrdered}
                        title="Belum Ada Data Peringkat"
                        description="Belum ada data peringkat untuk filter ini. Coba ubah mode, paket, atau bulan."
                        actionLabel="Reset Filter"
                        onAction={resetFilters}
                    />
                ) : (
                    <>
                        {/* Podium Top-3 */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {podiumSlots.map((slot) => {
                                if (!slot.row) return <div key={slot.rank} />;
                                const first = slot.rank === 1;
                                return (
                                    <Card
                                        key={`podium-${slot.rank}`}
                                        className={cn(
                                            "relative rounded-2xl text-center",
                                            first
                                                ? "border-primary/40 bg-primary/5 md:-mt-6"
                                                : "border-border md:mt-6"
                                        )}
                                    >
                                        {first && (
                                            <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 gap-1 text-[10px]">
                                                <Crown className="h-3 w-3" /> JUARA 1
                                            </Badge>
                                        )}
                                        <CardContent className="flex flex-col items-center gap-2 p-6">
                                            <span className="flex h-5 items-center justify-center text-muted-foreground">
                                                {slot.rank === 1 ? (
                                                    <Crown className="h-5 w-5 text-amber-500 fill-amber-400" />
                                                ) : (
                                                    <Medal
                                                        className={cn(
                                                            "h-5 w-5",
                                                            slot.rank === 2
                                                                ? "text-slate-500"
                                                                : "text-orange-500"
                                                        )}
                                                    />
                                                )}
                                            </span>
                                            <Avatar
                                                fallback={(slot.row.full_name || "YL").charAt(0)}
                                                size={first ? "xl" : "lg"}
                                                className={cn(
                                                    "border-2",
                                                    first ? "border-primary" : "border-border"
                                                )}
                                            />
                                            <div className="space-y-0.5">
                                                <h3 className="font-heading text-sm font-bold leading-tight">
                                                    {slot.row.full_name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {slot.row.school_name || "—"}
                                                </p>
                                            </div>
                                            <div className="pt-1">
                                                <span className="font-heading text-2xl font-extrabold text-primary">
                                                    {fmtScore(slot.row.total)}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Ranking table */}
                        <Card className="overflow-hidden rounded-2xl">
                            <div className="border-b px-4 py-4">
                                <SectionHeader
                                    icon={ListOrdered}
                                    title={
                                        subjectId
                                            ? "Daftar Peringkat per Mapel"
                                            : "Daftar Peringkat"
                                    }
                                    subtitle={
                                        subjectId
                                            ? "Urutan dihitung dari nilai pada mapel terpilih."
                                            : "Semua siswa, diurutkan dari posisi terbaik. Baris kamu di-highlight."
                                    }
                                />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="w-12 text-center">#</TableHead>
                                        <TableHead className="min-w-[200px]">Siswa</TableHead>
                                        <TableHead className="min-w-[160px]">Sekolah</TableHead>
                                        {subjectColumns.map((c) => (
                                            <TableHead key={c.key} className="text-right">
                                                {c.label}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-right">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("total")}
                                                disabled={!!subjectId}
                                                className="inline-flex items-center gap-1 font-medium text-foreground disabled:cursor-default"
                                                aria-label="Urutkan total"
                                            >
                                                Total
                                                {!subjectId &&
                                                    (sortKey === "total" ? (
                                                        sortDir === "asc" ? (
                                                            <ArrowUp className="h-3 w-3" />
                                                        ) : (
                                                            <ArrowDown className="h-3 w-3" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                                    ))}
                                            </button>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("average")}
                                                disabled={!!subjectId}
                                                className="inline-flex items-center gap-1 font-medium text-foreground disabled:cursor-default"
                                                aria-label="Urutkan rata-rata"
                                            >
                                                Rata-rata
                                                {!subjectId &&
                                                    (sortKey === "average" ? (
                                                        sortDir === "asc" ? (
                                                            <ArrowUp className="h-3 w-3" />
                                                        ) : (
                                                            <ArrowDown className="h-3 w-3" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                                    ))}
                                            </button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedOrder.map((r, i) => {
                                        const displayRank = subjectId ? i + 1 : r.rank;
                                        const me = isMe(r);
                                        return (
                                            <TableRow
                                                key={r.user_id || i}
                                                className={cn(
                                                    me && "bg-primary/10 font-medium hover:bg-primary/10"
                                                )}
                                            >
                                                <TableCell className="text-center">
                                                    <RankBadge rank={displayRank} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            fallback={(r.full_name || "YL").charAt(0)}
                                                            size="sm"
                                                        />
                                                        <div className="space-y-0.5">
                                                            <span
                                                                className={cn(
                                                                    "font-heading text-sm leading-tight",
                                                                    me
                                                                        ? "font-bold text-primary"
                                                                        : "font-semibold text-foreground"
                                                                )}
                                                            >
                                                                {r.full_name}
                                                            </span>
                                                            {me && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[10px] text-primary gap-0.5"
                                                                >
                                                                    <Crown className="h-2.5 w-2.5" />
                                                                    Kamu
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {r.school_name || "—"}
                                                </TableCell>
                                                {subjectColumns.map((c) => (
                                                    <TableCell
                                                        key={c.key}
                                                        className={cn(
                                                            "text-right font-mono text-sm",
                                                            subjectId && c.key === subjectId && displayRank === 1
                                                                ? "text-primary font-bold"
                                                                : "text-foreground"
                                                        )}
                                                    >
                                                        {fmtScore(r.subject_scores?.[c.key])}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-right font-mono text-sm font-semibold text-foreground">
                                                    {fmtScore(r.total)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                                    {fmtScore(r.average)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Card>
                    </>
                )}
            </div>
        </AppShell>
    );
}