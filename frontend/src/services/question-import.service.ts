import { ApiError } from "@/lib/api";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

export interface QuestionImportResult {
    job_id: string;
    created: number;
    failed: number;
    errors: string[];
}

export interface MaterialImportResult {
    created: number;
    failed: number;
    errors: string[];
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

async function parseJsonResponse(res: Response): Promise<any> {
    let json: any;
    try {
        json = await res.json();
    } catch {
        json = {};
    }
    if (!res.ok || json.success === false) {
        if (res.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("yl_token");
            localStorage.removeItem("yl_user");
            if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login";
            }
        }
        const message = json.error?.message || json.message || "Permintaan gagal";
        const code = json.error?.code || json.error_code;
        throw new ApiError(message, res.status, code);
    }
    return json.data;
}

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

export const questionImportService = {
    async downloadTemplate(): Promise<void> {
        await downloadBlob("/questions/import/template", "template_import_soal.xlsx");
    },

    async importFile(file: File): Promise<QuestionImportResult> {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/questions/import/xlsx`, {
            method: "POST",
            headers: authHeaders(),
            body: formData,
        });
        return parseJsonResponse(res);
    },
};

export const materialImportService = {
    async downloadTemplate(): Promise<void> {
        await downloadBlob("/materials/import/template", "template_import_materi.xlsx");
    },

    async importFile(file: File): Promise<MaterialImportResult> {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/materials/import/xlsx`, {
            method: "POST",
            headers: authHeaders(),
            body: formData,
        });
        return parseJsonResponse(res);
    },
};