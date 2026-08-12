"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, AlertCircle, Download, Plus } from "lucide-react";
import { Column, DataTable } from "@/components/data-display/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { academicMasterService } from "@/services/academic-master.service";
import { BulkActionBar } from "@/components/admin/academic/bulk-action-bar";
import { downloadBlob } from "@/components/admin/academic/academic-excel";
import type { Subject } from "@/types/academic-master";

interface SubjectsTabProps {
  onEdit: (subject: Subject) => void;
  onAdd: () => void;
  onSelect?: (subjectId: string) => void;
  filterStatus?: "all" | "active" | "inactive";
}

export function SubjectsTab({ onEdit, onAdd, onSelect, filterStatus = "all" }: SubjectsTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const queryClient = useQueryClient();

  const { data: subjects = [], isLoading, error, refetch } = useQuery({
    queryKey: ["academic-all-subjects", filterStatus],
    queryFn: () => academicMasterService.getSubjects(undefined, undefined, filterStatus),
  });

  const columns: Column<Subject>[] = [
    {
      header: "Mata Pelajaran",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-sm block">{row.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono">{row.code || "-"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Kode",
      accessorKey: "code",
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.code || "-"}
        </Badge>
      ),
    },
    {
      header: "Jenjang",
      accessorKey: "level_name",
      cell: (row) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {row.level_name || "-"}
        </Badge>
      ),
    },
    {
      header: "Kelas",
      accessorKey: "grade_name",
      cell: (row) => <span className="text-xs font-medium">{row.grade_name || "-"}</span>,
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (row) => (
        <Badge variant={row.is_active ? "success" : "outline"}>
          {row.is_active ? "Aktif" : "Non-aktif"}
        </Badge>
      ),
    },
    {
      header: "Aksi",
      accessorKey: "id",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {onSelect && (
            <button
              onClick={() => onSelect(row.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              Lihat Bab & Topik
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <Pencil className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => onEdit(row)} className="gap-2 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                Edit Detail Mapel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBusy(true);
    try {
      await academicMasterService.bulkDelete("subject", Array.from(selectedIds));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-all-subjects"] });
    } catch (error) {
      console.error("Bulk delete failed", error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBusy(true);
    try {
      await academicMasterService.bulkStatus("subject", Array.from(selectedIds), true);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-all-subjects"] });
    } catch (error) {
      console.error("Bulk activate failed", error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBusy(true);
    try {
      await academicMasterService.bulkStatus("subject", Array.from(selectedIds), false);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-all-subjects"] });
    } catch (error) {
      console.error("Bulk deactivate failed", error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await academicMasterService.exportXlsx("subject");
      downloadBlob(blob, `mata-pelajaran-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const blob = await academicMasterService.exportXlsx("subject", Array.from(selectedIds));
      downloadBlob(blob, `mata-pelajaran-terpilih-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Export selected failed", error);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Terjadi kendala saat memuat data mata pelajaran dari server.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="ml-auto rounded-lg"
          >
            Coba Lagi
          </Button>
        </div>
        <div className="flex justify-center items-center h-32 text-muted-foreground">
          <Button onClick={() => refetch()}>Muat Ulang Data</Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-lg font-bold text-foreground">Mata Pelajaran</h3>
              <p className="text-sm text-muted-foreground">Kelola mata pelajaran berdasarkan jenjang dan kelas.</p>
            </div>
            <div className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
            <select
              value={filterStatus}
              onChange={(e) => refetch()}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-aktif</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={onAdd}
              className="rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Mata Pelajaran
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => window.location.href = "/admin/academic/import/template?kind=subject"}
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh Templat
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={subjects}
          searchPlaceholder="Cari mata pelajaran (misal: Matematika, Fisika)..."
          selectable
          selectedRowIds={selectedIds}
          onSelectionChange={setSelectedIds}
          getRowId={(row) => row.id}
        />

        {selectedIds.size > 0 && (
          <BulkActionBar
            count={selectedIds.size}
            onDelete={handleBulkDelete}
            onActivate={handleBulkActivate}
            onDeactivate={handleBulkDeactivate}
            onExport={handleExportSelected}
            busy={isBusy}
          />
        )}
      </div>
    );
  };

  return renderContent();
}