"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Pencil, AlertCircle, Download, Plus } from "lucide-react";
import { Column, DataTable } from "@/components/data-display/data-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { academicMasterService } from "@/services/academic-master.service";
import { BulkActionBar } from "@/components/admin/academic/bulk-action-bar";
import { downloadBlob } from "@/components/admin/academic/academic-excel";
import type { Program } from "@/types/academic-master";

interface ProgramsTabProps {
  onEdit: (program: Program) => void;
  onAdd: () => void;
  filterStatus?: "all" | "active" | "inactive";
}

export function ProgramsTab({ onEdit, onAdd, filterStatus = "all" }: ProgramsTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading, error, refetch } = useQuery({
    queryKey: ["academic-programs", filterStatus],
    queryFn: () => academicMasterService.getPrograms(filterStatus),
  });

  const columns: Column<Program>[] = [
    {
      header: "Program",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Kode",
      accessorKey: "code",
      cell: (row) => <span>{row.code || "-"}</span>,
    },
    {
      header: "Jenjang Pendidikan",
      accessorKey: "education_level",
      cell: (row) => <span>{row.education_level || "-"}</span>,
    },
    {
      header: "Deskripsi",
      accessorKey: "description",
      cell: (row) => <span className="text-muted-foreground">{row.description || "-"}</span>,
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (row) => (
        <Switch
          checked={row.is_active}
          onCheckedChange={async (checked) => {
            try {
              await academicMasterService.updateProgram(row.id, { is_active: checked });
              queryClient.invalidateQueries({ queryKey: ["academic-programs"] });
            } catch (err) {
              console.error("Failed to toggle program status", err);
            }
          }}
        />
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
              Edit Program
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
      await academicMasterService.bulkDelete("program", Array.from(selectedIds));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-programs"] });
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
      await academicMasterService.bulkStatus("program", Array.from(selectedIds), true);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-programs"] });
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
      await academicMasterService.bulkStatus("program", Array.from(selectedIds), false);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["academic-programs"] });
    } catch (err) {
      console.error("Bulk deactivate failed", err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await academicMasterService.exportXlsx("program");
      downloadBlob(blob, `program-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const blob = await academicMasterService.exportXlsx("program", Array.from(selectedIds));
      downloadBlob(blob, `program-terpilih-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Export selected failed", err);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Terjadi kendala saat memuat data program dari server.</span>
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
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-lg font-bold text-foreground">Program Belajar</h3>
              <p className="text-sm text-muted-foreground">Kelola program belajar berdasarkan jenjang.</p>
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
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExport} disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={onAdd} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Program
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => window.location.href = "/admin/academic/import/template?kind=program"}
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh Templat
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={programs}
          searchPlaceholder="Cari program..."
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