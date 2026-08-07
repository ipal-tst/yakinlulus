// src/services/notification.service.ts
import { api } from "@/lib/api";

export interface NotificationTemplate {
    id: string;
    name: string;
    title: string;
    message: string;
    channel?: string;
    created_at?: string;
}

export const notificationService = {
    async broadcast(payload: { title: string; message: string; audience?: string }): Promise<{ message: string }> {
        return api<{ message: string }>("/notifications/broadcast", { method: "POST", body: payload });
    },

    async send(payload: { user_id: string; title: string; message: string }): Promise<{ message: string }> {
        return api<{ message: string }>("/notifications/send", { method: "POST", body: payload });
    },

    async listTemplates(): Promise<NotificationTemplate[]> {
        return api<NotificationTemplate[]>("/notifications/templates");
    },

    async createTemplate(payload: Omit<NotificationTemplate, "id">): Promise<NotificationTemplate> {
        return api<NotificationTemplate>("/notifications/templates", { method: "POST", body: payload });
    },

    async updateTemplate(id: string, payload: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
        return api<NotificationTemplate>(`/notifications/templates/${id}`, { method: "PUT", body: payload });
    },

    async deleteTemplate(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/notifications/templates/${id}`, { method: "DELETE" });
    },
};