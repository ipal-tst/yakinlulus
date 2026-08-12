// frontend/src/app/(siswa)/targets/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/siswa/EmptyState";
import { SectionHeader } from "@/components/siswa/SectionHeader";
import { ThreatBadge } from "@/components/siswa/ThreatBadge";
import { targetSchoolService } from "@/services/target-school.service";
import { ApiError } from "@/lib/api";
import {
    type TargetCatalogEntry,
    type EnrichedTarget,
    type SaveTargetPayload,
    type VerdictStatus,
    chanceBand,
    type ColorBand,
} from "@/types/siswa";
import { cn } from "@/lib/utils";
import {
    School,
    Target,
    Search,
    MapPin,
    Pencil,
    Trash2,
    Plus,
    Trophy,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    GraduationCap,
} from "lucide-react";

const ALL = "__all__";

const BAND_BADGE: Record<ColorBand, string> = {
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    grey: "bg-muted text-muted-foreground border-border",
};

function progressBarColor(status: VerdictStatus): string {
    switch (status) {
        case "PASSED":
        case "SAFE":
            return "bg-emerald-500";
        case "NEAR":
        case "BELOW":
            return "bg-amber-500";
        case "CRITICAL":
            return "bg-red-500";
        default:
            return "bg-muted-foreground/40";
    }
}

function levelLabel(level: string | undefined): string {
    if (level === "UNIVERSITY") return "Universitas";
    return level || "Sekolah";
}

function chanceOf(entry: TargetCatalogEntry): number | null {
    if (!entry.has_score_data) return null;
    if (typeof entry.chance_pct === "number" && Number.isFinite(entry.chance_pct)) {
        return entry.chance_pct;
    }
    if (
        typeof entry.student_score === "number" &&
        typeof entry.min_score === "number" &&
        entry.min_score > 0
    ) {
        return Math.min(100, (entry.student_score / entry.min_score) * 100);
    }
    return null;
}

function gapOf(entry: TargetCatalogEntry): number | null {
    if (typeof entry.gap === "number" && Number.isFinite(entry.gap)) return entry.gap;
    if (
        entry.has_score_data &&
        typeof entry.student_score === "number" &&
        typeof entry.min_score === "number"
    ) {
        return entry.min_score - entry.student_score;
    }
    return null;
}

interface PickSchoolInput {
    name: string;
    school_id?: string;
    min_score?: number;
    max_score?: number;
    student_score?: number;
    has_score_data: boolean;
    chance_pct?: number;
    defaultChoice?: 1 | 2;
    defaultMajor?: string;
}

function toPickSchool(e: TargetCatalogEntry, existing?: EnrichedTarget | null): PickSchoolInput {
    return {
        name: e.name,
        school_id: e.school_id,
        min_score: e.min_score,
        max_score: e.max_score,
        student_score: e.student_score,
        has_score_data: e.has_score_data,
        chance_pct: existing?.progress_pct ?? e.chance_pct,
    };
}

function CatalogSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4">
            {[0, 1, 2].map((i) => (
                <Card key={i} className="p-5 rounded-2xl">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-8 w-28 rounded-xl" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function SlotSkeleton() {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
        </div>
    );
}

export default function TargetsPage() {
    const [myTargets, setMyTargets] = useState<EnrichedTarget[]>([]);
    const [catalog, setCatalog] = useState<TargetCatalogEntry[]>([]);
    const [targetsLoading, setTargetsLoading] = useState(true);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogUnavailable, setCatalogUnavailable] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [catalogReloadKey, setCatalogReloadKey] = useState(0);

    const [level, setLevel] = useState<string>(ALL);
    const [province, setProvince] = useState<string>(ALL);
    const [city, setCity] = useState<string>(ALL);
    const [search, setSearch] = useState("");
    const [onlyHigh, setOnlyHigh] = useState(false);

    const [pickOpen, setPickOpen] = useState(false);
    const [pickSchool, setPickSchool] = useState<PickSchoolInput | null>(null);
    const [pickChoice, setPickChoice] = useState<1 | 2>(1);
    const [pickMajor, setPickMajor] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [deletingChoice, setDeletingChoice] = useState<1 | 2 | null>(null);
    const [confirmDeleteChoice, setConfirmDeleteChoice] = useState<1 | 2 | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const catalogSectionRef = useRef<HTMLDivElement>(null);
    const levelDefaulted = useRef(false);
    const myTargetsRef = useRef<EnrichedTarget[]>([]);
    const catalogRef = useRef<TargetCatalogEntry[]>([]);

    const refreshTargets = useCallback(() => setReloadKey((k) => k + 1), []);
    const refreshCatalog = useCallback(() => setCatalogReloadKey((k) => k + 1), []);

    useEffect(() => {
        myTargetsRef.current = myTargets;
    }, [myTargets]);

    useEffect(() => {
        catalogRef.current = catalog;
    }, [catalog]);

    const maybeDefaultLevel = useCallback(() => {
        if (levelDefaulted.current) return;
        const list = catalogRef.current;
        const tLevel = myTargetsRef.current.find((t) => t.target_type)?.target_type;
        const levels = Array.from(
            new Set(list.map((e) => e.level).filter((x): x is string => Boolean(x)))
        );
        if (tLevel && levels.includes(tLevel)) {
            levelDefaulted.current = true;
            setLevel(tLevel);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setTargetsLoading(true);
            try {
                const list = await targetSchoolService.getMyTargets();
                if (!cancelled) setMyTargets(Array.isArray(list) ? list : []);
            } catch {
                if (!cancelled) setMyTargets([]);
            } finally {
                if (!cancelled) {
                    setTargetsLoading(false);
                    maybeDefaultLevel();
                }
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [reloadKey, maybeDefaultLevel]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setCatalogLoading(true);
            setCatalogUnavailable(false);
            setCatalogError(null);
            try {
                const list = await targetSchoolService.getTargetCatalog();
                if (cancelled) return;
                setCatalog(Array.isArray(list) ? list : []);
            } catch (err: unknown) {
                if (cancelled) return;
                const status = err instanceof ApiError ? err.status : 0;
                setCatalogUnavailable(status === 0 || status === 404 || status >= 500);
                setCatalogError(
                    err instanceof Error ? err.message : "Gagal memuat katalog sekolah."
                );
                setCatalog([]);
            } finally {
                if (!cancelled) {
                    setCatalogLoading(false);
                    maybeDefaultLevel();
                }
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [catalogReloadKey, maybeDefaultLevel]);

    const levelOptions = useMemo(
        () => Array.from(new Set(catalog.map((e) => e.level).filter((x): x is string => Boolean(x)))),
        [catalog]
    );

    const provinceOptions = useMemo(
        () =>
            Array.from(
                new Set(catalog.map((e) => e.province).filter((x): x is string => Boolean(x)))
            ).sort((a, b) => a.localeCompare(b)),
        [catalog]
    );

    const cityOptions = useMemo(() => {
        const scoped = province === ALL ? catalog : catalog.filter((e) => e.province === province);
        return Array.from(
            new Set(scoped.map((e) => e.city).filter((x): x is string => Boolean(x)))
        ).sort((a, b) => a.localeCompare(b));
    }, [catalog, province]);

    const targetType = myTargets.find((t) => t.target_type)?.target_type;

    const filteredCatalog = useMemo(() => {
        let list = catalog;
        if (level !== ALL) list = list.filter((e) => e.level === level);
        if (province !== ALL) list = list.filter((e) => e.province === province);
        if (city !== ALL) list = list.filter((e) => e.city === city);
        const q = search.trim().toLowerCase();
        if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));
        if (onlyHigh) list = list.filter((e) => e.status === "PASSED" || (chanceOf(e) ?? 0) >= 85);
        return [...list].sort(
            (a, b) =>
                (a.min_score ?? Number.MAX_SAFE_INTEGER) - (b.min_score ?? Number.MAX_SAFE_INTEGER)
        );
    }, [catalog, level, province, city, search, onlyHigh]);

    const targetAtChoice = useCallback(
        (choice: 1 | 2) => myTargets.find((t) => t.choice === choice),
        [myTargets]
    );

    const existingTargetFor = useCallback(
        (school: PickSchoolInput) =>
            myTargets.find(
                (t) =>
                    t.school_name === school.name ||
                    (!!school.school_id && t.target_school_id === school.school_id)
            ),
        [myTargets]
    );

    const scrollToCatalog = () => {
        catalogSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const openPick = (school: PickSchoolInput) => {
        const existing = existingTargetFor(school);
        const freeChoices = ([1, 2] as const).filter((c) => !myTargets.some((t) => t.choice === c));
        const available = existing
            ? Array.from(new Set<1 | 2>([...freeChoices, existing.choice]))
            : freeChoices;

        if (available.length === 0) {
            setNotice("Kedua slot pilihan sudah penuh — ubah atau hapus salah satu target dulu.");
            return;
        }

        setPickSchool(school);
        setPickChoice(existing?.choice ?? available[0]);
        setPickMajor(school.defaultMajor ?? existing?.major ?? "");
        setSaveError(null);
        setPickOpen(true);
    };

    const openPickFromCard = (e: TargetCatalogEntry) => {
        const existing = existingTargetFor(toPickSchool(e));
        openPick(toPickSchool(e, existing));
    };

    const openPickFromSlot = (choice: 1 | 2) => {
        const target = targetAtChoice(choice);
        if (!target) return;
        openPick({
            name: target.school_name,
            school_id: target.target_school_id ?? undefined,
            min_score: target.min_score,
            max_score: target.max_score,
            student_score: target.student_score,
            has_score_data: target.has_score_data,
            chance_pct: target.progress_pct,
            defaultChoice: target.choice,
            defaultMajor: target.major ?? undefined,
        });
    };

    const handleSaveTarget = async () => {
        if (!pickSchool || saving) return;
        setSaving(true);
        setSaveError(null);
        try {
            const chosen = pickChoice;
            const others = myTargets
                .filter((t) => t.choice !== chosen)
                .map((t) => ({
                    choice: t.choice,
                    target_school_id: t.target_school_id ?? undefined,
                    school_name: t.school_name,
                    major: t.major ?? undefined,
                    passing_score_irt: t.passing_score_irt,
                }));

            const targets: SaveTargetPayload["targets"] = [
                ...others,
                {
                    choice: chosen,
                    target_school_id: pickSchool.school_id,
                    school_name: pickSchool.name,
                    major: pickMajor.trim() || undefined,
                },
            ];
            await targetSchoolService.saveMyTargets({ targets });
            await refreshTargets();
            setPickOpen(false);
            setPickSchool(null);
            setNotice(`Target "${pickSchool.name}" disimpan sebagai Pilihan ${chosen}.`);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Gagal menyimpan target.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTarget = async (choice: 1 | 2) => {
        if (deletingChoice) return;
        setDeletingChoice(choice);
        try {
            const target = targetAtChoice(choice);
            await targetSchoolService.deleteMyTarget(choice);
            await refreshTargets();
            setConfirmDeleteChoice(null);
            setNotice(`Target "${target?.school_name || "Pilihan " + choice}" dihapus.`);
        } catch {
            setNotice("Gagal menghapus target, silakan coba lagi.");
        } finally {
            setDeletingChoice(null);
        }
    };

    return (
        <AppShell>
            <div className="space-y-6 md:space-y-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                            Target Sekolah
                        </h1>
                        <Badge
                            variant="outline"
                            className="gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary/10 border-primary/20 text-primary shrink-0"
                        >
                            <Target className="h-3.5 w-3.5" /> Maks 2 Pilihan
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Jelajahi sekolah tujuan, bandingkan nilaimu dengan nilai masuk, dan kelola
                        target sekolah impianmu.
                    </p>
                    <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                        Jenjang targetmu:{" "}
                        <span className="font-semibold text-foreground">
                            {targetType ? levelLabel(targetType) : "Belum terdeteksi"}
                        </span>
                        {targetType && (
                            <>
                                <span className="text-muted-foreground/60">·</span>
                                <span>katalog otomatis difilter jenjang {levelLabel(targetType)}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
                    {/* Left: Target Saya */}
                    <div className="space-y-4">
                        <SectionHeader
                            icon={Target}
                            title="Target Saya"
                            subtitle="Maksimal 2 pilihan sekolah target"
                        />

                        {notice && (
                            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{notice}</span>
                            </div>
                        )}

                        {([1, 2] as const).map((choice) => {
                            const target = targetAtChoice(choice);
                            const isDeleting = deletingChoice === choice;
                            const confirmDelete = confirmDeleteChoice === choice;
                            return (
                                <Card key={choice} className="rounded-2xl p-5">
                                    {targetsLoading ? (
                                        <SlotSkeleton />
                                    ) : target ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="gap-1 rounded-full text-[11px] font-semibold"
                                                >
                                                    <Target className="h-3 w-3" /> Pilihan {choice}
                                                </Badge>
                                                <ThreatBadge status={target.threshold_state} />
                                            </div>
                                            <div>
                                                <h3 className="font-heading text-base font-bold text-foreground leading-snug">
                                                    {target.school_name}
                                                </h3>
                                                {target.major && (
                                                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                                        {target.major}
                                                    </p>
                                                )}
                                            </div>

                                            {target.has_score_data ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs font-semibold">
                                                        <span className="text-muted-foreground">
                                                            Nilaimu:{" "}
                                                            <strong className="text-foreground">
                                                                {target.student_score ?? "—"}
                                                            </strong>
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            Nilai masuk:{" "}
                                                            <strong className="text-foreground">
                                                                {target.min_score ?? "—"}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={Math.max(
                                                            0,
                                                            Math.min(100, target.progress_pct)
                                                        )}
                                                        className="h-2.5"
                                                        indicatorClassName={progressBarColor(
                                                            target.threshold_state
                                                        )}
                                                    />
                                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                        <span>
                                                            {Math.round(target.progress_pct)}% dari
                                                            nilai target
                                                        </span>
                                                        {target.progress_pct >= 100 ? (
                                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                                Target Tercapai
                                                            </span>
                                                        ) : (
                                                            <span>
                                                                Sisa{" "}
                                                                {Math.round(100 - target.progress_pct)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                                                    Belum ada nilai tryout.{" "}
                                                    <Link
                                                        href="/exams"
                                                        className="font-semibold text-primary hover:underline"
                                                    >
                                                        Kerjakan tryout
                                                    </Link>{" "}
                                                    untuk melihat peluang.
                                                </p>
                                            )}

                                            {confirmDelete ? (
                                                <div className="flex items-center justify-between gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2">
                                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                                        Hapus target ini?
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="xs"
                                                            variant="destructive"
                                                            className="rounded-lg"
                                                            disabled={isDeleting}
                                                            onClick={() =>
                                                                handleDeleteTarget(choice)
                                                            }
                                                        >
                                                            {isDeleting ? "Menghapus..." : "Hapus"}
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            className="rounded-lg"
                                                            onClick={() =>
                                                                setConfirmDeleteChoice(null)
                                                            }
                                                        >
                                                            Batal
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 pt-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 rounded-xl gap-1.5"
                                                        onClick={() => openPickFromSlot(choice)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" /> Ubah
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="rounded-xl gap-1.5 text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                                                        onClick={() => setConfirmDeleteChoice(choice)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 shadow-sm">
                                                <Plus className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="font-heading text-sm font-semibold text-foreground">
                                                    Pilihan {choice}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Belum diisi
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl gap-1.5"
                                                onClick={scrollToCatalog}
                                            >
                                                Set Target <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}

                        {myTargets.length >= 2 && (
                            <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    Kedua slot sudah terisi — ubah atau hapus salah satu untuk
                                    menambah target baru.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right: Katalog Sekolah */}
                    <div ref={catalogSectionRef} className="scroll-mt-24 space-y-4" id="katalog">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <SectionHeader
                                icon={School}
                                title="Katalog Sekolah"
                                subtitle="Sekolah tujuan sesuai jenjangmu, diurutkan per nilai masuk"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl gap-1.5"
                                onClick={refreshCatalog}
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Muat Ulang
                            </Button>
                        </div>

                        {/* Filters */}
                        <Card className="rounded-2xl p-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari nama sekolah…"
                                        className="h-11 pl-9 rounded-xl"
                                        aria-label="Cari nama sekolah"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                        Jenjang
                                    </span>
                                    <Select
                                        value={level}
                                        onValueChange={(v) => setLevel(v ?? ALL)}
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-xl">
                                            <SelectValue placeholder="Semua Jenjang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ALL}>Semua Jenjang</SelectItem>
                                            {levelOptions.map((l) => (
                                                <SelectItem key={l} value={l}>
                                                    {levelLabel(l)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                        Provinsi
                                    </span>
                                    <Select
                                        value={province}
                                        onValueChange={(v) => {
                                            setProvince(v ?? ALL);
                                            setCity(ALL);
                                        }}
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-xl">
                                            <SelectValue placeholder="Semua Provinsi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ALL}>Semua Provinsi</SelectItem>
                                            {provinceOptions.map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-muted-foreground">
                                        Kab./Kota
                                    </span>
                                    <Select value={city} onValueChange={(v) => setCity(v ?? ALL)}>
                                        <SelectTrigger className="h-11 w-full rounded-xl">
                                            <SelectValue placeholder="Semua Kota" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ALL}>Semua Kota</SelectItem>
                                            {cityOptions.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <label className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Switch
                                    checked={onlyHigh}
                                    onCheckedChange={setOnlyHigh}
                                    aria-label="Hanya peluang tinggi"
                                />
                                Hanya sekolah dengan peluang tinggi (≥85%)
                            </label>
                        </Card>

                        {/* Catalog content */}
                        {catalogLoading ? (
                            <CatalogSkeleton />
                        ) : catalogUnavailable ? (
                            <EmptyState
                                icon={School}
                                title="Katalog Sekolah Belum Tersedia"
                                description={
                                    catalogError ||
                                    "Endpoint katalog sekolah masih dalam pengembangan. Kamu tetap bisa mengelola target dari panel Target Saya."
                                }
                                actionLabel="Coba Lagi"
                                onAction={refreshCatalog}
                                className="py-10"
                            />
                        ) : filteredCatalog.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title="Tidak Ada Sekolah Ditemukan"
                                description="Coba ubah kata kunci atau atur ulang filter provinsi/kota/jenjang."
                                actionLabel="Atur Ulang Filter"
                                onAction={() => {
                                    setSearch("");
                                    setLevel(ALL);
                                    setProvince(ALL);
                                    setCity(ALL);
                                    setOnlyHigh(false);
                                }}
                                className="py-10"
                            />
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredCatalog.map((e) => {
                                    const chancePct = chanceOf(e);
                                    const gap = gapOf(e);
                                    const already = existingTargetFor(toPickSchool(e));
                                    return (
                                        <Card
                                            key={e.school_id}
                                            className="rounded-2xl p-5"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 flex-1 space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-heading text-base font-bold text-foreground leading-snug">
                                                            {e.name}
                                                        </h3>
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-full bg-primary/10 border-primary/20 text-primary text-[10px] font-semibold"
                                                        >
                                                            {levelLabel(e.level)}
                                                        </Badge>
                                                        {already && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="rounded-full text-[10px] font-semibold"
                                                            >
                                                                Pilihan {already.choice}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {(e.province || e.city) && (
                                                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {[e.province, e.city]
                                                                .filter(Boolean)
                                                                .join(" · ") || "Lokasi belum tersedia"}
                                                            {e.academic_year && (
                                                                <>
                                                                    <span className="text-muted-foreground/60">·</span>
                                                                    <span>{e.academic_year}</span>
                                                                </>
                                                            )}
                                                        </p>
                                                    )}

                                                    {e.subjects.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {e.subjects.map((s, i) => (
                                                                <Badge
                                                                    key={`${s}-${i}`}
                                                                    variant="outline"
                                                                    className="rounded-full bg-muted/60 text-[10px] font-medium text-muted-foreground"
                                                                >
                                                                    {s}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                                                        <span>
                                                            Nilai masuk:{" "}
                                                            <strong className="text-foreground">
                                                                {e.min_score ??
                                                                    e.max_score ??
                                                                    "—"}
                                                            </strong>
                                                            {e.max_score &&
                                                                e.min_score && (
                                                                    <>
                                                                        {" "}
                                                                        –{" "}
                                                                        <strong className="text-foreground">
                                                                            {e.max_score}
                                                                        </strong>
                                                                    </>
                                                                )}
                                                        </span>
                                                        <span>
                                                            Nilaimu:{" "}
                                                            <strong className="text-foreground">
                                                                {e.has_score_data
                                                                    ? e.student_score ?? "—"
                                                                    : "—"}
                                                            </strong>
                                                        </span>
                                                        {gap !== null ? (
                                                            <span
                                                                className={cn(
                                                                    "font-semibold",
                                                                    gap <= 0
                                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                                        : "text-amber-600 dark:text-amber-400"
                                                                )}
                                                            >
                                                                {gap <= 0
                                                                    ? `Lolos (+${Math.abs(gap)})`
                                                                    : `Kurang ${Math.round(gap)} poin`}
                                                            </span>
                                                        ) : (
                                                            <span>Jarak belum tersedia</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
                                                    {chancePct !== null ? (
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "gap-1 rounded-full font-semibold",
                                                                BAND_BADGE[chanceBand(chancePct)]
                                                            )}
                                                        >
                                                            {Math.round(chancePct)}% Peluang
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-full bg-muted text-muted-foreground font-semibold"
                                                        >
                                                            Belum ada nilai
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        className="w-full rounded-xl gap-1.5 lg:w-auto"
                                                        onClick={() => openPickFromCard(e)}
                                                    >
                                                        <Target className="h-3.5 w-3.5" />
                                                        {already
                                                            ? `Ubah Pilihan ${already.choice}`
                                                            : "Pilih sebagai Target"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pick target dialog */}
            <Dialog
                open={pickOpen}
                onOpenChange={(o) => {
                    if (!o && !saving) {
                        setPickOpen(false);
                        setPickSchool(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            {pickSchool ? "Pilih Pilihan Target" : "Target Sekolah"}
                        </DialogTitle>
                        <DialogDescription>
                            Tetapkan sekolah sebagai Pilihan 1 atau 2 (maksimal 2 target).
                        </DialogDescription>
                    </DialogHeader>

                    {pickSchool && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                                <p className="text-sm font-semibold text-foreground">
                                    {pickSchool.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {pickSchool.has_score_data ? (
                                        <>
                                            Nilaimu:{" "}
                                            <strong className="text-foreground">
                                                {pickSchool.student_score ?? "—"}
                                            </strong>{" "}
                                            vs nilai masuk{" "}
                                            <strong className="text-foreground">
                                                {pickSchool.min_score ?? "—"}
                                            </strong>
                                        </>
                                    ) : (
                                        "Belum ada nilai tryout — kerjakan tryout untuk melihat peluang."
                                    )}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {([1, 2] as const).map((c) => {
                                    const filledByOthers = myTargets.some(
                                        (t) => t.choice === c && t.school_name !== pickSchool.name
                                    );
                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setPickChoice(c)}
                                            className={cn(
                                                "rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                pickChoice === c
                                                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                                                    : "border-border bg-background hover:bg-muted"
                                            )}
                                        >
                                            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                                <Target className="h-3.5 w-3.5 text-primary" />
                                                Pilihan {c}
                                            </span>
                                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                {filledByOthers
                                                    ? "Slot terisi target lain (akan diganti)"
                                                    : targetAtChoice(c)
                                                      ? "Target saat ini"
                                                      : "Slot kosong"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Jurusan (opsional)
                                </label>
                                <Input
                                    value={pickMajor}
                                    onChange={(e) => setPickMajor(e.target.value)}
                                    placeholder="Contoh: IPA / Teknik Informatika"
                                    className="h-11 rounded-xl"
                                />
                            </div>

                            {saveError && (
                                <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{saveError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:justify-end mt-4">
                        <DialogClose
                            render={<Button variant="outline" className="rounded-xl" />}
                        >
                            Batal
                        </DialogClose>
                        <Button
                            className="rounded-xl gap-1.5"
                            disabled={!pickSchool || saving}
                            onClick={handleSaveTarget}
                        >
                            <Trophy className="h-4 w-4" />
                            {saving ? "Menyimpan..." : "Simpan Target"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
}