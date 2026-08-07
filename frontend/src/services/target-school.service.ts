// src/services/target-school.service.ts
import { api } from "@/lib/api";

export interface TargetSchool {
    id: string;
    name: string;
    level: string;
    min_score?: number;
    max_score?: number;
    max_total_score: number;
    subjects: string[];
    academic_year?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TargetSchoolPayload {
    name: string;
    level: string;
    min_score?: number;
    max_score?: number;
    max_total_score: number;
    subjects: string[];
    academic_year?: string;
    is_active?: boolean;
}

export const targetSchoolService = {
    async listTargetSchools(): Promise<TargetSchool[]> {
        return api<TargetSchool[]>("/target-schools");
    },

    async createTargetSchool(payload: TargetSchoolPayload): Promise<TargetSchool> {
        return api<TargetSchool>("/target-schools", { method: "POST", body: payload });
    },

    async updateTargetSchool(id: string, payload: Partial<TargetSchoolPayload>): Promise<TargetSchool> {
        return api<TargetSchool>(`/target-schools/${id}`, { method: "PUT", body: payload });
    },

    async deleteTargetSchool(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/target-schools/${id}`, { method: "DELETE" });
    },
};