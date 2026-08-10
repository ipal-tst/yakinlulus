import { api } from "@/lib/api";

export interface MediaAsset {
    id: string;
    url?: string;
    file_name?: string;
    file_type?: string;
    entity_type?: string;
    entity_id?: string;
    created_at?: string;
    [key: string]: unknown;
}

export const mediaService = {
    async listMedia(): Promise<MediaAsset[]> {
        return api<MediaAsset[]>("/media");
    },
    async uploadMedia(formData: FormData): Promise<MediaAsset> {
        return api<MediaAsset>("/media/upload", { method: "POST", body: formData });
    },
};