// src/app/(admin)/admin/schools/schools-tab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { SchoolTable } from "@/components/admin/schools/SchoolTable";
import { SchoolFormDialog } from "@/components/admin/schools/SchoolFormDialog";
import { schoolService, School, SchoolPayload } from "@/services/school.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertCircle } from "lucide-react";

function unwrapSchools(data: School[] | { items?: School[] } | null | undefined): School[] {
    if (Array.isArray(data)) return data;
    return data?.items ?? [];
}

export function SchoolsTab() {
    const qc = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<School | null>(null);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);

    const { data: schools = [], isLoading, error, refetch } = useQuery({
        queryKey: ["admin-schools"],
        queryFn: () => schoolService.listSchools(),
    });

    const createMutation = useMutation({
        mutationFn: schoolService.createSchool,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-schools"] });
            qc.invalidateQueries({ queryKey: ["admin-schools-catalog"] });
            setFormOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: SchoolPayload }) => schoolService.updateSchool(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-schools"] });
            setEditingSchool(null);
            setFormOpen(false);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => schoolService.toggleStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-schools"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: schoolService.deleteSchool,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-schools"] });
            setDeleteTarget(null);
        },
    });

    const handleEdit = (school: School) => {
        setEditingSchool(school);
        setFormOpen(true);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingSchool(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Daftar Sekolah &amp; PT</h3>
                    <p className="text-sm text-muted-foreground">
                        Kelola daftar sekolah/PT katalog yang menjadi acuan siswa.
                    </p>
                </div>
                <Button onClick={() => setFormOpen(true)} className="rounded-xl gap-2 font-semibold shadow-xs">
                    <Plus className="h-4 w-4" /> Daftarkan Sekolah Baru
                </Button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error instanceof Error ? error.message : "Gagal memuat sekolah"}</span>
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
                <SchoolTable
                    schools={unwrapSchools(schools)}
                    onToggleStatus={(s) =>
                        toggleMutation.mutate({
                            id: s.id,
                            status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        })
                    }
                    onDelete={(s) => setDeleteTarget(s)}
                    onEdit={handleEdit}
                />
            )}

            <SchoolFormDialog
                open={formOpen}
                loading={createMutation.isPending || updateMutation.isPending}
                onClose={handleFormClose}
                onSubmit={(v) => {
                    if (editingSchool) {
                        updateMutation.mutate({ id: editingSchool.id, payload: v });
                    } else {
                        createMutation.mutate(v);
                    }
                }}
                school={editingSchool}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Hapus data sekolah?"
                description={`${deleteTarget?.name} akan dihapus permanen. Siswa terafiliasi akan kehilangan lisensi.`}
                confirmLabel="Hapus"
                variant="destructive"
                loading={deleteMutation.isPending}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            />
        </div>
    );
}