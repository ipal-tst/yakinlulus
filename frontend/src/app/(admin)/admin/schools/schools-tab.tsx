// src/app/(admin)/admin/schools/schools-tab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { BulkActionBar } from "@/components/admin/shared/bulk-action-bar";
import { SchoolTable } from "@/components/admin/schools/SchoolTable";
import { SchoolFormDialog } from "@/components/admin/schools/SchoolFormDialog";
import { DemographicTab } from "./demographic-tab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { schoolService, School, SchoolPayload } from "@/services/school.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertCircle, Download } from "lucide-react";

function unwrapSchools(data: School[] | { items?: School[] } | null | undefined): School[] {
    if (Array.isArray(data)) return data;
    return data?.items ?? [];
}

export function SchoolsTab() {
    const qc = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<School | null>(null);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [typeFilter, setTypeFilter] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

    const { data: schools = [], isLoading, error, refetch } = useQuery({
        queryKey: ["admin-schools", typeFilter, levelFilter],
        queryFn: () => schoolService.listSchools({ type: typeFilter || undefined, level: levelFilter || undefined }),
    });

    const safeSchools = unwrapSchools(schools);

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
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-schools"] });
            setSelectedIds(new Set());
        },
    });

    const deleteMutation = useMutation({
        mutationFn: schoolService.deleteSchool,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-schools"] });
            setDeleteTarget(null);
            setSelectedIds(new Set());
            setBulkFeedback(null);
        },
        onError: (err) => {
            setDeleteTarget(null);
            setBulkFeedback(err instanceof Error ? err.message : "Gagal menghapus sekolah");
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: schoolService.bulkDelete,
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: ["admin-schools"] });
            setSelectedIds(new Set());
            if (result.failed > 0) {
                setBulkFeedback(`Gagal menghapus ${result.failed} dari ${result.processed} sekolah. ${result.errors?.join("; ") ?? ""}`);
            } else {
                setBulkFeedback(null);
            }
        },
        onError: (err) => {
            setBulkFeedback(err instanceof Error ? err.message : "Gagal menghapus sekolah");
        },
    });

    const bulkStatusMutation = useMutation({
        mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) => schoolService.bulkStatus(ids, active),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-schools"] });
            setSelectedIds(new Set());
        },
    });

    const handleExport = async () => {
        setExporting(true);
        setExportError("");
        try {
            await schoolService.exportXlsx(selectedIds.size > 0 ? Array.from(selectedIds) : undefined);
        } catch (err) {
            setExportError(err instanceof Error ? err.message : "Gagal mengekspor");
        } finally {
            setExporting(false);
        }
    };

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
            <Tabs defaultValue="identity" className="space-y-4">
                <TabsList className="rounded-xl">
                    <TabsTrigger value="identity" className="rounded-lg">Identitas Sekolah</TabsTrigger>
                    <TabsTrigger value="demographic" className="rounded-lg">Siswa &amp; Akademik</TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold">Daftar Sekolah &amp; PT</h3>
                            <p className="text-sm text-muted-foreground">
                                Kelola daftar sekolah/PT katalog yang menjadi acuan siswa.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={typeFilter} onValueChange={(v: string | null) => setTypeFilter(v ?? "")}>
                                <SelectTrigger className="h-10 w-fit min-w-[140px]">
                                    <SelectValue placeholder="Bentuk: Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua</SelectItem>
                                    <SelectItem value="SEKOLAH">Sekolah</SelectItem>
                                    <SelectItem value="PT">Perguruan Tinggi</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={levelFilter} onValueChange={(v: string | null) => setLevelFilter(v ?? "")}>
                                <SelectTrigger className="h-10 w-fit min-w-[140px]">
                                    <SelectValue placeholder="Jenjang: Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua</SelectItem>
                                    <SelectItem value="SD">SD</SelectItem>
                                    <SelectItem value="SMP">SMP</SelectItem>
                                    <SelectItem value="SMA">SMA</SelectItem>
                                    <SelectItem value="SMK">SMK</SelectItem>
                                    <SelectItem value="UNIVERSITY">UNIVERSITY</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExport} disabled={exporting}>
                                <Download className="h-4 w-4" /> {exporting ? "Mengekspor..." : "Export XLSX"}
                            </Button>
                            <Button onClick={() => setFormOpen(true)} className="rounded-xl gap-2 font-semibold shadow-xs">
                                <Plus className="h-4 w-4" /> Daftarkan Sekolah Baru
                            </Button>
                        </div>
                    </div>

                    {exportError && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{exportError}</span>
                        </div>
                    )}

                    {bulkFeedback && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{bulkFeedback}</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error instanceof Error ? error.message : "Gagal memuat sekolah"}</span>
                            <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                                Coba lagi
                            </Button>
                        </div>
                    )}

                    {selectedIds.size > 0 && (
                        <BulkActionBar
                            count={selectedIds.size}
                            actions={[
                                {
                                    label: "Aktifkan",
                                    variant: "default",
                                    onClick: () => bulkStatusMutation.mutate({ ids: Array.from(selectedIds), active: true }),
                                },
                                {
                                    label: "Nonaktifkan",
                                    variant: "outline",
                                    onClick: () => bulkStatusMutation.mutate({ ids: Array.from(selectedIds), active: false }),
                                },
                                {
                                    label: "Hapus",
                                    variant: "destructive",
                                    confirm: `Hapus ${selectedIds.size} sekolah terpilih beserta seluruh datanya?`,
                                    onClick: () => bulkDeleteMutation.mutate(Array.from(selectedIds)),
                                },
                            ]}
                            onClear={() => setSelectedIds(new Set())}
                        />
                    )}

                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <SchoolTable
                            schools={safeSchools}
                            onToggleStatus={(s) =>
                                toggleMutation.mutate({
                                    id: s.id,
                                    status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                                })
                            }
                            onDelete={(s) => setDeleteTarget(s)}
                            onEdit={handleEdit}
                            selectable
                            selectedRowIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                        />
                    )}
                </TabsContent>

                <TabsContent value="demographic">
                    <DemographicTab schools={safeSchools} schoolsLoading={isLoading} />
                </TabsContent>
            </Tabs>

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
                description={`${deleteTarget?.school_name ?? ""} akan dihapus permanen beserta seluruh datanya: target sekolah & nilai penerimaan, demografi, relasi siswa & kelas. Tindakan ini tidak dapat dibatalkan.`}
                confirmLabel="Hapus"
                variant="destructive"
                loading={deleteMutation.isPending}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            />
        </div>
    );
}
