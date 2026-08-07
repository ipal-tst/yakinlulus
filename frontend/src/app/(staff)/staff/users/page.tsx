// src/app/(staff)/staff/users/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { UserTable } from "@/components/admin/users/UserTable";
import { UserFormDialog } from "@/components/admin/users/UserFormDialog";
import { userService } from "@/services/user.service";
import { User } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, AlertCircle } from "lucide-react";

export default function UserManagementPage() {
    const qc = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["admin-users"],
        queryFn: () => userService.listUsers({ page: 1, limit: 200 }),
    });

    const users = Array.isArray(data) ? data : data?.items || [];

    const createMutation = useMutation({
        mutationFn: (values: { full_name: string; email: string; password: string; role: "SUPER_ADMIN" | "STAFF" | "FINANCE" | "GURU" | "SISWA" | "INVESTOR"; phone?: string; school_name?: string; education_level?: string; grade?: string; membership_status?: "ACTIVE" | "INACTIVE" | "TRIAL" }) => userService.createUser(values as any),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            setFormOpen(false);
            setSubmitting(false);
        },
        onError: () => setSubmitting(false),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<User> }) => userService.updateUser(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            setFormOpen(false);
            setEditingUser(null);
            setSubmitting(false);
        },
        onError: () => setSubmitting(false),
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

    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    title="Manajemen Pengguna"
                    description="Kelola semua akun siswa, guru, staff, finance, dan admin."
                    actions={
                        <Button onClick={() => setFormOpen(true)} className="rounded-xl gap-2 font-medium">
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
                    onSubmit={(v) => {
                        setSubmitting(true);
                        if (editingUser) {
                            updateMutation.mutate({ id: editingUser.id, payload: v as any });
                        } else {
                            createMutation.mutate(v as any);
                        }
                    }}
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
        </AppShell>
    );
}