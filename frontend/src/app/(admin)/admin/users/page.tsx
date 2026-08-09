"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { UserTable } from "@/components/admin/users/UserTable";
import { UserFormDialog, UserFormValues } from "@/components/admin/users/UserFormDialog";
import { userService, CreateUserPayload, UpdateUserPayload } from "@/services/user.service";
import { User } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, AlertCircle } from "lucide-react";

export default function AdminUserManagementPage() {
    const qc = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["admin-users"],
        queryFn: () => userService.listUsers({ page: 1, limit: 200 }),
    });

    const users = Array.isArray(data) ? data : data?.items || [];

    const createMutation = useMutation({
        mutationFn: (values: CreateUserPayload) => userService.createUser(values),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            setFormOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => userService.updateUser(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            setFormOpen(false);
            setEditingUser(null);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) => userService.toggleActivate(id, active),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            setDeleteTarget(null);
        },
    });

    const handleSubmitForm = (values: UserFormValues) => {
        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, payload: values as UpdateUserPayload });
        } else {
            createMutation.mutate(values as CreateUserPayload);
        }
    };

    return (

            <div className="space-y-6">
                <PageHeader
                    title="Manajemen Pengguna (User Management)"
                    description="Kelola semua akun pengguna platform: Siswa, Guru, Staff, Finance, Investor, dan Super Admin."
                    actions={
                        <Button onClick={() => setFormOpen(true)} className="rounded-xl gap-2 font-medium shadow-xs">
                            <UserPlus className="h-4 w-4" /> Tambah User
                        </Button>
                    }
                />

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error instanceof Error ? error.message : "Gagal memuat pengguna"}</span>
                        <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                            Coba lagi
                        </Button>
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <UserTable
                        users={users}
                        onToggleActivate={(u) => toggleMutation.mutate({ id: u.id, active: !u.is_active })}
                        onDelete={(u) => setDeleteTarget(u)}
                        onEdit={(u) => { setEditingUser(u); setFormOpen(true); }}
                    />
                )}

                <UserFormDialog
                    open={formOpen}
                    loading={editingUser ? updateMutation.isPending : createMutation.isPending}
                    editing={editingUser || undefined}
                    onClose={() => { setFormOpen(false); setEditingUser(null); }}
                    onSubmit={handleSubmitForm}
                />

                <ConfirmDialog
                    open={Boolean(deleteTarget)}
                    title="Hapus pengguna?"
                    description={`${deleteTarget?.full_name} (${deleteTarget?.email}) akan dihapus permanen.`}
                    confirmLabel="Hapus"
                    variant="destructive"
                    loading={deleteMutation.isPending}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                />
            </div>

    );
}
