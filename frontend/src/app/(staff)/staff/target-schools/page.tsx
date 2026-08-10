// src/app/(staff)/staff/target-schools/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { TargetSchoolTable } from "@/components/admin/schools/target-school-table";
import { TargetSchoolFormDialog } from "@/components/admin/target-schools/TargetSchoolFormDialog";
import { targetSchoolService, TargetSchool } from "@/services/target-school.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertCircle } from "lucide-react";

export default function TargetSchoolsPage() {
    const qc = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<TargetSchool | null>(null);

    const { data: schools = [], isLoading, error, refetch } = useQuery({
        queryKey: ["admin-target-schools"],
        queryFn: () => targetSchoolService.listTargetSchools(),
    });

    const createMutation = useMutation({
        mutationFn: targetSchoolService.createTargetSchool,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-target-schools"] });
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

    return (

            <div className="space-y-6">
                <PageHeader
                    title="Target Sekolah & Kampus PTN"
                    description="Kelola daftar target kampus, jurusan, dan standar passing grade ujian."
                    actions={
                        <Button onClick={() => setFormOpen(true)} className="rounded-xl gap-2 font-semibold shadow-xs">
                            <Plus className="h-4 w-4" /> Tambah Target PTN
                        </Button>
                    }
                />

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
                ) : (
                    <TargetSchoolTable
                        schools={schools}
                        onDelete={(s) => setDeleteTarget(s)}
                    />
                )}

                <TargetSchoolFormDialog
                    open={formOpen}
                    loading={createMutation.isPending}
                    onClose={() => setFormOpen(false)}
                    onSubmit={(v) => createMutation.mutate(v)}
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