// src/services/target-school.service.ts
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { downloadBlob, exportFilename } from "./school-excel";
import {
    TargetCatalogEntry,
    EnrichedTarget,
    SaveTargetPayload,
} from "@/types/siswa";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

export interface TargetSchool {
    id: string;
    name: string;
    level: string;
    school_id?: string;
    province?: string;
    city?: string;
    district?: string;
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
    name?: string;
    level?: string;
    school_id: string;
    min_score?: number;
    max_score?: number;
    max_total_score: number;
    subjects: string[];
    academic_year?: string;
    is_active?: boolean;
}

export interface TargetSchoolScore {
    id: string;
    target_school_id: string;
    academic_year: string;
    min_score?: number;
    max_score?: number;
    max_total_score: number;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TrendPoint {
    academic_year: string;
    min_score?: number;
    max_score?: number;
    delta_min?: number;
    delta_max?: number;
}

export const targetSchoolService = {
    async listTargetSchools(
        params?: { level?: string; province?: string; q?: string; include_inactive?: boolean }
    ): Promise<TargetSchool[]> {
        return api<TargetSchool[]>("/target-schools", { params });
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

    // --- Nilai per tahun ajaran (target_school_score) ---

    async listScores(params?: { target_school_id?: string; academic_year?: string }): Promise<TargetSchoolScore[]> {
        return api<TargetSchoolScore[]>("/target-school-scores", { params });
    },

    async upsertScore(payload: { target_school_id: string; academic_year: string; min_score?: number; max_score?: number; max_total_score?: number }): Promise<TargetSchoolScore> {
        return api<TargetSchoolScore>("/target-school-scores", { method: "POST", body: payload });
    },

    async updateScore(id: string, payload: { min_score?: number; max_score?: number; max_total_score?: number }): Promise<TargetSchoolScore> {
        return api<TargetSchoolScore>(`/target-school-scores/${id}`, { method: "PUT", body: payload });
    },

    async deleteScore(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/target-school-scores/${id}`, { method: "DELETE" });
    },

    async getTrend(id: string): Promise<TrendPoint[]> {
        const res = await api<{ items?: TrendPoint[] }>(`/target-school-scores/trend/${id}`);
        return res?.items ?? [];
    },

    async exportScores(ids?: string[]): Promise<void> {
        const bust = Date.now();
        const url = `${BASE_URL}/target-school-scores/export/xlsx?dl=${bust}`;
        const headers: Record<string, string> = {};
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("yl_token");
            if (token) headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(url, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ target_school_id: ids?.[0] ?? "", academic_year: "" }),
        });
        if (!res.ok) {
            if (res.status === 401 && typeof window !== "undefined") {
                localStorage.removeItem("yl_token");
                localStorage.removeItem("yl_user");
                if (!window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
            }
            let message = "Gagal mengekspor nilai target";
            try {
                const json = await res.json();
                message = json.error?.message || json.message || message;
            } catch { /* ignore */ }
            throw new ApiError(message, res.status);
        }
        const blob = await res.blob();
        downloadBlob(blob, exportFilename("target-skor"));
    },

    async importScores(file: File): Promise<{ job_id: string; created: number; skipped: number; failed: number; errors: { row: number; message: string }[] }> {
        const formData = new FormData();
        formData.append("file", file);
        const headers: Record<string, string> = {};
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("yl_token");
            if (token) headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(`${BASE_URL}/target-school-scores/import/xlsx`, {
            method: "POST",
            headers,
            body: formData,
        });
        interface ScoreImportJson { success?: boolean; data?: { job_id: string; created: number; skipped: number; failed: number; errors: { row: number; message: string }[] }; message?: string; error?: { message?: string; code?: string }; error_code?: string }
        let json: ScoreImportJson;
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

    async bulkDeleteScores(ids: string[]): Promise<{ processed: number; deleted: number; failed: number; errors?: string[] }> {
        return api<{ processed: number; deleted: number; failed: number; errors?: string[] }>("/target-school-scores/bulk-delete", { method: "POST", body: { ids } });
    },

    async downloadTargetImportTemplate(): Promise<void> {
        const bust = Date.now();
        const url = `${BASE_URL}/target-schools/import/template?dl=${bust}`;
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
        downloadBlob(blob, "template_import_target_sekolah.xlsx");
    },

    async importTargets(file: File): Promise<{ job_id: string; created: number; skipped: number; failed: number; errors: { row: number; message: string }[] }> {
        const formData = new FormData();
        formData.append("file", file);
        const headers: Record<string, string> = {};
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("yl_token");
            if (token) headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(`${BASE_URL}/target-schools/import/xlsx`, {
            method: "POST",
            headers,
            body: formData,
        });
        interface TargetImportJson { success?: boolean; data?: { job_id: string; created: number; skipped: number; failed: number; errors: { row: number; message: string }[] }; message?: string; error?: { message?: string; code?: string }; error_code?: string }
        let json: TargetImportJson;
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

    // --- Siswa Target Sekolah [KONTRAK BARU §15.12] ---

    async getTargetCatalog(
        params?: { level?: string; province?: string; city?: string; q?: string }
    ): Promise<TargetCatalogEntry[]> {
        const res = await api<TargetCatalogEntry[] | { items: TargetCatalogEntry[] }>("/targets/catalog", { params });
        return Array.isArray(res) ? res : (res?.items ?? []);
    },

    async getMyTargets(): Promise<EnrichedTarget[]> {
        return api<EnrichedTarget[]>("/profile/targets");
    },

    async saveMyTargets(payload: SaveTargetPayload): Promise<EnrichedTarget[]> {
        return api<EnrichedTarget[]>("/profile/targets", {
            method: "PUT",
            body: payload,
        });
    },

    async deleteMyTarget(choice: 1 | 2): Promise<{ message: string }> {
        return api<{ message: string }>(`/profile/targets/${choice}`, {
            method: "DELETE",
        });
    },
};