export interface QuestionFormOption {
  label: string;
  content: string;
  correct: boolean;
}

export interface QuestionFormData {
  level_id: string;
  grade_id: string;
  subject_id: string;
  chapter_id: string;
  difficulty: string;
  question_type: string;
  content: string;
  explanation: string;
  score: number;
  negative_score: number;
  options: QuestionFormOption[];
}

export function emptyQuestionForm(): QuestionFormData {
  return {
    level_id: "",
    grade_id: "",
    subject_id: "",
    chapter_id: "",
    difficulty: "MEDIUM",
    question_type: "SINGLE_CHOICE",
    content: "",
    explanation: "",
    score: 1.0,
    negative_score: 0.0,
    options: [
      { label: "A", content: "", correct: true },
      { label: "B", content: "", correct: false },
      { label: "C", content: "", correct: false },
      { label: "D", content: "", correct: false },
      { label: "E", content: "", correct: false },
    ],
  };
}

export function mapQuestionToForm(q: any, gradesList: any[]): QuestionFormData {
  const grade = gradesList.find((g) => g.id === q.grade_id);
  const opts =
    q.options && q.options.length > 0
      ? q.options.map((o: any) => ({
          label: o.label || "A",
          content: o.content || "",
          correct: Boolean(o.is_correct || o.correct),
        }))
      : emptyQuestionForm().options;
  return {
    level_id: grade?.education_level_id || q.level_id || "",
    grade_id: q.grade_id || "",
    subject_id: q.subject_id || "",
    chapter_id: q.chapter_id || "",
    difficulty: q.difficulty || "MEDIUM",
    question_type: q.question_type || "SINGLE_CHOICE",
    content: q.content || "",
    explanation: q.explanation || "",
    score: q.score ?? 1.0,
    negative_score: q.negative_score ?? 0.0,
    options: opts,
  };
}

export function buildQuestionPayload(f: QuestionFormData) {
  return {
    subject_id: f.subject_id,
    chapter_id: f.chapter_id || undefined,
    difficulty: f.difficulty,
    question_type: f.question_type,
    content: f.content,
    explanation: f.explanation,
    score: Number(f.score),
    negative_score: Number(f.negative_score),
    options: f.options.filter((o) => o.content.trim() !== ""),
  };
}
