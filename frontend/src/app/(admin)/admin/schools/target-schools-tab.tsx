// src/app/(admin)/admin/schools/target-schools-tab.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { TargetScoreTable, TargetScoreRow } from "@/components/admin/schools/target-score-table";
import { TargetScoreFormDialog } from "@/components/admin/schools/target-score-form-dialog";
import { TargetScoreTrendPanel } from "@/components/admin/schools/target-score-trend-panel";
import { ImportResultCard } from "@/components/admin/shared/import-result-card";
import { BulkActionBar } from "@/components/admin/shared/bulk-action-bar";
import { targetSchoolService, TargetSchoolScore, TargetSchool } from "@/services/target-school.service";
import { defaultMaxTotal } from "@/lib/target-school-mappers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle, LineChart as LineChartIcon, Download, Upload } from "lucide-react";

const LEVEL_OPTIONS = ["SMP", "SMA", "UNIVERSITY"];
const ALL = "all";

function unwrapPayungs(data: TargetSchool[] | { items?: TargetSchool[] } | null | undefined): TargetSchool[] {
    if (Array.isArray(data)) return data;
    return data?.items ?? [];
}

function unwrapScores(data: TargetSchoolScore[] | { items?: TargetSchoolScore[] } | null | undefined): TargetSchoolScore[] {
    if (Array.isArray(data)) return data;
    return data?.items ?? [];
}

function buildRows(scores: TargetSchoolScore[], payungs: TargetSchool[]): TargetScoreRow[] {
    const payungMap = new Map<string, TargetSchool>();
    for (const p of payungs) payungMap.set(p.id, p);

    const byPayung = new Map<string, TargetSchoolScore[]>();
    for (const s of scores) {
        const arr = byPayung.get(s.target_school_id) ?? [];
        arr.push(s);
        byPayung.set(s.target_school_id, arr);
    }

    const rows: TargetScoreRow[] = [];
    for (const [pid, arr] of byPayung) {
        const payung = payungMap.get(pid);
        const sorted = [...arr].sort((a, b) => a.academic_year.localeCompare(b.academic_year));
        for (let i = 0; i < sorted.length; i++) {
            const cur = sorted[i];
            const prev = sorted[i - 1];
            rows.push({
                id: cur.id,
                target_school_id: pid,
                school_name: payung?.name ?? "—",
                level: payung?.level ?? "",
                academic_year: cur.academic_year,
                min_score: cur.min_score,
                max_score: cur.max_score,
                max_total_score: cur.max_total_score,
                is_active: payung?.is_active ?? false,
                delta_min: cur.min_score != null && prev?.min_score != null ? cur.min_score - prev.min_score : undefined,
                delta_max: cur.max_score != null && prev?.max_score != null ? cur.max_score - prev.max_score : undefined,
            });
        }
    }
    rows.sort((a, b) => {
        const y = b.academic_year.localeCompare(a.academic_year);
        if (y !== 0) return y;
        return a.school_name.localeCompare(b.school_name, "id");
    });
    return rows;
}

