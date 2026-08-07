"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MoreHorizontal, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Subject } from "@/types/academic-master";

export function SubjectTable({ subjects, onSelect, onEdit, selectedSubject }: { subjects: (Subject & { grade_name: string | null })[]; onSelect: (subjectId: string) => void; onEdit: (subject: any) => void; selectedSubject: string | null }) {
  const columns: Column<Subject & { grade_name: string | null }>[] = [
    {
      header: "Mata Pelajaran",
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
      header: "Jenjang",
      accessorKey: "level_name",
      cell: (row) => <span>{row.level_name}</span>,
    },
    {
      header: "Kelas",
      accessorKey: "grade_name",
      cell: (row) => <span>{row.grade_name || "-"}</span>,
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
      header: "Urutan",
      accessorKey: "display_order",
      cell: (row) => <span>{row.display_order}</span>,
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
            <DropdownMenuItem onSelect={() => onSelect(row.id)} className="gap-2">
              <BookOpen className="h-4 w-4" />
              Lihat Bab
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(row)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={subjects} searchPlaceholder="Cari mata pelajaran..." />;
}