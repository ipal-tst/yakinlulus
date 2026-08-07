// src/services/audit.service.ts
import { api } from "@/lib/api";

export interface AuditLog {
    id: string;
    event_type: string;
    actor_email: string;
    actor_role: string;
    action: string;
    description: string;
    entity_type: string;
    entity_id: string;
    ip_address: string;
    severity: string;
    created_at: string;
}

export interface AuditStats {
    total_logs: number;
    critical_count: number;
    warning_count: number;
    info_count: number;
    today_count: number;
    login_attempts: number;
}

export const auditService = {
    async getStats(): Promise<AuditStats> {
        return api<AuditStats>("/audit-logs/stats");
    },

    async getLogs(params?: { page?: number; limit?: number; severity?: string }): Promise<AuditLog[] | { items: AuditLog[] }> {
        return api<AuditLog[] | { items: AuditLog[] }>("/audit-logs", { params });
    },
};