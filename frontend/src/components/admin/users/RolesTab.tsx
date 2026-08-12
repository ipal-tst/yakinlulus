"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { userService } from "@/services/user.service";
import { Role, RolePermission } from "@/types/admin";
import { Shield, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RolesTabProps {
    canManage?: boolean;
}

export function RolesTab({ canManage = true }: RolesTabProps) {
    const qc = useQueryClient();
    const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);
    const [formOpen, setFormOpen] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<Role | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<Role | null>(null);
    const [formData, setFormData] = React.useState({ code: "", name: "", priority: 100 });

    const { data: roles, isLoading: rolesLoading } = useQuery({
        queryKey: ["roles"],
        queryFn: () => userService.listRoles(),
    });

    const { data: permissions, isLoading: permsLoading } = useQuery({
        queryKey: ["role-permissions", selectedRoleId],
        queryFn: () => userService.getRolePermissions(selectedRoleId!),
        enabled: Boolean(selectedRoleId),
    });

    const createMutation = useMutation({
        mutationFn: (payload: { code: string; name: string; priority: number }) =>
            userService.createRole(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["roles"] });
            setFormOpen(false);
            setFormData({ code: "", name: "", priority: 100 });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: { name?: string; priority?: number } }) =>
            userService.updateRole(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["roles"] });
            setFormOpen(false);
            setEditingRole(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => userService.deleteRole(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["roles"] });
            setDeleteTarget(null);
            if (selectedRoleId === deleteTarget?.id) setSelectedRoleId(null);
        },
    });

    const updatePermsMutation = useMutation({
        mutationFn: ({ id, perms }: { id: string; perms: { id: string; allow: boolean }[] }) =>
            userService.updateRolePermissions(id, perms),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["role-permissions", selectedRoleId] });
        },
    });

    const handleCreate = () => {
        if (!formData.code.trim() || !formData.name.trim()) return;
        createMutation.mutate(formData);
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({ code: role.code, name: role.name, priority: role.priority });
        setFormOpen(true);
    };

    const handleUpdate = () => {
        if (!editingRole || !formData.name.trim()) return;
        updateMutation.mutate({ id: editingRole.id, payload: { name: formData.name, priority: formData.priority } });
    };

    const handlePermissionToggle = (perm: RolePermission) => {
        if (!selectedRoleId || !canManage) return;
        const selectedRole = roles?.find((r) => r.id === selectedRoleId);
        if (selectedRole?.code === "SUPER_ADMIN") return;
        updatePermsMutation.mutate({
            id: selectedRoleId,
            perms: [{ id: perm.id, allow: !perm.allow }],
        });
    };

    React.useEffect(() => {
        if (roles && roles.length > 0 && !selectedRoleId) {
            setSelectedRoleId(roles[0].id);
        }
    }, [roles, selectedRoleId]);

    const selectedRole = roles?.find((r) => r.id === selectedRoleId);
    const isSA = selectedRole?.code === "SUPER_ADMIN";

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-[320px_1fr] gap-4">
                <Card className="p-4 rounded-2xl shadow-xs space-y-3 h-fit">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            Role
                        </h3>
                        {canManage && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setEditingRole(null);
                                    setFormData({ code: "", name: "", priority: 100 });
                                    setFormOpen(true);
                                }}
                                className="rounded-lg h-8"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>

                    {rolesLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
                    ) : (
                        <div className="space-y-2">
                            {(roles ?? []).map((role) => (
                                <Card
                                    key={role.id}
                                    className={cn(
                                        "p-3 rounded-xl cursor-pointer transition-colors hover:border-primary/50",
                                        selectedRoleId === role.id && "border-primary bg-primary/5"
                                    )}
                                    onClick={() => setSelectedRoleId(role.id)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant={role.is_system ? "destructive" : "outline"} className="text-[10px] px-1.5 py-0">
                                                    {role.is_system ? "SISTEM" : "KUSTOM"}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground font-mono">{role.code}</span>
                                            </div>
                                            <p className="font-semibold text-sm truncate">{role.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{role.user_count} pengguna</p>
                                        </div>
                                        {canManage && !role.is_system && (
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(role);
                                                    }}
                                                    className="h-7 w-7 p-0 rounded-lg"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTarget(role);
                                                    }}
                                                    className="h-7 w-7 p-0 rounded-lg text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="p-4 rounded-2xl shadow-xs">
                    {!selectedRoleId ? (
                        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                            Pilih role untuk melihat permissions
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b">
                                <div>
                                    <h3 className="font-semibold">Permission Matrix</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {selectedRole?.name} {isSA && "(Read-only)"}
                                    </p>
                                </div>
                            </div>

                            {permsLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12 rounded-xl" />
                                    ))}
                                </div>
                            ) : (permissions ?? []).length === 0 ? (
                                <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    Tidak ada permission untuk role ini
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {(permissions ?? []).map((perm) => (
                                        <div
                                            key={perm.id}
                                            className="flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{perm.label}</p>
                                                <p className="text-xs text-muted-foreground">{perm.desc}</p>
                                            </div>
                                            <Switch
                                                checked={perm.allow}
                                                onCheckedChange={() => handlePermissionToggle(perm)}
                                                disabled={!canManage || isSA || updatePermsMutation.isPending}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>

            <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-bold">
                            {editingRole ? "Edit Role" : "Tambah Role Baru"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">
                                Kode Role <span className="text-destructive">*</span>
                            </label>
                            <Input
                                placeholder="CUSTOM_ROLE"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                disabled={Boolean(editingRole)}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">
                                Nama Role <span className="text-destructive">*</span>
                            </label>
                            <Input
                                placeholder="Custom Role"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Prioritas</label>
                            <Input
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                                className="h-11"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl">
                            Batal
                        </Button>
                        <Button
                            onClick={editingRole ? handleUpdate : handleCreate}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="rounded-xl"
                        >
                            {editingRole ? "Simpan" : "Tambah"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Hapus Role"
                description={`Role ${deleteTarget?.name} akan dihapus permanen. ${deleteTarget?.user_count || 0} pengguna akan kehilangan role ini.`}
                variant="destructive"
                confirmLabel="Hapus"
                loading={deleteMutation.isPending}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
