"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MoreHorizontal, Pencil, ChevronRight, BookOpen } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Grade } from "@/types/academic-master";

export function GradeTable({
  grades,
  onSelect,
  onEdit,
  selectedGrade
}: {
  grades: (Grade & { alias: string | null | undefined })[];
  onSelect: (gradeId: string) => void;
  onEdit: (grade: any) => void;
  selectedGrade: string | null;
}) {
  const columns: Column<Grade & { alias: string | null | undefined }>[] = [
    {
      header: "Kelas",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl border bg-primary/10 text-primary border-primary/20">
            <GraduationCap className="h-4 w-4" />
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
          <button
            onClick={() => onSelect(row.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Lihat Mapel
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
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

  return <DataTable columns={columns} data={grades} searchPlaceholder="Cari kelas..." />;
}