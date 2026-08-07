// src/components/admin/users/UserTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@/types/admin";
import { UserRoleBadge } from "./UserRoleBadge";
import { MoreHorizontal, Power, Trash2, Pencil } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserTableProps {
    users: User[];
    loading?: boolean;
    onToggleActivate: (user: User) => void;
    onDelete: (user: User) => void;
    onEdit: (user: User) => void;
}

export function UserTable({ users, onToggleActivate, onDelete, onEdit }: UserTableProps) {
    const columns: Column<User>[] = [
        {
            header: "Nama",
            accessorKey: "full_name",
            cell: (row) => (
                <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground leading-none">{row.full_name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{row.email}</span>
                </div>
            ),
        },
        { header: "Peran / Role", accessorKey: "role", cell: (row) => <UserRoleBadge role={row.role} /> },
        {
            header: "Status",
            accessorKey: "is_active",
            cell: (row) => (
                <Badge variant={row.is_active ? "success" : "outline"}>
                    {row.is_active ? "Aktif" : "Non-aktif"}
                </Badge>
            ),
        },
        { header: "Sekolah", accessorKey: (row) => row.school_name || "-" },
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
                        <DropdownMenuItem onClick={() => onToggleActivate(row)} className="gap-2">
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

    return <DataTable columns={columns} data={users} searchPlaceholder="Cari nama atau email..." />;
}