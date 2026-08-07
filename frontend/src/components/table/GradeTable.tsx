"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface GradeTableProps {
  grades: { id: string; name: string; level_code: string; alias: string | null; is_active: boolean; display_order: number }[];
  onSelect: (gradeId: string) => void;
  selectedGrade: string | null;
}

export function GradeTable({ grades, onSelect, selectedGrade }: GradeTableProps) {
  const columns: Column<{ id: string }>[] = [
    {
      header: "Kelas",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Kode",
      accessorKey: "level_code",
      cell: (row) => <span>{row.level_code || "-"}</span>,
    },
    {
      header: "Alias",
      accessorKey: "alias",
      cell: (row) => <span>{row.alias || "-"}</span>,
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
              <GraduationCap className="h-4 w-4" />
              Lihat Mata Pelajaran
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={grades} searchPlaceholder="Cari kelas..." />;
}