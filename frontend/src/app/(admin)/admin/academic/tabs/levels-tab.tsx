"use client";

import { Skeleton } from "@/components/ui/skeleton";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Pencil, AlertCircle, Download, Plus } from "lucide-react";
import { Column, DataTable } from "@/components/data-display/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { academicMasterService } from "@/services/academic-master.service";
import { BulkActionBar } from "@/components/admin/academic/bulk-action-bar";
import { downloadBlob } from "@/components/admin/academic/academic-excel";
import type { EducationLevel } from "@/types/academic-master";

const getLevelBadgeStyle = (code: string) => {
  const c = (code || "").toUpperCase();
  if (c.includes("SD")) return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  if (c.includes("SMP")) return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800";
  if (c.includes("SMA")) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (c.includes("SMK")) return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
};

interface LevelsTabProps {
  onEdit: (level: EducationLevel) => void;
  onAdd: () => void;
}

export function LevelsTab({ onEdit, onAdd }: LevelsTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const queryClient = useQueryClient();

  const { data: levels = [], isLoading, error, refetch } = useQuery({
    queryKey: ["academic-levels"],
    queryFn: academicMasterService.getLevels,
  });

  const columns: Column<EducationLevel>[] = [
    {
      header: "Jenjang",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${getLevelBadgeStyle(row.code)}`}>
            <GraduationCap className="h-4 w-4" />
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
        <Badge variant="outline" className={`font-mono text-xs ${getLevelBadgeStyle(row.code)}`}>
          {row.code || "-"}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (row) => (
        <Badge variant={row.is_active !== false ? "success" : "outline"}>
          {row.is_active !== false ? "Aktif" : "Non-aktif"}
        </Badge>
      ),
    },
    {
      header: "Aksi",
      accessorKey: "id",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Pencil className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => onEdit(row)} className="gap-2 text-xs">
              <Pencil className="h-3.5 w-3.5" />
              Edit Detail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBusy(true);
    try {
      await academicMasterService.bulkDelete("level", Array.from(selectedIds));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-levels"] });
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
      await academicMasterService.bulkStatus("level", Array.from(selectedIds), true);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-levels"] });
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
      await academicMasterService.bulkStatus("level", Array.from(selectedIds), false);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-levels"] });
    } catch (error) {
      console.error("Bulk deactivate failed", error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await academicMasterService.exportXlsx("level");
      downloadBlob(blob, `jenjang-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const blob = await academicMasterService.exportXlsx("level", Array.from(selectedIds));
      downloadBlob(blob, `jenjang-terpilih-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Export selected failed", error);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Terjadi kendala saat memuat data jenjang dari server.</span>
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
          <div>
            <h3 className="text-lg font-bold text-foreground">Jenjang Pendidikan</h3>
            <p className="text-sm text-muted-foreground">Kelola jenjang pendidikan SD, SMP, SMA, dll.</p>
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
              Tambah Jenjang
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => window.location.href = "/admin/academic/import/template?kind=level"}
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh Templat
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={levels}
          searchPlaceholder="Cari jenjang pendidikan..."
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