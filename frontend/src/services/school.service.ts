// src/services/school.service.ts
import { api } from "@/lib/api";

export interface School {
    id: string;
    name: string;
    code?: string;
    npsn?: string;
    education_level?: string;
    province?: string;
    regency?: string;
    status?: string;
    total_students?: number;
    created_at?: string;
    updated_at?: string;
}

export interface SchoolPayload {
    name: string;
    code?: string;
    npsn?: string;
    education_level?: string;
    province?: string;
    regency?: string;
}

export const schoolService = {
    async listSchools(params?: { page?: number; limit?: number; q?: string }): Promise<School[]> {
        return api<School[]>("/school", { params });
    },

    async createSchool(payload: SchoolPayload): Promise<School> {
        return api<School>("/school", { method: "POST", body: payload });
    },

    async updateSchool(id: string, payload: Partial<SchoolPayload>): Promise<School> {
        return api<School>(`/school/${id}`, { method: "PUT", body: payload });
    },

    async toggleStatus(id: string, status: string): Promise<School> {
        return api<School>(`/school/${id}/status`, { method: "PATCH", body: { status } });
    },

    async deleteSchool(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/school/${id}`, { method: "DELETE" });
    },
};