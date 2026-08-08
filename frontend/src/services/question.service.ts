import { api } from "@/lib/api";
import { QuestionItem, PaginatedData } from "@/types";

export const questionService = {
    async getQuestions(params?: {
        subject_name?: string;
        difficulty?: string;
        page?: number;
        limit?: number;
    }): Promise<QuestionItem[] | PaginatedData<QuestionItem>> {
        return api<QuestionItem[] | PaginatedData<QuestionItem>>("/questions", {
            params,
        });
    },

    async createQuestion(payload: Partial<QuestionItem>): Promise<QuestionItem> {
        return api<QuestionItem>("/questions", {
            method: "POST",
            body: payload,
        });
    },

    async updateQuestion(id: string, payload: Partial<QuestionItem>): Promise<QuestionItem> {
        return api<QuestionItem>(`/questions/${id}`, {
            method: "PUT",
            body: payload,
        });
    },

    async deleteQuestion(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/questions/${id}`, {
            method: "DELETE",
        });
    },

    async publishQuestion(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/questions/${id}/publish`, {
            method: "POST",
        });
    },

    async unpublishQuestion(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/questions/${id}/unpublish`, {
            method: "POST",
        });
    },

    async archiveQuestion(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/questions/${id}/archive`, {
            method: "POST",
        });
    },

    async restoreQuestion(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/questions/${id}/restore`, {
            method: "POST",
        });
    },

    async checkDuplicates(payload: {
        subject_id?: string;
        items: {
            id: string;
            subject_id?: string;
            content: string;
            options?: { label: string; content: string }[];
        }[];
    }): Promise<{
        id: string;
        is_duplicate: boolean;
        existing_question_id?: string;
        existing_question_code?: string;
        duplicate_type?: string;
    }[]> {
        return api("/questions/check-duplicates", {
            method: "POST",
            body: payload,
        });
    },

    async bulkPublishQuestions(ids: string[]): Promise<{ message: string; count: number }> {
        return api<{ message: string; count: number }>("/questions/bulk-publish", {
            method: "POST",
            body: { ids },
        });
    },

    async bulkUpdateStatus(ids: string[], status: string): Promise<{ message: string; count: number }> {
        return api<{ message: string; count: number }>("/questions/bulk-status", {
            method: "POST",
            body: { ids, status },
        });
    },

    async bulkUpdateQuestions(payload: {
        ids: string[];
        subject_id?: string;
        grade_id?: string;
        chapter_id?: string;
        difficulty?: string;
        status?: string;
        score?: number;
        negative_score?: number;
    }): Promise<{ message: string; count: number }> {
        return api<{ message: string; count: number }>("/questions/bulk-update", {
            method: "POST",
            body: payload,
        });
    },

    async bulkDeleteQuestions(ids: string[]): Promise<{ message: string; count: number }> {
        return api<{ message: string; count: number }>("/questions/bulk-delete", {
            method: "POST",
            body: { ids },
        });
    },
};

