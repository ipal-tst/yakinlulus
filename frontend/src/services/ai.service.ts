// src/services/ai.service.ts
import { api } from "@/lib/api";

export interface AiConfig {
    model?: string;
    endpoint?: string;
    api_key_masked?: string;
    temperature?: number;
    max_tokens?: number;
    enabled?: boolean;
    [key: string]: unknown;
}

export const aiService = {
    async getConfig(): Promise<AiConfig> {
        return api<AiConfig>("/ai/config");
    },

    async updateConfig(payload: Partial<AiConfig>): Promise<AiConfig> {
        return api<AiConfig>("/ai/config", { method: "PUT", body: payload });
    },

    async testConnection(): Promise<{ ok: boolean; message?: string }> {
        return api<{ ok: boolean; message?: string }>("/ai/test-connection", { method: "POST" });
    },
};