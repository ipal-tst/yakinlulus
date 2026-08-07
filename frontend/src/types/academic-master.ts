export type EducationLevel = {
  id: string;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Grade = {
  id: string;
  education_level_id: string;
  level_code: string;
  name: string;
  alias?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  level_id: string;
  grade_id?: string | null;
  level_code: string;
  level_name: string;
  grade_code: string;
  grade_name: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Chapter = {
  id: string;
  subject_id: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subject_name?: string;
};

export type Topic = {
  id: string;
  chapter_id: string;
  title: string;
  description?: string | null;
  sequence: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LearningOutcome = {
  id: string;
  topic_id: string;
  code?: string | null;
  title: string;
  sequence: number;
  bloom_default?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BloomLevel = 'PENGETAHUAN' | 'PEMAHAMAN' | 'DUKTI' | 'AKSES' | 'ANALISIS' | 'EVALUASI' | 'MELAKUKAN' | 'MEMBERIKAN';

export type Curriculum = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Program = {
  id: string;
  name: string;
  code: string;
  education_level: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateLevelReq = Omit<EducationLevel, 'id' | 'created_at' | 'updated_at'>;
export type UpdateLevelReq = Partial<CreateLevelReq>;
export type CreateGradeReq = { education_level_id: string; name: string; alias?: string; display_order?: number; is_active?: boolean };
export type UpdateGradeReq = Partial<CreateGradeReq>;
export type CreateSubjectReq = { education_level_id: string; grade_id?: string | null; name: string; code: string; description?: string; display_order?: number };
export type UpdateSubjectReq = Partial<CreateSubjectReq>;
export type CreateChapterReq = { subject_id: string; name: string; description?: string; display_order?: number };
export type UpdateChapterReq = Partial<CreateChapterReq>;
export type CreateTopicReq = { chapter_id: string; title: string; description?: string; sequence?: number };
export type UpdateTopicReq = Partial<CreateTopicReq>;
export type CreateLearningOutcomeReq = { topic_id: string; code?: string; title: string; sequence?: number; bloom_default?: string; description?: string };
export type UpdateLearningOutcomeReq = Partial<CreateLearningOutcomeReq>;
export type CreateCurriculumReq = Omit<Curriculum, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCurriculumReq = Partial<CreateCurriculumReq>;
export type CreateProgramReq = Omit<Program, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProgramReq = Partial<CreateProgramReq>;
