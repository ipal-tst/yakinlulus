"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SubjectTableProps {
  subjects: { id: string; name: string; code: string; level_name: string; grade_name: string | null; is_active: boolean; display_order: number }[];
  onSelect: (subjectId: string) => void;
  selectedSubject: string | null;
}

export function SubjectTable({ subjects, onSelect, selectedSubject }: SubjectTableProps) {
  const columns: Column<{ id: string }>[] = [
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
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={subjects} searchPlaceholder="Cari mata pelajaran..." />;
}