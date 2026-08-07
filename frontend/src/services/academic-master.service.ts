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
} from "@/types/academic-master";

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

  getSubjects: (levelId: string, gradeId: string): Promise<Subject[]> => api(`/academic/subjects?education_level_id=${levelId}&grade_id=${gradeId}`),
  createSubject: (data: CreateSubjectReq): Promise<Subject> => api("/academic/subjects", { method: "POST", body: data }),
  updateSubject: (id: string, data: UpdateSubjectReq): Promise<Subject> => api(`/academic/subjects/${id}`, { method: "PUT", body: data }),
  deleteSubject: (id: string): Promise<{ message: string }> => api(`/academic/subjects/${id}`, { method: "DELETE" }),

  getChapters: (subjectId: string): Promise<Chapter[]> => api(`/academic/chapters?subject_id=${subjectId}`),
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
};
