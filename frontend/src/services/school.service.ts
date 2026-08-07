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
    address?: string;
    phone?: string;
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
    address?: string;
    phone?: string;
    school_name?: string;
    school_code?: string;
}

export const schoolService = {
    async listSchools(params?: { page?: number; limit?: number; q?: string }): Promise<School[]> {
        return api<School[]>("/schools", { params });
    },

    async createSchool(payload: SchoolPayload): Promise<School> {
        const body = {
            ...payload,
            school_name: payload.name || payload.school_name,
            school_code: payload.code || payload.school_code,
        };
        return api<School>("/schools", { method: "POST", body });
    },

    async updateSchool(id: string, payload: Partial<SchoolPayload>): Promise<School> {
        const body = {
            ...payload,
            school_name: payload.name || payload.school_name,
            school_code: payload.code || payload.school_code,
        };
        return api<School>(`/schools/${id}`, { method: "PUT", body });
    },

    async toggleStatus(id: string, status: string): Promise<School> {
        return api<School>(`/schools/${id}/status`, { method: "PATCH", body: { status } });
    },

    async deleteSchool(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/schools/${id}`, { method: "DELETE" });
    },
};