// src/app/(admin)/admin/schools/target-schools-tab.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { TargetSchoolTable } from "@/components/admin/schools/target-school-table";
import { TargetSchoolFormDialog } from "@/components/admin/schools/target-school-form-dialog";
import { targetSchoolService, TargetSchool, TargetSchoolPayload } from "@/services/target-school.service";
import { schoolService } from "@/services/school.service";
import { sortedProvinces } from "@/lib/target-school-mappers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle, Target } from "lucide-react";

const LEVEL_OPTIONS = ["SMP", "SMA", "UNIVERSITY"];
const ALL = "all";

export function TargetSchoolsTab() {
    const qc = useQueryClient();
    const [level, setLevel] = useState<string | undefined>();
    const [province, setProvince] = useState<string | undefined>();
    const [formOpen, setFormOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState<TargetSchool | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TargetSchool | null>(null);

    const { data: schools = [], isLoading, error, refetch } = useQuery({
        queryKey: ["admin-target-schools", level, province, ""],
        queryFn: () => targetSchoolService.listTargetSchools({ level, province, q: "" }),
    });

    const { data: catalogSchools = [] } = useQuery({
        queryKey: ["admin-schools-catalog"],
        queryFn: () => schoolService.listSchools({ limit: 500 }),
    });

    const provinces = useMemo(
        () => sortedProvinces(Array.isArray(catalogSchools) ? catalogSchools : []),
        [catalogSchools]
    );

    const createMutation = useMutation({
        mutationFn: targetSchoolService.createTargetSchool,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-target-schools"] });
            setFormOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: TargetSchoolPayload }) =>
            targetSchoolService.updateTargetSchool(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-target-schools"] });
            setEditingTarget(null);
            setFormOpen(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: targetSchoolService.deleteTargetSchool,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-target-schools"] });
            setDeleteTarget(null);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            targetSchoolService.updateTargetSchool(id, { is_active: isActive }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-target-schools"] }),
    });

    const handleEdit = (s: TargetSchool) => {
        setEditingTarget(s);
        setFormOpen(true);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingTarget(null);
    };

    const handleLevelChange = (value: string | null) => {
        const v = value ?? null;
        setLevel(v === ALL ? undefined : v ?? undefined);
    };

    const handleProvinceChange = (value: string | null) => {
        const v = value ?? null;
        setProvince(v === ALL ? undefined : v ?? undefined);
    };

    const empty = Array.isArray(schools) && schools.length === 0;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">Target Sekolah &amp; Kampus PT</h3>
                    <p className="text-sm text-muted-foreground">
                        Kelola target sekolah/PT sebagai acuan nilai siswa.
                    </p>
                </div>
                <Button onClick={() => setFormOpen(true)} className="rounded-xl gap-2 font-semibold shadow-xs">
                    <Plus className="h-4 w-4" /> Tambah Target Sekolah
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
                <Select value={province ?? ALL} onValueChange={handleProvinceChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Semua Provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Semua Provinsi</SelectItem>
                        {provinces.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error instanceof Error ? error.message : "Gagal memuat target sekolah"}</span>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                        Coba lagi
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                </div>
            ) : empty ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Target className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-foreground">Belum ada target sekolah</p>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Tambahkan target sekolah/PT beserta rentang nilai untuk acuan siswa.
                    </p>
                    <Button onClick={() => setFormOpen(true)} className="rounded-xl gap-2 font-semibold shadow-xs mt-1">
                        <Plus className="h-4 w-4" /> Tambah Target Sekolah
                    </Button>
                </div>
            ) : (
                <TargetSchoolTable
                    schools={schools}
                    onEdit={handleEdit}
                    onDelete={(s) => setDeleteTarget(s)}
                    onToggle={(s) =>
                        toggleMutation.mutate({ id: s.id, isActive: !s.is_active })
                    }
                />
            )}

            <TargetSchoolFormDialog
                open={formOpen}
                onOpenChange={(o) => !o && handleFormClose()}
                initial={editingTarget}
                level={level}
                loading={createMutation.isPending || updateMutation.isPending}
                onSubmit={(payload) => {
                    if (editingTarget) {
                        updateMutation.mutate({ id: editingTarget.id, payload });
                    } else {
                        createMutation.mutate(payload);
                    }
                }}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Hapus target sekolah?"
                description={`${deleteTarget?.name} akan dihapus permanen.`}
                confirmLabel="Hapus"
                variant="destructive"
                loading={deleteMutation.isPending}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            />
        </div>
    );
}