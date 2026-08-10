import { ApiResponse } from "@/types";

const BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

export interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
    auth?: boolean;
    params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
    code?: string;
    status: number;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

export async function api<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        method = "GET",
        body,
        headers: customHeaders = {},
        auth = true,
        params,
    } = options;

    let url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            url += `${url.includes("?") ? "&" : "?"}${queryString}`;
        }
    }

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const headers: Record<string, string> = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...customHeaders,
    };

    if (auth && typeof window !== "undefined") {
        const token = localStorage.getItem("yl_token");
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    const response = await fetch(url, {
        method,
        headers,
        body: isFormData ? (body as unknown as BodyInit) : body ? JSON.stringify(body) : undefined,
    });

    // Handle non-JSON or empty responses
    let json: ApiResponse<T>;
    try {
        json = await response.json();
    } catch {
        if (!response.ok) {
            throw new ApiError("Terjadi kesalahan pada server", response.status);
        }
        return {} as T;
    }

    if (!response.ok || json.success === false) {
        const errorMessage =
            json.error?.message || json.message || "Permintaan gagal";
        const errorCode = json.error?.code;

        // Auto logout on 401 Unauthorized
        if (response.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("yl_token");
            localStorage.removeItem("yl_user");
            if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login";
            }
        }

        throw new ApiError(errorMessage, response.status, errorCode);
    }

    return json.data;
}
