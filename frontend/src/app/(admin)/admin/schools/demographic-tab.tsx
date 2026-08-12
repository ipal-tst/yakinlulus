// src/app/(admin)/admin/schools/demographic-tab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Column, DataTable } from "@/components/data-display/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { DemographicFormDialog } from "@/components/admin/schools/demographic-form-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { School, SchoolDemographic, schoolService } from "@/services/school.service";
import { Plus, Users, AlertCircle } from "lucide-react";

interface DemographicTabProps {
    schools: School[];
    schoolsLoading?: boolean;
}

export function DemographicTab({ schools = [] }: DemographicTabProps) {
    const qc = useQueryClient();
    const [schoolId, setSchoolId] = useState<string>(schools[0]?.id ?? "");
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<SchoolDemographic | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SchoolDemographic | null>(null);

    const selectedSchool = schools.find((s) => s.id === schoolId);

    const { data = [], isLoading, error, refetch } = useQuery({
        queryKey: ["admin-school-demographics", schoolId],
        queryFn: () => schoolService.listDemographics({ school_id: schoolId || undefined }),
        enabled: Boolean(schoolId),
    });

    const deleteMutation = useMutation({
        mutationFn: schoolService.deleteDemographic,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-school-demographics", schoolId] });
            setDeleteTarget(null);
        },
    });

    const columns: Column<SchoolDemographic>[] = [
        {
            header: "Tahun Ajaran",
            accessorKey: "academic_year",
            cell: (row) => <span className="font-semibold text-foreground">{row.academic_year}</span>,
        },
        {
            header: "Total Siswa",
            accessorKey: "total_students",
            cell: (row) => (
                <span className="inline-flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    {row.total_students?.toLocaleString("id-ID") ?? 0}
                </span>
            ),
        },
        { header: "Total Rombel", accessorKey: "total_rombel", cell: (row) => <span className="text-sm">{row.total_rombel ?? 0}</span> },
        {
            header: "Rincian",
            accessorKey: "grade_breakdown",
            cell: (row) => {
                const entries = Object.entries(row.grade_breakdown ?? {});
                if (entries.length === 0) return <span className="text-muted-foreground">-</span>;
                return (
                    <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                        {entries.slice(0, 3).map(([grade, count]) => (
                            <span key={grade} className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                {grade}: {count}
                            </span>
                        ))}
                        {entries.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{entries.length - 3} lainnya</span>
                        )}
                    </div>
                );
            },
        },
        {
            header: "Aksi",
            accessorKey: "id",
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg px-3" onClick={() => { setEditing(row); setFormOpen(true); }}>
                        Edit
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="h-8 rounded-lg px-3 text-destructive" onClick={() => setDeleteTarget(row)}>
                        Hapus
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1.5 w-full sm:max-w-sm">
                    <label className="text-xs font-semibold text-foreground">Sekolah / PT</label>
                    <Select value={schoolId} onValueChange={(v: string | null) => { setSchoolId(v ?? ""); setEditing(null); }}>
                        <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder="Pilih sekolah" />
                        </SelectTrigger>
                        <SelectContent>
                            {schools.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.school_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={() => { setEditing(null); setFormOpen(true); }}
                    className="rounded-xl gap-2 font-semibold shadow-xs"
                    disabled={!schoolId}
                >
                    <Plus className="h-4 w-4" /> Tambah Data
                </Button>
            </div>

            {selectedSchool && (
                <p className="text-xs text-muted-foreground">
                    Data siswa & rombel per tahun ajaran untuk <span className="font-semibold text-foreground">{selectedSchool.school_name}</span>.
                </p>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error instanceof Error ? error.message : "Gagal memuat data demografi"}</span>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                        Coba lagi
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={data}
                    searchPlaceholder="Cari tahun ajaran..."
                    enableExport={false}
                />
            )}

            {!isLoading && data.length === 0 && (
                <EmptyState
                    icon={Users}
                    title="Belum ada data siswa"
                    description="Tambahkan data jumlah siswa, rombel, dan rincian per jenjang untuk tiap tahun ajaran."
                    actionLabel="Tambah Data"
                    onAction={() => { setEditing(null); setFormOpen(true); }}
                />
            )}

            <DemographicFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                schoolId={schoolId}
                initial={editing}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Hapus data siswa?"
                description={`Data demografi tahun ${deleteTarget?.academic_year ?? ""} akan dihapus.`}
                confirmLabel="Hapus"
                variant="destructive"
                loading={deleteMutation.isPending}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            />
        </div>
    );
}
