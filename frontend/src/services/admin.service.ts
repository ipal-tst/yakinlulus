// src/services/admin.service.ts
import { api } from "@/lib/api";
import { AdminHealth, LogEntry } from "@/types/admin";

export const adminService = {
    async getHealth(): Promise<AdminHealth> {
        return api<AdminHealth>("/admin/health");
    },

    async getLogs(limit = 50): Promise<{ logs: LogEntry[] }> {
        return api<{ logs: LogEntry[] }>("/admin/logs", { params: { limit } });
    },
};