export function TargetSchoolsTab() {
    const qc = useQueryClient();
    const [year, setYear] = useState<string | undefined>();
    const [level, setLevel] = useState<string | undefined>();
    const [trendMode, setTrendMode] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingScore, setEditingScore] = useState<TargetSchoolScore | null>(null);
    const [addToPayungId, setAddToPayungId] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<TargetScoreRow | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ total: number; success: number; skipped: number; failed: number; errors: { row: number; message: string }[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: payungs = [], isLoading: payungLoading, error: payungError, refetch: refetchPayungs } = useQuery({
        queryKey: ["admin-target-payungs"],
        queryFn: () => targetSchoolService.listTargetSchools({ include_inactive: true }),
    });

    const safePayungs = unwrapPayungs(payungs);

    const { data: scores = [], isLoading, error, refetch } = useQuery({
        queryKey: ["admin-target-scores", year ?? ""],
        queryFn: () => targetSchoolService.listScores({ academic_year: year || undefined }),
    });

    const safeScores = unwrapScores(scores);
    const rows = useMemo(() => buildRows(safeScores, safePayungs), [safeScores, safePayungs]);

    const years = useMemo(() => {
        const set = new Set<string>();
        for (const s of safeScores) if (s.academic_year) set.add(s.academic_year);
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [safeScores]);

    const levelRows = level ? rows.filter((r) => r.level === level) : rows;

    const addTarget = safePayungs.find((p) => p.id === addToPayungId);
    const addTargetLevel = addTarget?.level ?? (level || "");

    const deleteMutation = useMutation({
        mutationFn: targetSchoolService.deleteScore,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-target-scores"] });
            qc.invalidateQueries({ queryKey: ["admin-target-payungs"] });
            setDeleteTarget(null);
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: targetSchoolService.bulkDeleteScores,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-target-scores"] });
            qc.invalidateQueries({ queryKey: ["admin-target-payungs"] });
            setSelectedIds(new Set());
        },
    });

    const handleExport = async () => {
        try {
            await targetSchoolService.exportScores(selectedIds.size > 0 ? Array.from(selectedIds) : undefined);
        } catch (err) {
            // surface via alert untuk kesederhanaan konsisten dengan flow import
            window.alert(err instanceof Error ? err.message : "Gagal mengekspor");
        }
    };

    const handleImportFile = async (file: File) => {
        setImporting(true);
        setImportResult(null);
        try {
            const res = await targetSchoolService.importScores(file);
            setImportResult({
                total: res.created + res.skipped + res.failed,
                success: res.created,
                skipped: res.skipped,
                failed: res.failed,
                errors: res.errors,
            });
            qc.invalidateQueries({ queryKey: ["admin-target-scores"] });
            qc.invalidateQueries({ queryKey: ["admin-target-payungs"] });
        } catch (err) {
            setImportResult({
                total: 0,
                success: 0,
                skipped: 0,
                failed: 1,
                errors: [{ row: 0, message: err instanceof Error ? err.message : "Gagal mengimpor" }],
            });
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleEdit = (row: TargetScoreRow) => {
        const score = safeScores.find((s) => s.id === row.id);
        if (score) {
            setEditingScore(score);
            setFormOpen(true);
        }
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingScore(null);
    };

    const handleAddScore = () => {
        setEditingScore(null);
        setAddToPayungId(safePayungs[0]?.id ?? "");
        setFormOpen(true);
    };

    const handleYearChange = (value: string | null) => {
        const v = value ?? null;
        setYear(v === ALL ? undefined : v ?? undefined);
    };

    const handleLevelChange = (value: string | null) => {
        const v = value ?? null;
        setLevel(v === ALL ? undefined : v ?? undefined);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">Nilai Target per Tahun</h3>
                    <p className="text-sm text-muted-foreground">
                        Nilai penerimaan min/max per (sekolah × tahun ajaran) sebagai acuan siswa.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant={trendMode ? "default" : "outline"} size="sm" className="rounded-xl gap-2" onClick={() => setTrendMode((v) => !v)}>
                        <LineChartIcon className="h-4 w-4" /> {trendMode ? "Mode Tabel" : "Mode Tren"}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" /> Export XLSX
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                        <Upload className="h-4 w-4" /> {importing ? "Mengimpor..." : "Import XLSX"}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImportFile(f);
                        }}
                    />
                    <Button onClick={handleAddScore} className="rounded-xl gap-2 font-semibold shadow-xs">
                        <Plus className="h-4 w-4" /> + Baris Nilai
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Select value={year ?? ALL} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Semua Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Semua Tahun</SelectItem>
                        {years.map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={level ?? ALL} onValueChange={handleLevelChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Semua Jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Semua Jenjang</SelectItem>
                        {LEVEL_OPTIONS.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {importResult && (
                <ImportResultCard
                    result={importResult}
                    onClose={() => setImportResult(null)}
                />
            )}

            {(error || payungError) && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error instanceof Error ? error.message : payungError instanceof Error ? payungError.message : "Gagal memuat data nilai"}</span>
                    <Button variant="ghost" size="sm" onClick={() => { refetch(); refetchPayungs(); }} className="ml-auto rounded-lg">
                        Coba lagi
                    </Button>
                </div>
            )}

            {trendMode ? (
                <TargetScoreTrendPanel payungs={safePayungs} />
            ) : (
                <>
                    {selectedIds.size > 0 && (
                        <BulkActionBar
                            count={selectedIds.size}
                            actions={[
                                {
                                    label: "Hapus",
                                    variant: "destructive",
                                    confirm: `Hapus ${selectedIds.size} baris nilai terpilih?`,
                                    onClick: () => bulkDeleteMutation.mutate(Array.from(selectedIds)),
                                },
                            ]}
                            onClear={() => setSelectedIds(new Set())}
                        />
                    )}

                    {isLoading || payungLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : levelRows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <LineChartIcon className="h-5 w-5" />
                            </div>
                            <p className="font-semibold text-foreground">Belum ada data nilai target</p>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Tambahkan nilai penerimaan per (sekolah × tahun ajaran) untuk acuan siswa.
                            </p>
                            <Button onClick={handleAddScore} className="rounded-xl gap-2 font-semibold shadow-xs mt-1">
                                <Plus className="h-4 w-4" /> + Baris Nilai
                            </Button>
                        </div>
                    ) : (
                        <TargetScoreTable
                            rows={levelRows}
                            onEdit={handleEdit}
                            onDelete={(r) => setDeleteTarget(r)}
                            selectable
                            selectedRowIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                        />
                    )}
                </>
            )}

            <TargetScoreFormDialog
                open={formOpen}
                onOpenChange={(o) => !o && handleFormClose()}
                payungId={addToPayungId || editingScore?.target_school_id}
                payungName={editingScore ? safePayungs.find((p) => p.id === editingScore.target_school_id)?.name : addTarget?.name}
                level={addTargetLevel}
                maxDefault={defaultMaxTotal(addTargetLevel)}
                initial={editingScore}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Hapus baris nilai?"
                description={`Nilai ${deleteTarget?.school_name ?? ""} tahun ${deleteTarget?.academic_year ?? ""} akan dihapus.`}
                confirmLabel="Hapus"
                variant="destructive"
                loading={deleteMutation.isPending}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            />
        </div>
    );
}
