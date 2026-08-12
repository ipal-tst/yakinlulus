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
import type { Grade } from "@/types/academic-master";

interface GradesTabProps {
  onEdit: (grade: Grade) => void;
  onAdd: () => void;
  onSelect?: (gradeId: string) => void;
}

export function GradesTab({ onEdit, onAdd, onSelect }: GradesTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const queryClient = useQueryClient();

  const { data: levels = [] } = useQuery({
    queryKey: ["academic-levels"],
    queryFn: academicMasterService.getLevels,
  });

  const { data: grades = [], isLoading, error, refetch } = useQuery({
    queryKey: ["academic-all-grades", levels.map(l => l.id).join(",")],
    queryFn: async () => {
      if (levels.length === 0) return [];
      const allGrades = await Promise.all(
        levels.map(level => academicMasterService.getGrades(level.id))
      );
      return allGrades.flat();
    },
    enabled: levels.length > 0,
  });

  const columns: Column<Grade & { level_name?: string }>[] = [
    {
      header: "Kelas",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl border bg-primary/10 text-primary border-primary/20">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-sm block">{row.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono">{row.level_code || "-"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Kode Level",
      accessorKey: "level_code",
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.level_code || "-"}
        </Badge>
      ),
    },
    {
      header: "Alias",
      accessorKey: "alias",
      cell: (row) => <span className="text-xs font-medium">{row.alias || "-"}</span>,
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Lihat Mapel
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <Pencil className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => onEdit(row)} className="gap-2 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                Edit Detail Kelas
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
      await academicMasterService.bulkDelete("grade", Array.from(selectedIds));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-all-grades"] });
    } catch (err) {
      console.error("Bulk delete failed", err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBusy(true);
    try {
      await academicMasterService.bulkStatus("grade", Array.from(selectedIds), true);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-all-grades"] });
    } catch (err) {
      console.error("Bulk activate failed", err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBusy(true);
    try {
      await academicMasterService.bulkStatus("grade", Array.from(selectedIds), false);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-all-grades"] });
    } catch (err) {
      console.error("Bulk deactivate failed", err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await academicMasterService.exportXlsx("grade");
      downloadBlob(blob, `kelas-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const blob = await academicMasterService.exportXlsx("grade", Array.from(selectedIds));
      downloadBlob(blob, `kelas-terpilih-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Export selected failed", err);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Terjadi kendala saat memuat data kelas dari server.</span>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
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
          <div>
            <h3 className="text-lg font-bold text-foreground">Kelas</h3>
            <p className="text-sm text-muted-foreground">Kelola kelas untuk semua jenjang.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExport} disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={onAdd} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kelas
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => window.location.href = "/admin/academic/import/template?kind=grade"}
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh Templat
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={grades}
          searchPlaceholder="Cari kelas..."
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