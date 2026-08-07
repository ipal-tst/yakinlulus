// src/components/table/LevelTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MoreHorizontal, Pencil, ChevronRight } from "lucide-react";
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
    is_active?: boolean;
    display_order?: number;
  }[];
  onSelect?: (levelId: string) => void;
  onEdit: (level: any) => void;
  onToggleStatus?: (level: { id: string }) => void;
  onDelete?: (level: { id: string }) => void;
}

const getLevelBadgeStyle = (code: string) => {
  const c = (code || "").toUpperCase();
  if (c.includes("SD")) return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  if (c.includes("SMP")) return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800";
  if (c.includes("SMA")) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (c.includes("SMK")) return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
};

export function LevelTable({ levels, onSelect, onEdit }: LevelTableProps) {
  const columns: Column<{ id: string; name: string; code: string; is_active?: boolean; display_order?: number }>[] = [
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
        <div className="flex items-center gap-2">
          {onSelect && (
            <button
              onClick={() => onSelect(row.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Lihat Kelas
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => onEdit(row)} className="gap-2 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                Edit Detail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={levels} searchPlaceholder="Cari jenjang pendidikan..." />;
}