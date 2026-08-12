import { api } from "@/lib/api";
import {
    AuthResponse,
    LoginPayload,
    RegisterPayload,
    User,
    PaginatedData,
} from "@/types";

export const authService = {
    async login(payload: LoginPayload): Promise<AuthResponse> {
        return api<AuthResponse>("/auth/login", {
            method: "POST",
            body: payload,
            auth: false,
        });
    },

    async register(payload: RegisterPayload): Promise<AuthResponse> {
        return api<AuthResponse>("/auth/register", {
            method: "POST",
            body: payload,
            auth: false,
        });
    },

    async forgotPassword(email: string): Promise<{ message: string }> {
        return api<{ message: string }>("/auth/forgot-password", {
            method: "POST",
            body: { email },
            auth: false,
        });
    },

    async resetPassword(token: string, password: string): Promise<{ message: string }> {
        return api<{ message: string }>("/auth/reset-password", {
            method: "POST",
            body: { token, password },
            auth: false,
        });
    },

    async getMe(): Promise<User> {
        return api<User>("/auth/me");
    },

    async updateProfile(payload: Partial<User>): Promise<User> {
        return api<User>("/auth/profile", {
            method: "PUT",
            body: payload,
        });
    },

    async changePassword(old_password: string, new_password: string): Promise<{ message: string }> {
        return api<{ message: string }>("/auth/change-password", {
            method: "POST",
            body: { current_password: old_password, new_password },
        });
    },

    // Academic pickers (settings page)
    async getEducationLevels(): Promise<{ id: string; name: string; code: string; display_order: number; is_active: boolean }[]> {
        return api<{ id: string; name: string; code: string; display_order: number; is_active: boolean }[]>("/academic/levels");
    },

    async getGradesByLevel(level_id: string): Promise<{ id: string; education_level_id: string; level_code: string; name: string; alias?: string; display_order: number; is_active: boolean }[]> {
        return api<{ id: string; education_level_id: string; level_code: string; name: string; alias?: string; display_order: number; is_active: boolean }[]>("/academic/grades", {
            params: { level_id },
        });
    },

    // Admin / Staff User Management
    async getUsers(params?: { page?: number; limit?: number; q?: string }): Promise<PaginatedData<User> | User[]> {
        return api<PaginatedData<User> | User[]>("/auth/users", {
            params,
        });
    },

    async createUser(payload: Partial<User> & { password: string }): Promise<User> {
        return api<User>("/auth/users", {
            method: "POST",
            body: payload,
        });
    },

    async updateUser(id: string, payload: Partial<User>): Promise<User> {
        return api<User>(`/auth/users/${id}`, {
            method: "PUT",
            body: payload,
        });
    },

    async toggleActivate(id: string, active: boolean): Promise<User> {
        return api<User>(`/auth/users/${id}/activate`, {
            method: "PATCH",
            body: { active },
        });
    },

    async deleteUser(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/auth/users/${id}`, {
            method: "DELETE",
        });
    },
};
