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
};
