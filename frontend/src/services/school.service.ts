// src/services/school.service.ts
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { downloadBlob, exportFilename } from "./school-excel";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

export type InstitutionType = "SEKOLAH" | "PT";
export type SchoolStatus = "NEGERI" | "SWASTA";

export interface School {
    id: string;
    school_name: string;
    school_code?: string;
    npsn?: string;
    institution_type?: InstitutionType;
    education_level?: string;
    school_status?: SchoolStatus;
    yayasan_name?: string;
    province?: string;
    city?: string;
    district?: string;
    village?: string;
    address?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    curriculum_code?: string;
    status?: string;
    is_active?: boolean;
    total_students?: number;
    created_at?: string;
    updated_at?: string;
    // kompatibilitas field lama (name/regency) utk konsumen lain
    name?: string;
    regency?: string;
}

export interface SchoolPayload {
    school_name: string;
    npsn?: string;
    institution_type?: InstitutionType;
    education_level?: string;
    school_status?: SchoolStatus;
    yayasan_name?: string;
    province?: string;
    city?: string;
    district?: string;
    village?: string;
    address?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    curriculum_code?: string;
    is_active?: boolean;
}

export interface SchoolDemographic {
    id: string;
    school_id: string;
    academic_year: string;
    total_students: number;
    total_rombel: number;
    grade_breakdown: Record<string, number>;
    created_at?: string;
    updated_at?: string;
}

export interface DemographicPayload {
    school_id: string;
    academic_year: string;
    total_students?: number;
    total_rombel?: number;
    grade_breakdown?: Record<string, number>;
}

export const schoolService = {
    async listSchools(params?: { page?: number; limit?: number; q?: string; type?: string; level?: string; province?: string }): Promise<School[]> {
        return api<School[]>("/schools", { params });
    },

    async createSchool(payload: SchoolPayload): Promise<School> {
        return api<School>("/schools", { method: "POST", body: payload });
    },

    async updateSchool(id: string, payload: Partial<SchoolPayload>): Promise<School> {
        return api<School>(`/schools/${id}`, { method: "PUT", body: payload });
    },

    async toggleStatus(id: string, status: string): Promise<School> {
        return api<School>(`/schools/${id}/status`, { method: "PATCH", body: { status } });
    },

    async deleteSchool(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/schools/${id}`, { method: "DELETE" });
    },

    async listDemographics(params?: { school_id?: string; academic_year?: string }): Promise<SchoolDemographic[]> {
        return api<SchoolDemographic[]>("/school-demographics", { params });
    },

    async upsertDemographic(payload: DemographicPayload): Promise<SchoolDemographic> {
        return api<SchoolDemographic>("/school-demographics", { method: "POST", body: payload });
    },

    async updateDemographic(id: string, payload: Partial<DemographicPayload>): Promise<SchoolDemographic> {
        return api<SchoolDemographic>(`/school-demographics/${id}`, { method: "PUT", body: payload });
    },

    async deleteDemographic(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/school-demographics/${id}`, { method: "DELETE" });
    },

    async exportXlsx(ids?: string[]): Promise<void> {
        const bust = Date.now();
        const url = `${BASE_URL}/schools/export/xlsx?dl=${bust}`;
        const headers: Record<string, string> = {};
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("yl_token");
            if (token) headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(url, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ ids: ids ?? [] }),
        });
        if (!res.ok) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
            }
            let message = "Gagal mengekspor sekolah";
            try {
                const json = await res.json();
                message = json.error?.message || json.message || message;
            } catch { /* ignore */ }
            throw new ApiError(message, res.status);
        }
        const blob = await res.blob();
        downloadBlob(blob, exportFilename("sekolah"));
    },

    async bulkDelete(ids: string[]): Promise<{ processed: number; deleted: number; failed: number; errors?: string[] }> {
        return api<{ processed: number; deleted: number; failed: number; errors?: string[] }>("/schools/bulk-delete", { method: "POST", body: { ids } });
    },

    async bulkStatus(ids: string[], isActive: boolean): Promise<{ processed: number; deleted: number; failed: number; errors?: string[] }> {
        return api<{ processed: number; deleted: number; failed: number; errors?: string[] }>("/schools/bulk-status", { method: "POST", body: { ids, is_active: isActive } });
    },

    async downloadSchoolImportTemplate(): Promise<void> {
        const bust = Date.now();
        const url = `${BASE_URL}/schools/import/template?dl=${bust}`;
        const headers: Record<string, string> = {};
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("yl_token");
            if (token) headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(url, { headers, cache: "no-store" });
        if (!res.ok) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
            }
            let message = "Gagal mengunduh template";
            try {
                const json = await res.json();
                message = json.error?.message || json.message || json.error_code || message;
            } catch { /* ignore */ }
            throw new ApiError(`${message} [GET ${url} => ${res.status}]`, res.status);
        }
        const blob = await res.blob();
        downloadBlob(blob, "template_import_sekolah.xlsx");
    },

    async importSchools(file: File): Promise<{ job_id: string; created: number; skipped: number; failed: number; errors: { row: number; message: string }[] }> {
        const formData = new FormData();
        formData.append("file", file);
        const headers: Record<string, string> = {};
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("yl_token");
            if (token) headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(`${BASE_URL}/schools/import/xlsx`, {
            method: "POST",
            headers,
            body: formData,
        });
        interface SchoolImportJson { success?: boolean; data?: { job_id: string; created: number; skipped: number; failed: number; errors: { row: number; message: string }[] }; message?: string; error?: { message?: string; code?: string }; error_code?: string }
        let json: SchoolImportJson;
        try { json = await res.json(); } catch { json = {}; }
        if (!res.ok || json.success === false) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
            }
            const msg = json.error?.message || json.message || "Permintaan gagal";
            throw new ApiError(msg, res.status, json.error?.code);
        }
        return json.data as {
            job_id: string;
            created: number;
            skipped: number;
            failed: number;
            errors: { row: number; message: string }[];
        };
    },
};