// src/components/admin/notifications/TemplateTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotificationTemplate } from "@/services/notification.service";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TemplateTableProps {
    templates: NotificationTemplate[];
    onDelete: (template: NotificationTemplate) => void;
}

export function TemplateTable({ templates, onDelete }: TemplateTableProps) {
    const columns: Column<NotificationTemplate>[] = [
        {
            header: "Nama Templat",
            accessorKey: "name",
            cell: (row) => (
                <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground leading-none">{row.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{row.title}</span>
                </div>
            ),
        },
        {
            header: "Kanal",
            accessorKey: "channel",
            cell: (row) => <Badge variant="secondary">{row.channel || "SYSTEM"}</Badge>,
        },
        {
            header: "Pesan Sederhana",
            accessorKey: (row) => (row.message.length > 60 ? row.message.slice(0, 60) + "..." : row.message),
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
                        <DropdownMenuItem onClick={() => onDelete(row)} className="text-destructive focus:text-destructive gap-2">
                            <Trash2 className="h-4 w-4" />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return <DataTable columns={columns} data={templates} searchPlaceholder="Cari templat..." />;
}