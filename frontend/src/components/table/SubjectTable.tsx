"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MoreHorizontal, Pencil, ChevronRight, Layers } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Subject } from "@/types/academic-master";

export function SubjectTable({
  subjects,
  onSelect,
  onEdit,
  selectedSubject
}: {
  subjects: (Subject & { grade_name?: string | null })[];
  onSelect: (subjectId: string) => void;
  onEdit: (subject: any) => void;
  selectedSubject?: string | null;
}) {
  const columns: Column<Subject & { grade_name?: string | null }>[] = [
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
        <Badge variant={row.is_active !== false ? "success" : "outline"}>
          {row.is_active !== false ? "Aktif" : "Non-aktif"}
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
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            Lihat Bab &amp; Topik
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
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

  return <DataTable columns={columns} data={subjects} searchPlaceholder="Cari mata pelajaran (misal: Matematika, Fisika)..." />;
}