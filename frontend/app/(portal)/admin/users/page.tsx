"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import { useUsers, apiFetch } from "@/lib/api";
import {
    UserPlus,
    Search,
    Shield,
    GraduationCap,
    School,
    Lock,
    Unlock,
    RefreshCw,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
} from "lucide-react";

interface UserItem {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    avatar_url?: string;
}

/* ============================================================================
 * ISOLATED MODAL COMPONENTS (PERFORMANCE & SUBMIT FIX)
 * ============================================================================ */

const CreateUserModal = React.memo(function CreateUserModal({
    isOpen,
    onClose,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = React.useState({ full_name: "", email: "", password: "", role: "STUDENT" });
    const [formError, setFormError] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setFormData({ full_name: "", email: "", password: "", role: "STUDENT" });
            setFormError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validateForm = (): boolean => {
        if (!formData.full_name.trim() || !formData.email.trim() || !formData.password) {
            setFormError("Semua field (Nama, Email, Password) wajib diisi!");
            return false;
        }

        const pass = formData.password;
        if (pass.length < 10) {
            setFormError("Password minimal 10 karakter.");
            return false;
        }

        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasDigit = /[0-9]/.test(pass);
        const hasSpecial = /[^A-Za-z0-9]/.test(pass);

        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            setFormError("Password harus kombinasi huruf besar, kecil, angka, dan simbol (contoh: User123456!)");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setFormError("");

        if (!validateForm()) return;

        setSubmitting(true);
        try {
            await apiFetch("/auth/users", {
                method: "POST",
                body: JSON.stringify({
                    full_name: formData.full_name.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                    role: formData.role,
                }),
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setFormError(err.message || "Gagal menambahkan user baru ke database.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-extrabold text-lg flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" /> Tambah User Baru
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {formError && (
                    <div className="p-3 text-xs bg-danger/10 text-danger font-semibold rounded-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1">
                        <label className="font-semibold text-foreground">Nama Lengkap</label>
                        <input
                            type="text"
                            placeholder="Contoh: Ahmad Subagja"
                            value={formData.full_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="font-semibold text-foreground">Email</label>
                        <input
                            type="email"
                            placeholder="ahmad@yakinlulus.id"
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="font-semibold text-foreground">Password</label>
                        <input
                            type="password"
                            placeholder="Min 10 Karakter (Huruf Besar, Kecil, Angka, Simbol)"
                            value={formData.password}
                            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Contoh format password valid: <span className="font-mono text-primary font-bold">User123456!</span>
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="font-semibold text-foreground">Role Akses</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:ring-2 focus:ring-primary"
                        >
                            <option value="STUDENT">STUDENT (Siswa)</option>
                            <option value="TEACHER">TEACHER (Guru)</option>
                            <option value="STAFF">STAFF (Pengelola)</option>
                            <option value="ADMIN">ADMIN (Administrator)</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={submitting}
                            onClick={(e) => {
                                e.preventDefault();
                                handleSubmit();
                            }}
                            className="font-bold cursor-pointer"
                        >
                            {submitting ? "Menyimpan ke Database..." : "Simpan User"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
});

const EditUserModal = React.memo(function EditUserModal({
    user,
    onClose,
    onSuccess,
}: {
    user: UserItem | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = React.useState({ full_name: "", email: "", role: "STUDENT", is_active: true });
    const [formError, setFormError] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || "",
                email: user.email || "",
                role: (user.role || "STUDENT").toUpperCase(),
                is_active: Boolean(user.is_active),
            });
            setFormError("");
        }
    }, [user]);

    if (!user) return null;

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setFormError("");

        if (!formData.full_name.trim() || !formData.email.trim()) {
            setFormError("Nama dan Email wajib diisi!");
            return;
        }

        setSubmitting(true);
        try {
            await apiFetch(`/auth/users/${user.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    full_name: formData.full_name.trim(),
                    email: formData.email.trim(),
                    role: formData.role,
                    is_active: formData.is_active,
                }),
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setFormError(err.message || "Gagal memperbarui data user.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-extrabold text-lg flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-primary" /> Edit Data User
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {formError && (
                    <div className="p-3 text-xs bg-danger/10 text-danger font-semibold rounded-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1">
                        <label className="font-semibold text-foreground">Nama Lengkap</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="font-semibold text-foreground">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="font-semibold text-foreground">Role Akses</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border bg-background text-xs focus:ring-2 focus:ring-primary"
                        >
                            <option value="STUDENT">STUDENT (Siswa)</option>
                            <option value="TEACHER">TEACHER (Guru)</option>
                            <option value="STAFF">STAFF (Pengelola)</option>
                            <option value="ADMIN">ADMIN (Administrator)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="edit-is-active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                            className="h-4 w-4 rounded border-primary cursor-pointer"
                        />
                        <label htmlFor="edit-is-active" className="font-semibold text-foreground cursor-pointer">
                            Akun Aktif (Bisa Login & Gunakan Platform)
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={submitting}
                            onClick={(e) => {
                                e.preventDefault();
                                handleSubmit();
                            }}
                            className="font-bold cursor-pointer"
                        >
                            {submitting ? "Memperbarui Database..." : "Update User"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
});

const DeleteUserModal = React.memo(function DeleteUserModal({
    user,
    onClose,
    onSuccess,
}: {
    user: UserItem | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState("");

    if (!user) return null;

    const handleDelete = async () => {
        setSubmitting(true);
        setError("");
        try {
            await apiFetch(`/auth/users/${user.id}`, { method: "DELETE" });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(`Gagal menghapus user: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-sm p-6 space-y-4 text-center shadow-xl">
                <div className="h-12 w-12 rounded-full bg-danger/10 text-danger mx-auto flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                </div>

                <div>
                    <h3 className="font-extrabold text-base">Konfirmasi Hapus User</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Apakah Anda yakin ingin menghapus pengguna <span className="font-bold text-foreground">{user.full_name}</span> ({user.email})? Tindakan ini akan menghapus data dari Database Supabase.
                    </p>
                </div>

                {error && (
                    <div className="p-2 text-xs bg-danger/10 text-danger font-semibold rounded-lg">
                        {error}
                    </div>
                )}

                <div className="flex justify-center gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Batal
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={submitting} className="font-bold cursor-pointer">
                        {submitting ? "Menghapus dari DB..." : "Ya, Hapus User"}
                    </Button>
                </div>
            </Card>
        </div>
    );
});

/* ============================================================================
 * MAIN USER MANAGEMENT PAGE
 * ============================================================================ */

export default function UserManagementPage() {
    const [globalError, setGlobalError] = React.useState("");
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<UserItem | null>(null);
    const [deletingUser, setDeletingUser] = React.useState<UserItem | null>(null);

    const [search, setSearch] = React.useState("");
    const [roleFilter, setRoleFilter] = React.useState<string>("ALL");

    const { data: usersList = [], isLoading, refetch } = useUsers(1, 50);
    const users = (usersList as UserItem[]) || [];

    // Handle Status Toggle
    const toggleStatus = React.useCallback(async (id: string, currentActive: boolean) => {
        try {
            await apiFetch(`/auth/users/${id}/activate`, {
                method: "PATCH",
                body: JSON.stringify({ active: !currentActive }),
            });
        } catch (err: any) {
            setGlobalError(`Gagal mengubah status di database: ${err.message || "Akses ditolak"}`);
        }
        refetch();
    }, [refetch]);

    // Memoize Filtered Users list
    const filteredUsers = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        const roleF = roleFilter.toUpperCase();
        return users.filter((u) => {
            const name = (u.full_name || "").toLowerCase();
            const email = (u.email || "").toLowerCase();
            const matchesSearch = !q || name.includes(q) || email.includes(q);
            const userRole = (u.role || "").toUpperCase();
            const matchesRole = roleF === "ALL" || userRole === roleF;
            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    // Memoize Metric Counts
    const { studentCount, teacherCount, adminCount } = React.useMemo(() => {
        let sCount = 0;
        let tCount = 0;
        let aCount = 0;
        for (const u of users) {
            const r = (u.role || "").toUpperCase();
            if (r === "STUDENT") sCount++;
            else if (r === "TEACHER") tCount++;
            else if (r === "ADMIN" || r === "STAFF") aCount++;
        }
        return { studentCount: sCount, teacherCount: tCount, adminCount: aCount };
    }, [users]);

    const columnHelper = createColumnHelper<UserItem>();

    const columns = React.useMemo(
        () => [
            columnHelper.accessor((row) => `${row.full_name || ""}||${row.email || ""}`, {
                id: "nama",
                header: "Nama & Email User",
                cell: ({ getValue }) => {
                    const val = getValue() || "||";
                    const [name, email] = val.split("||");
                    return (
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-xs shrink-0">
                                {name ? name.substring(0, 2).toUpperCase() : "US"}
                            </div>
                            <div>
                                <div className="font-bold text-foreground">{name || "Pengguna"}</div>
                                <div className="text-[11px] text-muted-foreground font-mono">{email || "-"}</div>
                            </div>
                        </div>
                    );
                },
            }),
            columnHelper.accessor("role", {
                header: "Role Akses",
                cell: ({ getValue }) => {
                    const role = (getValue() || "").toUpperCase();
                    return (
                        <Badge
                            variant={
                                role === "ADMIN"
                                    ? "destructive"
                                    : role === "TEACHER"
                                        ? "warning"
                                        : role === "STAFF"
                                            ? "default"
                                            : "outline"
                            }
                            className="text-[10px] font-bold uppercase"
                        >
                            {role || "STUDENT"}
                        </Badge>
                    );
                },
            }),
            columnHelper.accessor("is_active", {
                header: "Status Akun",
                cell: ({ getValue }) => (
                    <Badge
                        variant={getValue() ? "success" : "destructive"}
                        className="text-[10px] font-bold"
                    >
                        {getValue() ? "AKTIF" : "NON-AKTIF"}
                    </Badge>
                ),
            }),
            columnHelper.accessor("created_at", {
                header: "Tanggal Dibuat",
                cell: ({ getValue }) => (
                    <span className="text-muted-foreground font-mono text-[11px]">
                        {getValue()
                            ? new Date(getValue()).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            })
                            : "-"}
                    </span>
                ),
            }),
            columnHelper.display({
                id: "actions",
                header: () => <span className="block text-right">Tindakan (CRUD)</span>,
                cell: ({ row }) => {
                    const u = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatus(u.id, u.is_active)}
                                className="h-8 px-2 text-[11px] font-semibold cursor-pointer"
                                title={u.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                            >
                                {u.is_active ? (
                                    <Lock className="h-3.5 w-3.5 text-danger" />
                                ) : (
                                    <Unlock className="h-3.5 w-3.5 text-success" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(u)}
                                className="h-8 px-2 text-[11px] font-semibold text-primary cursor-pointer"
                                title="Edit User"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingUser(u)}
                                className="h-8 px-2 text-[11px] font-semibold text-danger cursor-pointer"
                                title="Hapus User"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    );
                },
            }),
        ],
        [columnHelper, toggleStatus]
    );

    const table = useReactTable({
        data: filteredUsers,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold">DATABASE CRUD SYNC</Badge>
                        <span className="text-xs text-muted-foreground">
                            Query via TanStack
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Manajemen Pengguna</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola data pengguna terdaftar dari Database Supabase PostgreSQL dengan fitur CRUD Lengkap.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="text-xs cursor-pointer">
                        <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                        className="text-xs font-bold shadow-md shadow-primary/20 cursor-pointer"
                    >
                        <UserPlus className="mr-2 h-4 w-4" /> Tambah User Baru
                    </Button>
                </div>
            </div>

            {/* Global Error Banner */}
            {globalError && (
                <div className="p-4 text-xs bg-danger/10 text-danger border border-danger/20 font-bold rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
                        <span>{globalError}</span>
                    </div>
                    <button onClick={() => setGlobalError("")} className="text-danger hover:underline text-[11px] cursor-pointer">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Total Siswa (DB)</span>
                        <div className="text-xl font-extrabold">{studentCount}</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold">
                        <School className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Total Guru (DB)</span>
                        <div className="text-xl font-extrabold">{teacherCount}</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Admin & Staff (DB)</span>
                        <div className="text-xl font-extrabold">{adminCount}</div>
                    </div>
                </Card>
            </div>

            {/* Filters Bar */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari nama atau email di database..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <span className="text-xs text-muted-foreground font-semibold">Role Filter:</span>
                        {["ALL", "STUDENT", "TEACHER", "STAFF", "ADMIN"].map((r) => (
                            <Button
                                key={r}
                                variant={roleFilter === r ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRoleFilter(r)}
                                className="text-xs font-semibold cursor-pointer"
                            >
                                {r === "ALL" ? "Semua" : r}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* User Data Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="p-4">
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={table.getAllColumns().length} className="p-8 text-center text-muted-foreground">
                                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                                        Memuat data pengguna dari database...
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={table.getAllColumns().length} className="p-8 text-center text-muted-foreground">
                                        Tidak ada data pengguna yang cocok.
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="p-4">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* CREATE USER MODAL */}
            <CreateUserModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => refetch()}
            />

            {/* EDIT USER MODAL */}
            <EditUserModal
                user={editingUser}
                onClose={() => setEditingUser(null)}
                onSuccess={() => refetch()}
            />

            {/* DELETE USER MODAL */}
            <DeleteUserModal
                user={deletingUser}
                onClose={() => setDeletingUser(null)}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
