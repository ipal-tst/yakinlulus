// src/components/table/LevelTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, MoreHorizontal, Power, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LevelTableProps {
  levels: {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
    display_order: number;
  }[];
  onToggleStatus: (level: { id: string }) => void;
  onDelete: (level: { id: string }) => void;
}

export function LevelTable({ levels, onToggleStatus, onDelete }: LevelTableProps) {
  const columns: Column<{ id: string }>[] = [
    {
      header: "Jenjang",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <GraduationCap className="h-3.5 w-3.5" /> {row.name}
        </div>
      ),
    },
    {
      header: "Kode",
      accessorKey: "code",
      cell: (row) => <span>{row.code || "-"}</span>,
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
            <DropdownMenuItem onClick={() => onToggleStatus(row)} className="gap-2">
              <Power className="h-4 w-4" />
              {row.is_active ? "Nonaktifkan" : "Aktifkan"}
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

  return <DataTable columns={columns} data={levels} searchPlaceholder="Cari jenjang" />;
}