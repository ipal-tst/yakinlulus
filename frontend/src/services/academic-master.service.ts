import { api } from "@/lib/api";
import type {
  EducationLevel,
  CreateLevelReq,
  UpdateLevelReq,
  Grade,
  CreateGradeReq,
  UpdateGradeReq,
  Subject,
  CreateSubjectReq,
  UpdateSubjectReq,
  Chapter,
  CreateChapterReq,
  UpdateChapterReq,
  Topic,
  CreateTopicReq,
  UpdateTopicReq,
  LearningOutcome,
  CreateLearningOutcomeReq,
  UpdateLearningOutcomeReq,
  Curriculum,
  CreateCurriculumReq,
  UpdateCurriculumReq,
  Program,
  CreateProgramReq,
  UpdateProgramReq,
} from "@/types/academic-master";
import type { AcademicKind, BulkResult } from "@/components/admin/academic/academic-excel";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1";

function authHeaders(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("yl_token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

export const academicMasterService = {
  getLevels: (): Promise<EducationLevel[]> => api("/academic/levels"),
  getLevel: (id: string): Promise<EducationLevel> => api(`/academic/levels/${id}`),
  createLevel: (data: CreateLevelReq): Promise<EducationLevel> => api("/academic/levels", { method: "POST", body: data }),
  updateLevel: (id: string, data: UpdateLevelReq): Promise<EducationLevel> => api(`/academic/levels/${id}`, { method: "PUT", body: data }),
  deleteLevel: (id: string): Promise<{ message: string }> => api(`/academic/levels/${id}`, { method: "DELETE" }),

  getGrades: (levelId: string): Promise<Grade[]> => api(`/academic/grades?level_id=${levelId}`),
  createGrade: (data: CreateGradeReq): Promise<Grade> => api("/academic/grades", { method: "POST", body: data }),
  updateGrade: (id: string, data: UpdateGradeReq): Promise<Grade> => api(`/academic/grades/${id}`, { method: "PUT", body: data }),
  deleteGrade: (id: string): Promise<{ message: string }> => api(`/academic/grades/${id}`, { method: "DELETE" }),

  getSubjects: (levelId?: string, gradeId?: string, status?: "all" | "active" | "inactive"): Promise<Subject[]> => {
    const params = new URLSearchParams();
    if (levelId) params.append("education_level_id", levelId);
    if (gradeId) params.append("grade_id", gradeId);
    if (status && status !== "all") params.append("is_active", status);
    const queryString = params.toString();
    return api(`/academic/subjects${queryString ? `?${queryString}` : ""}`);
  },
  createSubject: (data: CreateSubjectReq): Promise<Subject> => api("/academic/subjects", { method: "POST", body: data }),
  updateSubject: (id: string, data: UpdateSubjectReq): Promise<Subject> => api(`/academic/subjects/${id}`, { method: "PUT", body: data }),
  deleteSubject: (id: string): Promise<{ message: string }> => api(`/academic/subjects/${id}`, { method: "DELETE" }),

  getChapters: (subjectId: string): Promise<Chapter[]> => api(`/academic/subjects/${subjectId}/chapters`),
  createChapter: (data: CreateChapterReq): Promise<Chapter> => api("/academic/chapters", { method: "POST", body: data }),
  updateChapter: (id: string, data: UpdateChapterReq): Promise<Chapter> => api(`/academic/chapters/${id}`, { method: "PUT", body: data }),
  deleteChapter: (id: string): Promise<{ message: string }> => api(`/academic/chapters/${id}`, { method: "DELETE" }),

  getTopics: (chapterId: string): Promise<Topic[]> => api(`/academic/topics?chapter_id=${chapterId}`),
  createTopic: (data: CreateTopicReq): Promise<Topic> => api("/academic/topics", { method: "POST", body: data }),
  updateTopic: (id: string, data: UpdateTopicReq): Promise<Topic> => api(`/academic/topics/${id}`, { method: "PUT", body: data }),
  deleteTopic: (id: string): Promise<{ message: string }> => api(`/academic/topics/${id}`, { method: "DELETE" }),

  getLearningOutcomes: (topicId: string): Promise<LearningOutcome[]> => api(`/academic/learning-outcomes?topic_id=${topicId}`),
  createLearningOutcome: (data: CreateLearningOutcomeReq): Promise<LearningOutcome> => api("/academic/learning-outcomes", { method: "POST", body: data }),
  updateLearningOutcome: (id: string, data: UpdateLearningOutcomeReq): Promise<LearningOutcome> => api(`/academic/learning-outcomes/${id}`, { method: "PUT", body: data }),
  deleteLearningOutcome: (id: string): Promise<{ message: string }> => api(`/academic/learning-outcomes/${id}`, { method: "DELETE" }),

  getCurriculums: (status?: "all" | "active" | "inactive"): Promise<Curriculum[]> => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("is_active", status);
    const queryString = params.toString();
    return api(`/academic/curriculums${queryString ? `?${queryString}` : ""}`);
  },
  createCurriculum: (data: CreateCurriculumReq): Promise<Curriculum> => api("/academic/curriculums", { method: "POST", body: data }),
  updateCurriculum: (id: string, data: UpdateCurriculumReq): Promise<Curriculum> => api(`/academic/curriculums/${id}`, { method: "PUT", body: data }),
  deleteCurriculum: (id: string): Promise<{ message: string }> => api(`/academic/curriculums/${id}`, { method: "DELETE" }),

  getPrograms: (status?: "all" | "active" | "inactive"): Promise<Program[]> => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("is_active", status);
    const queryString = params.toString();
    return api(`/academic/programs${queryString ? `?${queryString}` : ""}`);
  },
  createProgram: (data: CreateProgramReq): Promise<Program> => api("/academic/programs", { method: "POST", body: data }),
  updateProgram: (id: string, data: UpdateProgramReq): Promise<Program> => api(`/academic/programs/${id}`, { method: "PUT", body: data }),
  deleteProgram: (id: string): Promise<{ message: string }> => api(`/academic/programs/${id}`, { method: "DELETE" }),

  exportXlsx: async (kind: AcademicKind, ids?: string[]): Promise<Blob> => {
    const url = `${BASE_URL}/academic/export/xlsx?kind=${kind}`;
    const finalUrl = ids && ids.length > 0 ? `${url}&ids=${ids.join(",")}` : url;
    const res = await fetch(finalUrl, { headers: authHeaders() });
    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("yl_token");
        localStorage.removeItem("yl_user");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      throw new Error(`Export failed: ${res.status}`);
    }
    return res.blob();
  },

  bulkDelete: async (kind: AcademicKind, ids: string[]): Promise<BulkResult> => {
    const res = await fetch(`${BASE_URL}/academic/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ kind, ids }),
    });
    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("yl_token");
        localStorage.removeItem("yl_user");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      const data = await res.json();
      throw new Error(data.message || `Bulk delete failed: ${res.status}`);
    }
    return res.json();
  },

  bulkStatus: async (kind: AcademicKind, ids: string[], isActive: boolean): Promise<BulkResult> => {
    const res = await fetch(`${BASE_URL}/academic/bulk-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ kind, ids, is_active: isActive }),
    });
    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("yl_token");
        localStorage.removeItem("yl_user");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      const data = await res.json();
      throw new Error(data.message || `Bulk status failed: ${res.status}`);
    }
    return res.json();
  },
};
