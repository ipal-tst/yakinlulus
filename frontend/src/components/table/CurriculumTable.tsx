// src/components/table/CurriculumTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Curriculum } from "@/types/academic-master";

interface CurriculumTableProps {
  curriculums: Curriculum[];
  onEdit: (curriculum: Curriculum) => void;
  onDelete: (curriculum: { id: string }) => void;
}

export function CurriculumTable({ curriculums, onEdit, onDelete }: CurriculumTableProps) {
  const columns: Column<Curriculum>[] = [
    {
      header: "Kurikulum",
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
      header: "Deskripsi",
      accessorKey: "description",
      cell: (row) => <span className="text-muted-foreground">{row.description || "-"}</span>,
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
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row)} className="text-destructive focus:text-destructive gap-2">
              <Trash2 className="h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={curriculums} searchPlaceholder="Cari kurikulum..." />;
}
