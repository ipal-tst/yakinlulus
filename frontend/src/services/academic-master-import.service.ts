import { ApiError } from "@/lib/api";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

export type AcademicImportKind =
    | "level"
    | "grade"
    | "subject"
    | "chapter"
    | "topic"
    | "learning_outcome"
    | "curriculum"
    | "program";

export interface ImportError {
    row: number;
    message: string;
}

export interface AcademicImportResult {
    job_id: string;
    created: number;
    skipped: number;
    failed: number;
    errors: ImportError[];
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...extra };
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("yl_token");
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }
    return headers;
}

// interface JsonResponse<T = any> {
//     success?: boolean;
//     data?: T;
//     message?: string;
//     error?: { message?: string; code?: string };
//     error_code?: string;
// }

// async function parseJsonResponse<T = any>(res: Response): Promise<T> {
//     let json: JsonResponse<T>;
//     try {
//         json = await res.json();
//     } catch {
//         json = {};
//     }
//     if (!res.ok || json.success === false) {
//         if (res.status === 401 && typeof window !== "undefined") {
//             localStorage.removeItem("yl_token");
//             localStorage.removeItem("yl_user");
//             if (!window.location.pathname.startsWith("/login")) {
//                 window.location.href = "/login";
//             }
//         }
//         const message = json.error?.message || json.message || "Permintaan gagal";
//         const code = json.error?.code || json.error_code;
//         throw new ApiError(message, res.status, code);
//     }
//     return json.data as T;
// }

async function downloadBlob(endpoint: string, fallbackName: string): Promise<void> {
    const bust = Date.now();
    const separator = endpoint.includes("?") ? "&" : "?";
    const requestUrl = `${BASE_URL}${endpoint}${separator}dl=${bust}`;
    const res = await fetch(requestUrl, {
        headers: authHeaders(),
        cache: "no-store",
    });
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
        } catch {
            // ignore body parse error
        }
        throw new ApiError(
            `${message} [GET ${requestUrl} => ${res.status}]`,
            res.status,
        );
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fallbackName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export const academicMasterImportService = {
    async downloadTemplate(kind: AcademicImportKind): Promise<void> {
        await downloadBlob(
            `/academic/import/template?kind=${kind}`,
            `template_import_${kind}.xlsx`,
        );
    },

    async importFile(kind: AcademicImportKind, file: File): Promise<AcademicImportResult> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", kind);
        const res = await fetch(`${BASE_URL}/academic/import/xlsx`, {
            method: "POST",
            headers: authHeaders(),
            body: formData,
        });
        interface ImportResponse { success?: boolean; data?: AcademicImportResult; message?: string; error?: { message?: string; code?: string }; error_code?: string }
        let json: ImportResponse;
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
        return json.data as AcademicImportResult;
    },
};
