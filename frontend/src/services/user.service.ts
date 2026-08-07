// src/services/user.service.ts
import { api } from "@/lib/api";
import { User, UserRole, PaginatedData } from "@/types/admin";

export interface CreateUserPayload {
    email: string;
    password?: string;
    full_name: string;
    role: UserRole;
    gender?: string;
    phone?: string;
    school_name?: string;
    education_level?: string;
    grade?: string;
    membership_status?: "ACTIVE" | "INACTIVE" | "TRIAL";
}

export interface UpdateUserPayload extends Partial<User> {
    password?: string;
}

export const userService = {
    async listUsers(params?: { page?: number; limit?: number; q?: string }): Promise<PaginatedData<User> | User[]> {
        return api<PaginatedData<User> | User[]>("/auth/users", { params });
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
};