// src/services/user-excel.ts — helper murni utk mapping baris export/import user.

export interface UserRow {
    username: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    gender?: string;
    phone?: string;
    school_name?: string;
}

export const USER_EXPORT_HEADERS = ["USERNAME", "EMAIL", "FULL_NAME", "ROLE", "STATUS", "GENDER", "PHONE", "SCHOOL"];

export function userRowToCells(u: UserRow): (string | undefined)[] {
    return [
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.status,
        u.gender,
        u.phone,
        u.school_name,
    ];
}

export function userImportRowToPayload(row: Record<string, string>): Partial<UserRow> {
    const pick = (k: string) => row[k]?.trim() ?? "";
    return {
        username: pick("USERNAME") || undefined,
        email: pick("EMAIL") || undefined,
        full_name: pick("FULL_NAME") || undefined,
        role: pick("ROLE") || undefined,
        status: pick("STATUS") || undefined,
        gender: pick("GENDER") || undefined,
        phone: pick("PHONE") || undefined,
        school_name: pick("SCHOOL") || undefined,
    };
}
