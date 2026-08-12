// src/services/user.service.ts
import { api } from "@/lib/api";
import { downloadBlob, exportFilename } from "./school-excel";
import { User, UserRole, Role, RolePermission, UserBulkResult, PaginatedData } from "@/types/admin";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

export interface UserListParams {
    page?: number;
    limit?: number;
    q?: string;
    role?: string;
    status?: string;
    education_level?: string;
}

export interface CreateUserPayload {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    gender?: string;
    phone?: string;
    school_id?: string;
    grade_id?: string;
    major_id?: string;
    status?: "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING";
}

export interface UpdateUserPayload {
    email?: string;
    full_name?: string;
    role?: UserRole;
    status?: "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING";
    gender?: string;
    phone?: string;
    school_id?: string;
    grade_id?: string;
    major_id?: string;
    password?: string;
}

function authHeaders(): Record<string, string> {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("yl_token");
        if (token) return { Authorization: `Bearer ${token}` };
    }
    return {};
}

export interface UserImportResult {
    job_id: string;
    total_rows: number;
    success_count: number;
    failed_count: number;
    errors?: string[];
}

export const userService = {
    async listUsers(params?: UserListParams): Promise<PaginatedData<User> | User[]> {
        return api<PaginatedData<User> | User[]>("/auth/users", {
            params: params as Record<string, string | number | boolean | undefined> | undefined,
        });
    },

    async createUser(payload: CreateUserPayload): Promise<User> {
        return api<User>("/auth/users", { method: "POST", body: payload });
    },

    async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
        return api<User>(`/auth/users/${id}`, { method: "PUT", body: payload });
    },

    async toggleActivate(id: string, active: boolean): Promise<User> {
        return api<User>(`/auth/users/${id}/activate`, { method: "PATCH", body: { active } });
    },

    async deleteUser(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/auth/users/${id}`, { method: "DELETE" });
    },

    async bulkDelete(ids: string[]): Promise<UserBulkResult> {
        return api<UserBulkResult>("/auth/users/bulk-delete", { method: "POST", body: { ids } });
    },

    async bulkStatus(ids: string[], isActive: boolean): Promise<UserBulkResult> {
        return api<UserBulkResult>("/auth/users/bulk-status", { method: "POST", body: { ids, is_active: isActive } });
    },

    async exportXlsx(ids?: string[]): Promise<void> {
        const bust = Date.now();
        const url = `${BASE_URL}/auth/users/export/xlsx?dl=${bust}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ ids: ids ?? [] }),
        });
        if (!res.ok) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
            }
            throw new Error(`Export failed: ${res.status}`);
        }
        const blob = await res.blob();
        downloadBlob(blob, exportFilename("pengguna"));
    },

    async downloadTemplate(): Promise<void> {
        const bust = Date.now();
        const url = `${BASE_URL}/auth/users/import/template?dl=${bust}`;
        const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
        if (!res.ok) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
            }
            throw new Error(`Template download failed: ${res.status}`);
        }
        const blob = await res.blob();
        downloadBlob(blob, "template_import_pengguna.xlsx");
    },

    async importUsers(file: File): Promise<UserImportResult> {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/auth/users/import/xlsx`, {
            method: "POST",
            headers: authHeaders(),
            body: formData,
        });
        if (!res.ok) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
            }
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `Import failed: ${res.status}`);
        }
        return res.json().then((j) => j.data);
    },

    async listRoles(): Promise<Role[]> {
        return api<Role[]>("/auth/roles");
    },

    async createRole(payload: { code: string; name: string; description?: string; priority: number }): Promise<Role> {
        return api<Role>("/auth/roles", { method: "POST", body: payload });
    },

    async updateRole(id: string, payload: { name?: string; description?: string; priority?: number }): Promise<Role> {
        return api<Role>(`/auth/roles/${id}`, { method: "PUT", body: payload });
    },

    async deleteRole(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/auth/roles/${id}`, { method: "DELETE" });
    },

    async getRolePermissions(id: string): Promise<RolePermission[]> {
        return api<RolePermission[]>(`/auth/roles/${id}/permissions`);
    },

    async updateRolePermissions(id: string, permissions: { id: string; allow: boolean }[]): Promise<RolePermission[]> {
        return api<RolePermission[]>(`/auth/roles/${id}/permissions`, { method: "PUT", body: { permissions } });
    },
};
