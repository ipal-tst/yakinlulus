"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { UserTable } from "./UserTable";
import { UserFormDialog, UserFormValues } from "./UserFormDialog";
import { BulkActionBar } from "@/components/admin/shared/bulk-action-bar";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { userService, UserListParams } from "@/services/user.service";
import { User, UserRole, EducationLevel, UserStat, PaginatedData } from "@/types/admin";
import { 
    Users, UserCheck, GraduationCap, UserCog, Search, 
    Download, Upload, Plus, RefreshCw, Filter 
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

interface UsersTabProps {
    className?: string;
}

export function UsersTab({ className }: UsersTabProps) {
    // State
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [filters, setFilters] = React.useState<UserListParams>({
        page: 1,
        limit: PAGE_SIZE,
        q: "",
        role: "",
        status: "",
        education_level: ""
    });
    const [debouncedQ, setDebouncedQ] = React.useState("");
    const [formOpen, setFormOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [confirmDelete, setConfirmDelete] = React.useState<{ open: boolean; user?: User }>({
        open: false,
        user: undefined
    });
    const [confirmBulk, setConfirmBulk] = React.useState<{ open: boolean; action: "delete" | "activate" | "deactivate" }>({
        open: false,
        action: "delete"
    });
    const [showImport, setShowImport] = React.useState(false);

    // Debounced search
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setFilters(prev => ({ ...prev, q: debouncedQ, page: 1 }));
        }, 400);
        return () => clearTimeout(timeout);
    }, [debouncedQ]);

    // Fetch data
    const { data: usersData, isLoading, refetch } = useQuery({
        queryKey: ["users", filters],
        queryFn: () => userService.listUsers(filters),
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["user-stats"],
        queryFn: async (): Promise<UserStat> => {
            // In a real app, this would be a dedicated stats endpoint
            const allUsers = await userService.listUsers({ limit: 1000 });
            const items = Array.isArray(allUsers) ? allUsers : (allUsers as PaginatedData<User>).items;
            
            const total = items.length;
            const active = items.filter(u => u.is_active).length;
            const inactive = items.filter(u => !u.is_active).length;
            const siswa = items.filter(u => u.role === "SISWA" || u.role === "SUPER_SISWA").length;
            const guru = items.filter(u => u.role === "GURU").length;
            
            return { total, active, inactive, siswa, guru };
        },
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: (id: string) => userService.deleteUser(id),
        onSuccess: () => {
            setConfirmDelete({ open: false });
            refetch();
            if (selectedIds.size > 0) {
                setSelectedIds(new Set());
            }
        },
    });

    const toggleActivateMutation = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) => 
            userService.toggleActivate(id, active),
        onSuccess: () => refetch(),
    });

    const bulkActionMutation = useMutation({
        mutationFn: async (action: "delete" | "activate" | "deactivate") => {
            const ids = Array.from(selectedIds);
            if (action === "delete") {
                return userService.bulkDelete(ids);
            } else {
                const isActive = action === "activate";
                return userService.bulkStatus(ids, isActive);
            }
        },
        onSuccess: () => {
            setConfirmBulk({ open: false, action: "delete" });
            setSelectedIds(new Set());
            refetch();
        },
    });

    const createMutation = useMutation({
        mutationFn: (values: UserFormValues) => 
            editingUser 
                ? userService.updateUser(editingUser.id, values)
                : userService.createUser(values as any),
        onSuccess: () => {
            setFormOpen(false);
            setEditingUser(null);
            refetch();
        },
    });

    // Handlers
    const handleFilterChange = (key: keyof UserListParams, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value || undefined, page: 1 }));
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormOpen(true);
    };

    const handleDelete = (user: User) => {
        setConfirmDelete({ open: true, user });
    };

    const handleToggleActivate = (user: User) => {
        toggleActivateMutation.mutate({ id: user.id, active: !user.is_active });
    };

    const handleExport = () => {
        const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
        userService.exportXlsx(ids);
    };

    const handleImportComplete = () => {
        setShowImport(false);
        refetch();
    };

    const handleBulkAction = (action: "delete" | "activate" | "deactivate") => {
        setConfirmBulk({ open: true, action });
    };

    const handleConfirmBulk = () => {
        if (confirmBulk.action) {
            bulkActionMutation.mutate(confirmBulk.action);
        }
    };

    const handleFormSubmit = (values: UserFormValues) => {
        createMutation.mutate(values);
    };

    const handlePagination = (direction: "prev" | "next") => {
        setFilters(prev => {
            const currentPage = prev.page || 1;
            const nextPage = direction === "prev" ? Math.max(1, currentPage - 1) : currentPage + 1;
            return { ...prev, page: nextPage };
        });
    };

    // Derived data
    const users = React.useMemo(() => {
        if (!usersData) return [];
        if (Array.isArray(usersData)) return usersData;
        return (usersData as PaginatedData<User>).items;
    }, [usersData]);

    const paginationMeta = React.useMemo(() => {
        if (!usersData || Array.isArray(usersData)) return null;
        const data = usersData as PaginatedData<User>;
        return {
            total: data.total,
            page: data.page,
            totalPages: data.total_pages,
            hasNext: data.page < data.total_pages,
            hasPrev: data.page > 1
        };
    }, [usersData]);

    // Bulk actions
    const bulkActions = [
        {
            label: "Aktifkan",
            variant: "default" as const,
            onClick: () => handleBulkAction("activate"),
            confirm: `Aktifkan ${selectedIds.size} pengguna?`
        },
        {
            label: "Nonaktifkan",
            variant: "outline" as const,
            onClick: () => handleBulkAction("deactivate"),
            confirm: `Nonaktifkan ${selectedIds.size} pengguna?`
        },
        {
            label: "Hapus",
            variant: "destructive" as const,
            onClick: () => handleBulkAction("delete"),
            confirm: `Hapus ${selectedIds.size} pengguna secara permanen?`
        }
    ];

    // Render
    return (
        <div className={cn("space-y-6", className)}>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-2xl" />
                    ))
                ) : (
                    <>
                        <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Pengguna</p>
                                    <p className="text-xl font-bold font-heading">{stats?.total || 0}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Aktif</p>
                                    <p className="text-xl font-bold font-heading">{stats?.active || 0}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Siswa</p>
                                    <p className="text-xl font-bold font-heading">{stats?.siswa || 0}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                    <UserCog className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Guru</p>
                                    <p className="text-xl font-bold font-heading">{stats?.guru || 0}</p>
                                </div>
                            </div>
                        </Card>
                    </>
                )}
            </div>

            {/* Filter Bar */}
            <Card className="p-4 rounded-2xl shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama, email, username..."
                            value={debouncedQ}
                            onChange={(e) => setDebouncedQ(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Select 
                        value={filters.role || ""} 
                        onValueChange={(v) => handleFilterChange("role", v || "")}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Semua Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Semua Role</SelectItem>
                            <SelectItem value="SISWA">Siswa</SelectItem>
                            <SelectItem value="SUPER_SISWA">Super Siswa</SelectItem>
                            <SelectItem value="GURU">Guru</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="FINANCE">Finance</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select 
                        value={filters.status || ""} 
                        onValueChange={(v) => handleFilterChange("status", v || "")}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Semua Status</SelectItem>
                            <SelectItem value="ACTIVE">Aktif</SelectItem>
                            <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                            <SelectItem value="LOCKED">Terkunci</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select 
                        value={filters.education_level || ""} 
                        onValueChange={(v) => handleFilterChange("education_level", v || "")}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Semua Jenjang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Semua Jenjang</SelectItem>
                            <SelectItem value="SD">SD</SelectItem>
                            <SelectItem value="SMP">SMP</SelectItem>
                            <SelectItem value="SMA">SMA</SelectItem>
                            <SelectItem value="GapYear">Gap Year</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setFilters({
                                page: 1,
                                limit: PAGE_SIZE,
                                q: "",
                                role: "",
                                status: "",
                                education_level: ""
                            });
                            setDebouncedQ("");
                        }}
                        className="rounded-xl"
                    >
                        <Filter className="h-4 w-4" />
                        Reset
                    </Button>
                </div>
            </Card>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                            setEditingUser(null);
                            setFormOpen(true);
                        }}
                        className="rounded-xl"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah Pengguna
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImport(true)}
                        className="rounded-xl"
                    >
                        <Upload className="h-4 w-4 mr-1" />
                        Import Excel
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => userService.downloadTemplate()}
                        className="rounded-xl"
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Template Excel
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="rounded-xl"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                        Refresh
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={isLoading}
                        className="rounded-xl"
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
                    </Button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <BulkActionBar
                    count={selectedIds.size}
                    actions={bulkActions}
                    onClear={() => setSelectedIds(new Set())}
                    className="animate-in fade-in slide-in-from-top-2"
                />
            )}

            {/* Users Table */}
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                </div>
            ) : users.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Belum ada pengguna"
                    description="Mulai dengan menambahkan pengguna baru atau impor dari file Excel."
                    actionLabel="Tambah Pengguna"
                    onAction={() => {
                        setEditingUser(null);
                        setFormOpen(true);
                    }}
                />
            ) : (
                <>
                    <UserTable
                        users={users}
                        selectable={true}
                        selectedRowIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onEdit={handleEdit}
                        onToggleActivate={(user: User) => handleToggleActivate(user)}
                        onDelete={handleDelete}
                    />

                    {/* Pagination */}
                    {paginationMeta && (
                        <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
                            <div>
                                Menampilkan {((paginationMeta.page - 1) * PAGE_SIZE) + 1}-{Math.min(paginationMeta.page * PAGE_SIZE, paginationMeta.total)} dari {paginationMeta.total} pengguna
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePagination("prev")}
                                    disabled={!paginationMeta.hasPrev}
                                    className="rounded-lg"
                                >
                                    Sebelumnya
                                </Button>
                                <Badge variant="secondary" className="rounded-lg">
                                    Halaman {paginationMeta.page} dari {paginationMeta.totalPages}
                                </Badge>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePagination("next")}
                                    disabled={!paginationMeta.hasNext}
                                    className="rounded-lg"
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Dialogs */}
            <UserFormDialog
                open={formOpen}
                loading={createMutation.isPending}
                editing={editingUser || undefined}
                onClose={() => {
                    setFormOpen(false);
                    setEditingUser(null);
                }}
                onSubmit={handleFormSubmit}
            />

            <ConfirmDialog
                open={confirmDelete.open}
                title="Hapus Pengguna"
                description={`Apakah Anda yakin ingin menghapus ${confirmDelete.user?.full_name}? Tindakan ini tidak dapat dibatalkan.`}
                variant="destructive"
                loading={deleteMutation.isPending}
                onConfirm={() => {
                    if (confirmDelete.user) {
                        deleteMutation.mutate(confirmDelete.user.id);
                    }
                }}
                onCancel={() => setConfirmDelete({ open: false })}
            />

            <ConfirmDialog
                open={confirmBulk.open}
                title={confirmBulk.action === "delete" ? "Hapus Massal" : 
                      confirmBulk.action === "activate" ? "Aktifkan Massal" : "Nonaktifkan Massal"}
                description={`${selectedIds.size} pengguna akan diproses. Tindakan ini tidak dapat dibatalkan.`}
                variant={confirmBulk.action === "delete" ? "destructive" : "default"}
                loading={bulkActionMutation.isPending}
                onConfirm={handleConfirmBulk}
                onCancel={() => setConfirmBulk({ open: false, action: "delete" })}
            />

            {/* Import Dialog - Would be rendered by parent or separate modal */}
            {showImport && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl rounded-2xl shadow-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Import Pengguna dari Excel</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowImport(false)}
                                    className="rounded-lg"
                                >
                                    ✕
                                </Button>
                            </div>
                            <div className="text-sm text-muted-foreground mb-4">
                                Unggah file Excel (.xlsx) yang berisi data pengguna. Pastikan format sesuai template.
                            </div>
                            <div className="p-4 border-2 border-dashed border-border rounded-xl text-center">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mb-3">
                                    Drag & drop file Excel atau klik untuk memilih
                                </p>
                                <Button variant="outline" className="rounded-xl">
                                    Pilih File
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}