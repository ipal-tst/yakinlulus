# Full-Section CMS (Question Bank & Materials) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert floating modal forms (create/edit soal, import soal, create/edit materi) into full-width dedicated route pages with live review, so long content is easy to edit and review.

**Architecture:** Add 5 new route pages under `app/(portal)/admin`: `question-bank/create`, `question-bank/import`, `question-bank/[id]/edit`, `materials/create`, `materials/[id]/edit`. Reusable form sections (`QuestionFormSection`, `MaterialFormSection`) hold the form + state; pure mapper/payload builders live in `lib/*-form-utils.ts` for unit testing. The existing list pages become Link sources and drop their create/edit/bulk/ai-import modals (small confirm modals stay).

**Tech Stack:** Next.js 15 (App Router, `use client`), React 19, TanStack Query hooks from `@/lib/api`, Tailwind v4, lucide-react, KaTeX (`MathKaTeXPreview`), XLSX, vitest + @testing-library/react (jsdom).

## Global Constraints

- No comments in code unless explaining non-obvious logic.
- Match existing code style: 4-space indent in `frontend/app`, 2-space indent in `frontend/components` (existing files vary — follow the file you edit).
- All forms must reuse the existing API hooks (`useCreateQuestion`, `useUpdateQuestion`, `useCreateMaterial`, `useUpdateMaterial`, `useMaterial`, `useQuestion`, etc.).
- `apiFetch` unwraps `{ data }` → hooks return the object directly (no `.data` access).
- Keep small confirmation modals: delete, FSM, KaTeX preview, material detail, AI summary. Do NOT convert them.
- Verify with `cmd /c "npm run type-check 2>&1"` and `cmd /c "npm test 2>&1"` from `frontend/`.
- Dev servers running: frontend :3000 (hot-reload), backend :8080. Work directly on `main` (user-approved).
- Only commit if the user explicitly asks.

---

### Task 1: Question form utils (pure functions) + tests

**Files:**
- Create: `frontend/lib/question-form-utils.ts`
- Test: `frontend/lib/question-form-utils.test.ts`

**Interfaces:**
- Produces: `QuestionFormData`, `emptyQuestionForm()`, `mapQuestionToForm(q, gradesList)`, `buildQuestionPayload(f)`. Used by Task 3.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { emptyQuestionForm, mapQuestionToForm, buildQuestionPayload } from "./question-form-utils";

describe("emptyQuestionForm", () => {
  it("returns 5 options with A correct and defaults", () => {
    const f = emptyQuestionForm();
    expect(f.question_type).toBe("SINGLE_CHOICE");
    expect(f.difficulty).toBe("MEDIUM");
    expect(f.options).toHaveLength(5);
    expect(f.options[0]).toEqual({ label: "A", content: "", correct: true });
    expect(f.options[4]).toEqual({ label: "E", content: "", correct: false });
  });
});

describe("mapQuestionToForm", () => {
  it("maps question options and resolves level from grade", () => {
    const q = {
      grade_id: "g1", subject_id: "s1", chapter_id: "c1",
      difficulty: "HARD", question_type: "TRUE_FALSE",
      content: "soal", explanation: "pembahasan", score: 2, negative_score: 0.5,
      options: [
        { label: "A", content: "Benar", is_correct: false },
        { label: "B", content: "Salah", is_correct: true },
      ],
    };
    const gradesList = [{ id: "g1", education_level_id: "lv1" }];
    const f = mapQuestionToForm(q, gradesList);
    expect(f.level_id).toBe("lv1");
    expect(f.grade_id).toBe("g1");
    expect(f.options).toEqual([
      { label: "A", content: "Benar", correct: false },
      { label: "B", content: "Salah", correct: true },
    ]);
  });

  it("returns empty form defaults when no options / grade", () => {
    const f = mapQuestionToForm({}, []);
    expect(f.options).toHaveLength(5);
    expect(f.level_id).toBe("");
  });
});

describe("buildQuestionPayload", () => {
  it("filters empty options and converts undefined chapter to omitted", () => {
    const f = emptyQuestionForm();
    f.subject_id = "s1";
    f.content = "Berapa 2+2?";
    f.options = [
      { label: "A", content: "3", correct: false },
      { label: "B", content: "4", correct: true },
      { label: "C", content: "", correct: false },
    ];
    const payload = buildQuestionPayload(f);
    expect(payload.options).toHaveLength(2);
    expect(payload.chapter_id).toBeUndefined();
    expect(payload.score).toBe(1);
    expect(payload.options[1].content).toBe("4");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c "npm test -- lib/question-form-utils.test.ts 2>&1"` from `frontend/`
Expected: FAIL — module not found (`question-form-utils.ts`).

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c "npm test -- lib/question-form-utils.test.ts 2>&1"` from `frontend/`
Expected: PASS (3 describe blocks, 4 tests).

---

### Task 2: Material form utils (pure functions) + tests

**Files:**
- Create: `frontend/lib/material-form-utils.ts`
- Test: `frontend/lib/material-form-utils.test.ts`

**Interfaces:**
- Produces: `MaterialFormData`, `emptyMaterialForm()`, `mapMaterialToForm(m)`. Used by Task 4.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { emptyMaterialForm, mapMaterialToForm } from "./material-form-utils";

describe("emptyMaterialForm", () => {
  it("returns defaults", () => {
    const f = emptyMaterialForm();
    expect(f.content_format).toBe("MARKDOWN");
    expect(f.estimated_duration).toBe(15);
    expect(f.status).toBe("PUBLISHED");
    expect(f.title).toBe("");
  });
});

describe("mapMaterialToForm", () => {
  it("maps material body/content and both id naming conventions", () => {
    const m = {
      subjectId: "s1", chapterId: "c1", topicId: "t1",
      title: "Hukum Newton", contentFormat: "PDF",
      estimatedDuration: 30, body: "Isi materi", status: "DRAFT",
    };
    const f = mapMaterialToForm(m);
    expect(f.subject_id).toBe("s1");
    expect(f.chapter_id).toBe("c1");
    expect(f.topic_id).toBe("t1");
    expect(f.content_format).toBe("PDF");
    expect(f.estimated_duration).toBe(30);
    expect(f.content).toBe("Isi materi");
    expect(f.status).toBe("DRAFT");
  });

  it("falls back to snake_case fields", () => {
    const m = { subject_id: "s2", title: "X", content: "Y", content_format: "MARKDOWN" };
    const f = mapMaterialToForm(m);
    expect(f.subject_id).toBe("s2");
    expect(f.content).toBe("Y");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c "npm test -- lib/material-form-utils.test.ts 2>&1"` from `frontend/`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
export interface MaterialFormData {
  subject_id: string;
  chapter_id: string;
  topic_id: string;
  title: string;
  content_format: string;
  estimated_duration: number;
  content: string;
  status: string;
}

export function emptyMaterialForm(): MaterialFormData {
  return {
    subject_id: "",
    chapter_id: "",
    topic_id: "",
    title: "",
    content_format: "MARKDOWN",
    estimated_duration: 15,
    content: "",
    status: "PUBLISHED",
  };
}

export function mapMaterialToForm(m: any): MaterialFormData {
  return {
    subject_id: m.subject_id || m.subjectId || "",
    chapter_id: m.chapter_id || m.chapterId || "",
    topic_id: m.topic_id || m.topicId || "",
    title: m.title || "",
    content_format: m.content_format || m.contentFormat || "MARKDOWN",
    estimated_duration: m.estimated_duration || m.estimatedDuration || 15,
    content: m.body || m.content || "",
    status: m.status || "PUBLISHED",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c "npm test -- lib/material-form-utils.test.ts 2>&1"` from `frontend/`
Expected: PASS (2 describe blocks, 3 tests).

---

### Task 3: `QuestionFormSection` component

**Files:**
- Create: `frontend/components/admin/QuestionFormSection.tsx`

**Interfaces:**
- Consumes: `emptyQuestionForm`, `mapQuestionToForm`, `buildQuestionPayload` from `@/lib/question-form-utils` (Task 1); hooks from `@/lib/api`; `MathKaTeXPreview`; `MediaPicker`.
- Produces: default-exported `QuestionFormSection({ mode, initialData?, submitLabel?, isSubmitting?, onSubmit, onCancel })`. Used by Task 7 & Task 8.

- [ ] **Step 1: Create the component**

Two-column layout: left = form (`lg:grid-cols-2`), right = sticky live preview. Form fields (transferred from the current create/edit modal in `admin/question-bank/page.tsx`): Jenjang → Kelas → Mapel (cascading), Bab, Tipe Soal, Kesulitan, Konten + MediaPicker, Opsi A–E with radio kunci + tambah/hapus, Pembahasan + MediaPicker, Skor & Skor Negatif. Preview shows badges (mapel/kelas/tipe/kesulitan), `MathKaTeXPreview` of content, options with kunci highlighted, and explanation.

```tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MediaPicker from "@/components/media-picker";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";
import {
    useLevels,
    useGrades,
    useSubjects,
    useChapters,
} from "@/lib/api";
import {
    emptyQuestionForm,
    mapQuestionToForm,
    buildQuestionPayload,
    type QuestionFormData,
} from "@/lib/question-form-utils";

interface QuestionFormSectionProps {
    mode: "create" | "edit";
    initialData?: any;
    submitLabel?: string;
    isSubmitting?: boolean;
    onSubmit: (payload: any) => void;
    onCancel: () => void;
}

export function QuestionFormSection({
    mode,
    initialData,
    submitLabel = "Simpan Soal",
    isSubmitting = false,
    onSubmit,
    onCancel,
}: QuestionFormSectionProps) {
    const { data: levels = [] } = useLevels() as any;
    const levelsList: any[] = Array.isArray(levels) ? levels : [];
    const { data: grades = [] } = useGrades() as any;
    const gradesList: any[] = Array.isArray(grades) ? grades : [];
    const { data: subjects = [] } = useSubjects() as any;
    const subjectsList: any[] = Array.isArray(subjects) ? subjects : [];

    const [formData, setFormData] = React.useState<QuestionFormData>(emptyQuestionForm());
    const [initialized, setInitialized] = React.useState(mode === "create");

    React.useEffect(() => {
        if (mode === "edit" && initialData && !initialized && (gradesList.length > 0 || !initialData.grade_id)) {
            setFormData(mapQuestionToForm(initialData, gradesList));
            setInitialized(true);
        }
    }, [mode, initialData, gradesList, initialized]);

    const { data: chapters = [] } = useChapters(formData.subject_id || undefined) as any;
    const chaptersList: any[] = Array.isArray(chapters) ? chapters : [];

    const insertMedia = (field: "content" | "explanation") => (md: string) => {
        setFormData((prev) => ({ ...prev, [field]: prev[field] + "\n" + md + "\n" }));
    };

    const handleOptionChange = (index: number, field: "content" | "correct", value: any) => {
        const newOpts = [...formData.options];
        if (!newOpts[index]) return;
        if (field === "correct") {
            if (formData.question_type === "SINGLE_CHOICE") {
                newOpts.forEach((o, i) => (o.correct = i === index));
            } else {
                newOpts[index].correct = Boolean(value);
            }
        } else {
            newOpts[index].content = String(value);
        }
        setFormData({ ...formData, options: newOpts });
    };

    const addOptionRow = () => {
        const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
        const nextLabel = labels[formData.options.length] || `Opsi ${formData.options.length + 1}`;
        setFormData({
            ...formData,
            options: [...formData.options, { label: nextLabel, content: "", correct: false }],
        });
    };

    const removeOptionRow = (index: number) => {
        if (formData.options.length <= 2) return;
        setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject_id) {
            alert("Silakan pilih Mata Pelajaran");
            return;
        }
        if (!formData.content.trim()) {
            alert("Teks Soal tidak boleh kosong");
            return;
        }
        onSubmit(buildQuestionPayload(formData));
    };

    const correctLabel = formData.options.find((o) => o.correct)?.label || "—";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Card className="p-5 space-y-4">
                    <h3 className="text-sm font-extrabold border-b pb-2">Informasi Soal</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Jenjang</label>
                            <select
                                value={formData.level_id || ""}
                                onChange={(e) => {
                                    const levelId = e.target.value;
                                    setFormData({ ...formData, level_id: levelId, grade_id: "", subject_id: "", chapter_id: "" });
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Semua Jenjang --</option>
                                {levelsList.map((l: any) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Kelas</label>
                            <select
                                value={formData.grade_id || ""}
                                onChange={(e) => {
                                    setFormData({ ...formData, grade_id: e.target.value, subject_id: "", chapter_id: "" });
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Semua Kelas --</option>
                                {gradesList
                                    .filter((g: any) => !formData.level_id || g.education_level_id === formData.level_id)
                                    .map((g: any) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Mata Pelajaran *</label>
                            <select
                                value={formData.subject_id}
                                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value, chapter_id: "" })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Pilih Mata Pelajaran --</option>
                                {subjectsList
                                    .filter((s: any) => !formData.level_id || s.level_id === formData.level_id)
                                    .map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.level_code || "?"})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Bab / Chapter (Opsional)</label>
                        <select
                            value={formData.chapter_id}
                            onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                        >
                            <option value="">-- Tanpa Bab --</option>
                            {chaptersList.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Tipe Soal</label>
                            <select
                                value={formData.question_type}
                                onChange={(e) => {
                                    const qtype = e.target.value;
                                    const isMulti = qtype === "MULTIPLE_CHOICE";
                                    const opts = formData.options.map((o, i) => ({ ...o, correct: isMulti ? false : i === 0 }));
                                    setFormData({ ...formData, question_type: qtype, options: opts });
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="SINGLE_CHOICE">SINGLE_CHOICE (Pilihan Ganda)</option>
                                <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE (PG Kompleks)</option>
                                <option value="TRUE_FALSE">TRUE_FALSE (Benar / Salah)</option>
                                <option value="ESSAY">ESSAY (Uraian)</option>
                                <option value="SHORT_ANSWER">SHORT_ANSWER (Jawaban Singkat)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Kesulitan</label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="EASY">EASY (Mudah)</option>
                                <option value="MEDIUM">MEDIUM (Sedang)</option>
                                <option value="HARD">HARD (Sulit)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Teks Soal *</label>
                        <div className="flex gap-2">
                            <textarea
                                rows={5}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Tulis soal di sini. Mendukung Markdown, LaTeX ($...$), dan gambar markdown."
                                className="flex-1 p-3 text-xs rounded-xl border bg-background font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <MediaPicker onInsert={insertMedia("content")} entityType="QUESTION" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-muted-foreground">Pilihan Jawaban</label>
                            {formData.question_type !== "TRUE_FALSE" && (
                                <Button type="button" variant="outline" size="sm" onClick={addOptionRow} className="text-[11px]">
                                    + Tambah Opsi
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {formData.question_type === "TRUE_FALSE"
                                ? ["Benar", "Salah"].map((tf, tfIdx) => (
                                      <div key={tf} className="flex items-center gap-2">
                                          <input
                                              type="radio"
                                              name="tf-correct"
                                              checked={formData.options[tfIdx]?.correct}
                                              onChange={() => {
                                                  const options = [
                                                      { label: "A", content: "Benar", correct: tfIdx === 0 },
                                                      { label: "B", content: "Salah", correct: tfIdx === 1 },
                                                  ];
                                                  setFormData({ ...formData, options });
                                              }}
                                              className="h-4 w-4 cursor-pointer"
                                          />
                                          <span className={`font-bold text-xs w-5 ${tfIdx === 0 ? "text-success" : "text-destructive"}`}>
                                              {tf === "Benar" ? "A" : "B"}.
                                          </span>
                                          <span className={`text-xs font-semibold ${tfIdx === 0 ? "text-success" : "text-destructive"}`}>{tf}</span>
                                          {formData.options[tfIdx]?.correct && <Badge variant="success" className="text-[9px]">Kunci</Badge>}
                                      </div>
                                  ))
                                : formData.options.map((opt, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                          <input
                                              type={formData.question_type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                                              name="correct-opt"
                                              checked={opt.correct}
                                              onChange={() => handleOptionChange(i, "correct", !opt.correct)}
                                              className="h-4 w-4 cursor-pointer"
                                              aria-label={`Kunci ${opt.label}`}
                                          />
                                          <span className="font-bold text-xs w-5 shrink-0">{opt.label}.</span>
                                          <input
                                              type="text"
                                              value={opt.content}
                                              onChange={(e) => handleOptionChange(i, "content", e.target.value)}
                                              placeholder={`Opsi ${opt.label}`}
                                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border bg-background min-w-0"
                                              aria-label={`Opsi ${opt.label}`}
                                          />
                                          {formData.options.length > 2 && (
                                              <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeOptionRow(i)}
                                                  className="text-rose-500 h-7 w-7 p-0"
                                              >
                                                  &times;
                                              </Button>
                                          )}
                                      </div>
                                  ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Pembahasan Soal</label>
                        <div className="flex gap-2">
                            <textarea
                                rows={3}
                                value={formData.explanation}
                                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                className="flex-1 p-3 text-xs rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <MediaPicker onInsert={insertMedia("explanation")} entityType="QUESTION" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Skor</label>
                            <input
                                type="number"
                                step="0.1"
                                min={0}
                                value={formData.score}
                                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Skor Negatif</label>
                            <input
                                type="number"
                                step="0.1"
                                min={0}
                                value={formData.negative_score}
                                onChange={(e) => setFormData({ ...formData, negative_score: Number(e.target.value) })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            />
                        </div>
                    </div>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={onCancel}>Batal</Button>
                    <Button type="submit" size="sm" disabled={isSubmitting} className="font-bold">
                        {isSubmitting ? "Menyimpan..." : submitLabel}
                    </Button>
                </div>
            </form>

            <aside className="space-y-4 lg:sticky lg:top-6">
                <Card className="p-5 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Pratinjau Live</span>
                        <span className="text-[10px] text-muted-foreground">KaTeX & Markdown</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {formData.subject_id && (
                            <Badge variant="default" className="text-[10px]">
                                {subjectsList.find((s) => s.id === formData.subject_id)?.name || "Mapel"}
                            </Badge>
                        )}
                        {formData.grade_id && (
                            <Badge variant="secondary" className="text-[10px]">
                                {gradesList.find((g) => g.id === formData.grade_id)?.name}
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">{formData.difficulty}</Badge>
                        <Badge variant="outline" className="text-[10px]">{formData.question_type}</Badge>
                    </div>

                    <div className="rounded-lg bg-muted/40 border p-3 min-h-[80px]">
                        <MathKaTeXPreview content={formData.content || "(teks soal akan tampil di sini)"} />
                    </div>

                    <div className="space-y-1.5">
                        {formData.question_type === "TRUE_FALSE" ? (
                            ["Benar", "Salah"].map((tf, tfIdx) => (
                                <div
                                    key={tf}
                                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${formData.options[tfIdx]?.correct
                                        ? "border-emerald-400 bg-emerald-50"
                                        : "border-border bg-card"}`}
                                >
                                    <span className={`font-bold shrink-0 ${formData.options[tfIdx]?.correct ? "text-emerald-600" : "text-muted-foreground"}`}>
                                        {tf === "Benar" ? "A" : "B"}.
                                    </span>
                                    <span className="flex-1">{tf}</span>
                                    {formData.options[tfIdx]?.correct && <Badge variant="success" className="text-[9px]">Kunci</Badge>}
                                </div>
                            ))
                        ) : (
                            formData.options.map((opt, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${opt.correct
                                        ? "border-emerald-400 bg-emerald-50"
                                        : "border-border bg-card"}`}
                                >
                                    <span className={`font-bold shrink-0 ${opt.correct ? "text-emerald-600" : "text-muted-foreground"}`}>
                                        {opt.label}.
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <MathKaTeXPreview content={opt.content || "(kosong)"} />
                                    </div>
                                    {opt.correct && <Badge variant="success" className="text-[9px] shrink-0">Kunci</Badge>}
                                </div>
                            ))
                        )}
                    </div>

                    {formData.explanation && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                            <span className="text-[10px] font-bold text-amber-700 block mb-1">Pembahasan:</span>
                            <MathKaTeXPreview content={formData.explanation} />
                        </div>
                    )}

                    <div className="text-[10px] text-muted-foreground border-t pt-2">
                        Kunci saat ini: <b>{correctLabel}</b> • {formData.options.length} opsi
                    </div>
                </Card>
            </aside>
        </div>
    );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0, no errors.

---

### Task 4: `MaterialFormSection` component

**Files:**
- Create: `frontend/components/admin/MaterialFormSection.tsx`

**Interfaces:**
- Consumes: `emptyMaterialForm`, `mapMaterialToForm` from `@/lib/material-form-utils` (Task 2); hooks `useSubjects`, `useChapters`, `useTopics`, `apiFetch` from `@/lib/api`; `MediaPicker`.
- Produces: `MaterialFormSection({ mode, initialData?, submitLabel?, isSubmitting?, onSubmit, onCancel })`. Used by Task 11 & Task 12.

- [ ] **Step 1: Create the component**

Transfers the current material create/edit `Dialog` form (from `admin/materials/page.tsx` lines 431–617) into a full-width form. Fields: Judul, Mata Pelajaran (labelled `name (level_code)`), Bab (+ inline create bab), Sub Topik (+ inline create topik), Estimasi Waktu, Status, Isi Konten + MediaPicker (uses `textareaRef` for cursor insertion).

```tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MediaPicker from "@/components/media-picker";
import {
    useSubjects,
    useChapters,
    useTopics,
    apiFetch,
} from "@/lib/api";
import {
    emptyMaterialForm,
    mapMaterialToForm,
    type MaterialFormData,
} from "@/lib/material-form-utils";

interface MaterialFormSectionProps {
    mode: "create" | "edit";
    initialData?: any;
    submitLabel?: string;
    isSubmitting?: boolean;
    onSubmit: (formData: MaterialFormData) => void;
    onCancel: () => void;
}

export function MaterialFormSection({
    mode,
    initialData,
    submitLabel = "Simpan Modul",
    isSubmitting = false,
    onSubmit,
    onCancel,
}: MaterialFormSectionProps) {
    const [formData, setFormData] = React.useState<MaterialFormData>(
        initialData ? mapMaterialToForm(initialData) : emptyMaterialForm()
    );

    const { data: subjects = [] } = useSubjects() as any;
    const { data: allChapters = [] } = useChapters() as any;
    const { data: topics = [], refetch: refetchTopics } = useTopics(formData.chapter_id) as any;

    const [showNewChapter, setShowNewChapter] = React.useState(false);
    const [newChapterName, setNewChapterName] = React.useState("");
    const [showNewTopic, setShowNewTopic] = React.useState(false);
    const [newTopicName, setNewTopicName] = React.useState("");
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const insertMedia = (html: string) => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const text = textareaRef.current.value;
            textareaRef.current.value = text.substring(0, start) + html + text.substring(end);
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + html.length;
            textareaRef.current.focus();
            setFormData((prev) => ({ ...prev, content: textareaRef.current!.value }));
        }
    };

    const handleCreateChapter = async () => {
        if (!newChapterName.trim() || !formData.subject_id) return;
        try {
            const res: any = await apiFetch("/academic/chapters", {
                method: "POST",
                body: JSON.stringify({ subject_id: formData.subject_id, name: newChapterName.trim() }),
            });
            setFormData((prev) => ({ ...prev, chapter_id: res?.id || res?.chapter_id || "" }));
            setNewChapterName("");
            setShowNewChapter(false);
            refetchTopics();
        } catch {
            alert("Gagal membuat bab baru");
        }
    };

    const handleCreateTopic = async () => {
        if (!newTopicName.trim() || !formData.chapter_id) return;
        try {
            const res: any = await apiFetch("/academic/topics", {
                method: "POST",
                body: JSON.stringify({ chapter_id: formData.chapter_id, name: newTopicName.trim() }),
            });
            setFormData((prev) => ({ ...prev, topic_id: res?.id || res?.topic_id || "" }));
            setNewTopicName("");
            setShowNewTopic(false);
            refetchTopics();
        } catch {
            alert("Gagal membuat sub topik baru");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
            <Card className="p-6 space-y-4">
                <h3 className="text-sm font-extrabold border-b pb-2">Detail Modul Pembelajaran</h3>

                <div>
                    <label className="font-semibold block mb-1 text-xs">Judul Modul Materi *</label>
                    <input
                        type="text"
                        required
                        placeholder="Contoh: Hukum II Newton & Dinamika Gerak"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="font-semibold block mb-1 text-xs">Mata Pelajaran *</label>
                        <select
                            value={formData.subject_id}
                            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value, chapter_id: "", topic_id: "" })}
                            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                        >
                            <option value="">-- Pilih Mata Pelajaran --</option>
                            {Array.isArray(subjects) && subjects.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.level_code || "?"})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="font-semibold block mb-1 text-xs">Bab / Chapter</label>
                        <div className="flex gap-2">
                            <select
                                value={formData.chapter_id}
                                onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value, topic_id: "" })}
                                className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground"
                            >
                                <option value="">-- Pilih Bab --</option>
                                {Array.isArray(allChapters) && allChapters
                                    .filter((ch: any) => !formData.subject_id || ch.subject_id === formData.subject_id)
                                    .map((ch: any) => (
                                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                                    ))}
                            </select>
                            {formData.subject_id && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowNewChapter(!showNewChapter)}
                                    className="shrink-0 text-xs cursor-pointer"
                                >
                                    + Bab
                                </Button>
                            )}
                        </div>
                        {showNewChapter && (
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nama bab baru..."
                                    value={newChapterName}
                                    onChange={(e) => setNewChapterName(e.target.value)}
                                    className="flex-1 px-3 py-1.5 text-xs border rounded-lg bg-background"
                                    autoFocus
                                />
                                <Button type="button" size="sm" onClick={handleCreateChapter} className="text-xs cursor-pointer">Simpan</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowNewChapter(false); setNewChapterName(""); }} className="text-xs cursor-pointer">Batal</Button>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="font-semibold block mb-1 text-xs">Sub Topik (Opsional)</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.topic_id}
                            onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground"
                        >
                            <option value="">-- Pilih Sub Topik --</option>
                            {Array.isArray(topics) && topics.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        {formData.chapter_id && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowNewTopic(!showNewTopic)}
                                className="shrink-0 text-xs cursor-pointer"
                            >
                                + Sub Topik
                            </Button>
                        )}
                    </div>
                    {showNewTopic && (
                        <div className="mt-2 flex gap-2">
                            <input
                                type="text"
                                placeholder="Nama sub topik baru..."
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs border rounded-lg bg-background"
                                autoFocus
                            />
                            <Button type="button" size="sm" onClick={handleCreateTopic} className="text-xs cursor-pointer">Simpan</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowNewTopic(false); setNewTopicName(""); }} className="text-xs cursor-pointer">Batal</Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="font-semibold block mb-1 text-xs">Estimasi Waktu Belajar (Menit)</label>
                        <input
                            type="number"
                            min={1}
                            value={formData.estimated_duration}
                            onChange={(e) => setFormData({ ...formData, estimated_duration: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg bg-background"
                        />
                    </div>

                    <div>
                        <label className="font-semibold block mb-1 text-xs">Status Publikasi</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                        >
                            <option value="PUBLISHED">PUBLISHED (Dapat Diakses Siswa)</option>
                            <option value="DRAFT">DRAFT (Dalam Penyusunan)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="font-semibold block mb-1 text-xs">Isi & Ringkasan Modul Materi *</label>
                    <div className="flex gap-2">
                        <textarea
                            ref={textareaRef}
                            rows={8}
                            required
                            placeholder="Tuliskan materi pembelajaran lengkap, formula LaTeX, atau catatan penting..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="flex-1 px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none font-mono text-xs"
                        />
                        <MediaPicker onInsert={insertMedia} />
                    </div>
                </div>
            </Card>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={onCancel} className="cursor-pointer">Batal</Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="font-bold cursor-pointer">
                    {isSubmitting ? "Menyimpan..." : submitLabel}
                </Button>
            </div>
        </form>
    );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 5: Refactor `AIPDFImportModal` to support inline section mode

**Files:**
- Modify: `frontend/components/admin/AIPDFImportModal.tsx` (already a large client component; keep all logic, change wrapper only)

**Interfaces:**
- Consumes: existing internal state/logic. 
- Produces: `AIPDFImportModal` now accepts optional `variant: "modal" | "section"` (default `"modal"`) and `onClose?`. In `"section"` mode it renders as an inline Card (no overlay, no fixed positioning) with an inline submit button when in the staging tab. Used by Task 9.

- [ ] **Step 1: Add `variant` prop and conditional wrapper**

Change the props interface (lines 161–167) to:

```tsx
interface AIPDFImportModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    subjectsList: any[];
    chaptersList: any[];
    onSuccessImport: () => void;
    variant?: "modal" | "section";
}
```

Change the function signature destructuring to add `variant = "modal"`.

Change `modalProps` (lines 593–598) so the submit label/onSubmit still computes, and add a section footer. Replace the single return wrapper (lines 606–607 `<AdminActionModal {...modalProps}>` and line 1214 `</AdminActionModal>`) with a conditional:

```tsx
    const modalProps: any = {
        isOpen,
        onClose,
        title: "Import Soal via AI PDF / Gambar / Excel",
        description: "Ekstrak otomatis teks soal, pilihan A-E, rumus LaTeX, dan pembahasan dari berkas dokumen.",
    };

    if (activeTab === "staging") {
        modalProps.submitLabel = `Simpan ${stagingQuestions.length} Soal ke Database`;
        modalProps.onSubmit = handleCommitToDatabase;
        modalProps.disabled = isSubmitting;
    }

    if (variant === "section") {
        return (
            <Card className="p-5 space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                    <div>
                        <h3 className="text-base font-extrabold tracking-tight">{modalProps.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{modalProps.description}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                        <Sparkles className="mr-1 h-3 w-3" /> Multi-Modal AI Engine
                    </Badge>
                </div>

                {/* <InnerContent/> — the existing inner JSX (from the tabs nav through the content and katex drawer), minus the max-h wrapper */}
                <div className="flex justify-end gap-3 border-t pt-4">
                    {modalProps.onSubmit ? (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setActiveTab("upload")} className="text-xs">
                                Re-upload
                            </Button>
                            <Button
                                size="sm"
                                disabled={modalProps.disabled}
                                onClick={modalProps.onSubmit}
                                className="text-xs font-bold shadow-md shadow-primary/20"
                            >
                                {modalProps.submitLabel}
                            </Button>
                        </>
                    ) : (
                        <span className="text-[11px] text-muted-foreground">
                            Unggah atau paste teks untuk memulai — hasil ekstraksi dapat diedit sebelum disimpan.
                        </span>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <AdminActionModal {...modalProps}>
            <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                {/* existing inner JSX unchanged */}
            </div>
        </AdminActionModal>
    );
```

Implementation note: to avoid duplicating ~600 lines of inner JSX, extract the inner content (nav tabs + config panel + tab bodies + katex drawer, everything currently between `<div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">` and its closing tag) into a local `const innerContent = (...)` JSX variable defined before the `return`, then render `{innerContent}` in both branches. In `"section"` mode wrap with `<Card className="p-5 space-y-6">` instead of the scroll-limited div (or keep `max-h` off). Ensure the fixed-position KaTeX drawer still works in both modes.

- [ ] **Step 2: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 6: `BulkImportSection` component (Excel/CSV)

**Files:**
- Create: `frontend/components/admin/BulkImportSection.tsx`

**Interfaces:**
- Consumes: `useSubjects`, `apiFetch` from `@/lib/api`; `StagingQuestionCard`; XLSX dynamic import.
- Produces: `BulkImportSection({ onSuccessImport })`. Used by Task 9.

- [ ] **Step 1: Create the component**

Move the Excel/CSV bulk-import logic from `admin/question-bank/page.tsx` (state `importFile`, `parsedImportRows`, `importing`, `importResult`; handlers `handleFileUpload`, `handleUpdateImportRow`, `handleRemoveImportRow`, `handleExecuteBulkImport`, `handleDownloadTemplate`) into this component. Render: template-download banner, file dropzone, results alert, editable `StagingQuestionCard` preview list, and a submit button (disabled when no rows).

```tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StagingQuestionCard } from "@/components/admin/StagingQuestionCard";
import { useSubjects, apiFetch } from "@/lib/api";
import { CheckCircle2, Download, FileSpreadsheet } from "lucide-react";

interface BulkImportSectionProps {
    onSuccessImport?: () => void;
}

export function BulkImportSection({ onSuccessImport }: BulkImportSectionProps) {
    const { data: subjects = [] } = useSubjects() as any;
    const subjectsList: any[] = Array.isArray(subjects) ? subjects : [];

    const [importFile, setImportFile] = React.useState<File | null>(null);
    const [parsedImportRows, setParsedImportRows] = React.useState<any[]>([]);
    const [importing, setImporting] = React.useState(false);
    const [importResult, setImportResult] = React.useState<{ created: number; failed: number; errors: string[] } | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFile(file);
        setImportResult(null);

        const XLSX = await import("xlsx");
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                if (!wsname) return;
                const ws = wb.Sheets[wsname];
                if (!ws) return;
                const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
                if (rawRows.length === 0) {
                    alert("File spreadsheet kosong!");
                    return;
                }
                const defaultSubjectId = subjectsList.length > 0 ? subjectsList[0].id : "";
                const mapped = rawRows.map((r: any, idx: number) => {
                    const contentBase = r["Teks Soal"] || r["soal"] || r["content"] || r["Question"] || "";
                    const imgQ = r["Gambar Soal (URL)"] || "";
                    const content = imgQ ? `${contentBase}\n\n![gambar soal](${imgQ})` : contentBase;
                    const difficulty = (r["Kesulitan"] || r["difficulty"] || "MEDIUM").toString().toUpperCase();
                    const questionType = (r["Tipe Soal"] || r["question_type"] || "SINGLE_CHOICE").toString().toUpperCase();
                    const explanationBase = r["Pembahasan"] || r["explanation"] || "";
                    const imgP = r["Gambar Pembahasan (URL)"] || "";
                    const explanation = imgP ? `${explanationBase}\n\n![gambar pembahasan](${imgP})` : explanationBase;

                    const subjInput = (r["Mata Pelajaran ID"] || r["subject_id"] || r["Mata Pelajaran"] || "").toString().trim();
                    let matchedSubjId = defaultSubjectId;
                    if (subjInput) {
                        const matchByName = subjectsList.find(
                            (s) => s.id.toLowerCase() === subjInput.toLowerCase() || s.name.toLowerCase() === subjInput.toLowerCase()
                        );
                        if (matchByName) matchedSubjId = matchByName.id;
                        else if (subjInput.length > 20) matchedSubjId = subjInput;
                    }

                    const correctOptStr = (r["Jawaban Benar"] || r["correct_option"] || r["Jawaban"] || "A").toString().toUpperCase().trim();
                    const labels = ["A", "B", "C", "D", "E"];
                    const optText = [r["Opsi A"], r["Opsi B"], r["Opsi C"], r["Opsi D"], r["Opsi E"]];
                    const optImg = [r["Gambar A (URL)"], r["Gambar B (URL)"], r["Gambar C (URL)"], r["Gambar D (URL)"], r["Gambar E (URL)"]];
                    const optionsList: any[] = [];
                    labels.forEach((label, i) => {
                        const text = optText[i] || "";
                        const img = optImg[i] || "";
                        if (!text && !img) return;
                        const content = img ? `${text} ![gambar](${img})` : text;
                        optionsList.push({ label, content, is_correct: correctOptStr.includes(label) || correctOptStr === String(i + 1) });
                    });

                    return {
                        rowNum: idx + 2,
                        content: String(content),
                        difficulty: ["EASY", "MEDIUM", "HARD"].includes(difficulty) ? difficulty : "MEDIUM",
                        question_type: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "ESSAY", "SHORT_ANSWER"].includes(questionType) ? questionType : "SINGLE_CHOICE",
                        subject_id: matchedSubjId,
                        explanation: String(explanation),
                        options: optionsList,
                        score: parseFloat(r["Skor"]) || 1,
                        negative_score: parseFloat(r["Skor Negatif"]) || 0,
                        estimated_time: parseInt(r["Estimasi Waktu (detik)"]) || 60,
                        bloom_level: r["Level Kognitif"] || undefined,
                        source: r["Sumber"] || undefined,
                    };
                });
                setParsedImportRows(mapped);
            } catch (err) {
                console.error("Failed to parse file:", err);
                alert("Format file tidak valid. Harap unggah file .xlsx, .xls, atau .csv");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleUpdateImportRow = (idx: number, updated: any) => {
        setParsedImportRows((prev) => prev.map((r, i) => (i === idx ? updated : r)));
    };

    const handleRemoveImportRow = (idx: number) => {
        setParsedImportRows((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleExecuteBulkImport = async () => {
        if (parsedImportRows.length === 0) return;
        setImporting(true);
        setImportResult(null);
        try {
            const res: any = await apiFetch("/questions/import", {
                method: "POST",
                body: JSON.stringify(parsedImportRows),
            });
            setImportResult(res);
            onSuccessImport?.();
        } catch (err: any) {
            alert("Gagal melakukan import: " + (err.message || err));
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        const XLSX = await import("xlsx");
        const sampleSubj = subjectsList.length > 0 ? subjectsList[0].name : "Penalaran Umum";
        const sampleSubjId = subjectsList.length > 0 ? subjectsList[0].id : "UUID-SUBJECT-ID";
        const sampleData = [
            {
                "Tipe Soal": "SINGLE_CHOICE",
                "Teks Soal": "Berapakah hasil dari 2^3 + 4^2?",
                "Gambar Soal (URL)": "",
                "Mata Pelajaran": sampleSubj,
                "Mata Pelajaran ID": sampleSubjId,
                "Bab ID": "",
                "Topik ID": "",
                "Kesulitan": "MEDIUM",
                "Level Kognitif": "C3",
                "Skor": 1,
                "Skor Negatif": 0,
                "Estimasi Waktu (detik)": 60,
                "Sumber": "MANUAL",
                "Opsi A": "20",
                "Gambar A (URL)": "",
                "Opsi B": "24",
                "Gambar B (URL)": "",
                "Opsi C": "28",
                "Gambar C (URL)": "",
                "Opsi D": "32",
                "Gambar D (URL)": "",
                "Opsi E": "36",
                "Gambar E (URL)": "",
                "Jawaban Benar": "B",
                "Pembahasan": "2^3 = 8 dan 4^2 = 16. Maka 8 + 16 = 24.",
                "Gambar Pembahasan (URL)": "",
            },
        ];
        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Bank Soal");
        XLSX.writeFile(wb, "Template_Import_Bank_Soal_YakinLulus.xlsx");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-emerald-50/60 border-emerald-200">
                <div>
                    <span className="text-xs font-bold text-emerald-900 block">Belum punya format file?</span>
                    <span className="text-[11px] text-emerald-700">Unduh sampel template Excel resmi YakinLulus.id.</span>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="text-xs font-bold text-emerald-800 border-emerald-300 bg-white hover:bg-emerald-100"
                >
                    <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Download Template
                </Button>
            </div>

            <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Pilih File Spreadsheet (.xlsx, .xls, .csv) — pratinjau bisa diedit sebelum import
                </label>
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-background cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
            </div>

            {importResult && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${importResult.failed === 0 ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                    <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Import Selesai: {importResult.created} berhasil dibuat, {importResult.failed} gagal.
                    </p>
                    {importResult.errors && importResult.errors.length > 0 && (
                        <ul className="list-disc pl-5 text-[11px] space-y-0.5 mt-1 text-rose-700">
                            {importResult.errors.map((errStr, idx) => <li key={idx}>{errStr}</li>)}
                        </ul>
                    )}
                </div>
            )}

            {parsedImportRows.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                    <span className="text-xs font-bold text-foreground block">
                        Pratinjau & Edit Data ({parsedImportRows.length} soal terdeteksi)
                    </span>
                    <div className="space-y-2">
                        {parsedImportRows.map((row, idx) => (
                            <StagingQuestionCard
                                key={row.rowNum}
                                row={row}
                                index={idx}
                                onChange={(updated) => handleUpdateImportRow(idx, updated)}
                                onDelete={() => handleRemoveImportRow(idx)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-2">
                <Button
                    size="sm"
                    disabled={parsedImportRows.length === 0 || importing}
                    onClick={handleExecuteBulkImport}
                    className="text-xs font-bold shadow-md shadow-primary/20"
                >
                    <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-200" />
                    {importing ? `Memproses Import...` : `Import ${parsedImportRows.length} Soal ke Database`}
                </Button>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 7: Question create page

**Files:**
- Create: `frontend/app/(portal)/admin/question-bank/create/page.tsx`

**Interfaces:**
- Consumes: `useCreateQuestion`; `QuestionFormSection` (Task 3).
- Produces: route `/admin/question-bank/create` that on success `router.push("/admin/question-bank")`.

- [ ] **Step 1: Create the page**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionFormSection } from "@/components/admin/QuestionFormSection";
import { useCreateQuestion } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function CreateQuestionPage() {
    const router = useRouter();
    const createQuestionMutation = useCreateQuestion();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (payload: any) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await createQuestionMutation.mutateAsync(payload);
            router.push("/admin/question-bank");
        } catch (err: any) {
            alert("Gagal membuat soal: " + (err.message || err));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/question-bank">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <Badge variant="default" className="text-[10px] font-bold">QUESTION CMS</Badge>
                        <h1 className="text-2xl font-extrabold tracking-tight">Buat Soal Baru</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Form full-width dengan pratinjau live KaTeX di samping.</p>
                    </div>
                </div>
            </div>

            <QuestionFormSection
                mode="create"
                submitLabel="Simpan Soal Baru"
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/question-bank")}
            />
        </div>
    );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 8: Question edit page

**Files:**
- Create: `frontend/app/(portal)/admin/question-bank/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `useQuestion(id)`, `useUpdateQuestion`; `QuestionFormSection` (Task 3).
- Produces: route `/admin/question-bank/[id]/edit`. On success `router.push("/admin/question-bank")`.

- [ ] **Step 1: Create the page**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionFormSection } from "@/components/admin/QuestionFormSection";
import { useQuestion, useUpdateQuestion } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function EditQuestionPage() {
    const params = useParams();
    const id = String(params.id || "");
    const router = useRouter();
    const { data: question, isLoading } = useQuestion(id) as any;
    const updateQuestionMutation = useUpdateQuestion();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (payload: any) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await updateQuestionMutation.mutateAsync({ id, data: payload });
            router.push("/admin/question-bank");
        } catch (err: any) {
            alert("Gagal memperbarui soal: " + (err.message || err));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/question-bank">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <Badge variant="default" className="text-[10px] font-bold">QUESTION CMS</Badge>
                        <h1 className="text-2xl font-extrabold tracking-tight">Edit Soal {question ? `Q-${String(question.id || "").substring(0, 8)}` : ""}</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Perbarui soal dan pratinjau hasilnya secara live.</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="p-12 text-center text-xs text-muted-foreground">Memuat data soal...</div>
            ) : question ? (
                <QuestionFormSection
                    mode="edit"
                    initialData={question}
                    submitLabel="Simpan Perubahan"
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/admin/question-bank")}
                />
            ) : (
                <div className="p-12 text-center text-xs text-muted-foreground">Soal tidak ditemukan.</div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 9: Question import page

**Files:**
- Create: `frontend/app/(portal)/admin/question-bank/import/page.tsx`

**Interfaces:**
- Consumes: `useSubjects`, `useChapters`, `useQuestions`; `AIPDFImportModal` (Task 5, `variant="section"`); `BulkImportSection` (Task 6).
- Produces: route `/admin/question-bank/import` with Section A (AI PDF/Gambar/Paste) and Section B (Excel/CSV).

- [ ] **Step 1: Create the page**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AIPDFImportModal } from "@/components/admin/AIPDFImportModal";
import { BulkImportSection } from "@/components/admin/BulkImportSection";
import { useSubjects, useChapters, useQuestions } from "@/lib/api";
import { ArrowLeft, Sparkles, FileSpreadsheet } from "lucide-react";

export default function QuestionImportPage() {
    const { data: subjects = [] } = useSubjects() as any;
    const subjectsList: any[] = Array.isArray(subjects) ? subjects : [];
    const { data: chapters = [] } = useChapters() as any;
    const chaptersList: any[] = Array.isArray(chapters) ? chapters : [];
    const { refetch } = useQuestions() as any;

    return (
        <div className="space-y-8 p-6 pb-16">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/question-bank">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <Badge variant="default" className="text-[10px] font-bold">IMPORT ENGINE</Badge>
                        <h1 className="text-2xl font-extrabold tracking-tight">Import Soal Massal</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">AI PDF / Gambar / Paste Teks, atau dari spreadsheet Excel / CSV.</p>
                    </div>
                </div>
            </div>

            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <h2 className="text-base font-extrabold">AI PDF / Gambar / Paste Teks</h2>
                </div>
                <AIPDFImportModal
                    variant="section"
                    subjectsList={subjectsList}
                    chaptersList={chaptersList}
                    onSuccessImport={() => refetch()}
                />
            </section>

            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-base font-extrabold">Excel / CSV Bulk Import</h2>
                </div>
                <Card className="p-5">
                    <BulkImportSection onSuccessImport={() => refetch()} />
                </Card>
            </section>
        </div>
    );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 10: Refactor question-bank list page to use Links

**Files:**
- Modify: `frontend/app/(portal)/admin/question-bank/page.tsx`

- [ ] **Step 1: Remove create/edit/bulk/ai-import modal logic**

Remove (and any now-unused imports): `AdminActionModal` for create/edit/bulk (keep for delete/FSM/KaTeX), `AIPDFImportModal`, `MediaPicker`, `StagingQuestionCard`, `useCreateQuestion`, `useUpdateQuestion`, `useChapters`, `Plus` usage in modal. Delete state: `isCreateModalOpen`, `isEditModalOpen`, `isBulkModalOpen`, `isAiImportModalOpen`, `formData`, `activeQuestion` stays (delete/FSM/KaTeX), `importFile`, `parsedImportRows`, `importing`, `importResult`, `newTargetStatus` stays. Delete handlers: `handleOpenCreate`, `handleOpenEdit`, `handleCreateSubmit`, `handleEditSubmit`, `handleUpdateImportRow`, `handleRemoveImportRow`, `handleFileUpload`, `handleExecuteBulkImport`, `handleDownloadTemplate`, `handleOptionChange`, `addOptionRow`, `removeOptionRow`, `insertMedia`. Delete the `useChapters(formData.subject_id)` query and `chaptersList`. Remove the CREATE/EDIT/BULK/AI modals from JSX (lines ~953–1455, 1515–1522).

- [ ] **Step 2: Change toolbar buttons to Links**

Replace the three toolbar buttons (lines 667–692) with:

```tsx
                <div className="flex items-center gap-2">
                    <Link href="/admin/question-bank/import">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-semibold border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Import Soal
                        </Button>
                    </Link>
                    <Link href="/admin/question-bank/create">
                        <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Buat Soal Baru
                        </Button>
                    </Link>
                </div>
```

- [ ] **Step 3: Change Edit button to a Link**

Replace the Edit `Button` (lines 922–929) with:

```tsx
                                        <Link href={`/admin/question-bank/${q.id}/edit`}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-[11px] h-8 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                                            >
                                                <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                                            </Button>
                                        </Link>
```

- [ ] **Step 4: Clean up imports**

Ensure `Link` is imported from `next/link`; keep `AdminActionModal`, `useDeleteQuestion`, `useQuestions`, `useSubjects`, `useGrades`, `useLevels`, `apiFetch` (still used by FSM), `useLevels` (still used? if not, remove). Remove `useCreateQuestion`, `useUpdateQuestion`, `useChapters`, `MediaPicker`, `StagingQuestionCard`, `AIPDFImportModal`, `FileSpreadsheet`/`Sparkles` only if now unused (Sparkles was only on the AI import button — remove). Verify no unused imports remain.

- [ ] **Step 5: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 11: Material create page

**Files:**
- Create: `frontend/app/(portal)/admin/materials/create/page.tsx`

**Interfaces:**
- Consumes: `useCreateMaterial`; `MaterialFormSection` (Task 4).
- Produces: route `/admin/materials/create`. On success `router.push("/admin/materials")`.

- [ ] **Step 1: Create the page**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaterialFormSection } from "@/components/admin/MaterialFormSection";
import { useCreateMaterial } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function CreateMaterialPage() {
    const router = useRouter();
    const createMutation = useCreateMaterial();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (formData: any) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await createMutation.mutateAsync(formData);
            router.push("/admin/materials");
        } catch (err: any) {
            alert(err?.message || "Gagal menyimpan materi");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/materials">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <Badge variant="default" className="text-[10px] font-bold">MATERIAL CMS</Badge>
                        <h1 className="text-2xl font-extrabold tracking-tight">Tambah Modul Pembelajaran Baru</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Form full-width untuk konten materi yang panjang dan mudah direview.</p>
                    </div>
                </div>
            </div>

            <MaterialFormSection
                mode="create"
                submitLabel="Simpan Modul"
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/materials")}
            />
        </div>
    );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 12: Material edit page

**Files:**
- Create: `frontend/app/(portal)/admin/materials/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `useMaterial(id)`, `useUpdateMaterial`; `MaterialFormSection` (Task 4).
- Produces: route `/admin/materials/[id]/edit`. On success `router.push("/admin/materials")`.

- [ ] **Step 1: Create the page**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaterialFormSection } from "@/components/admin/MaterialFormSection";
import { useMaterial, useUpdateMaterial } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function EditMaterialPage() {
    const params = useParams();
    const id = String(params.id || "");
    const router = useRouter();
    const { data: material, isLoading } = useMaterial(id) as any;
    const updateMutation = useUpdateMaterial();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (formData: any) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await updateMutation.mutateAsync({ id, data: formData });
            router.push("/admin/materials");
        } catch (err: any) {
            alert(err?.message || "Gagal menyimpan materi");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/materials">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <Badge variant="default" className="text-[10px] font-bold">MATERIAL CMS</Badge>
                        <h1 className="text-2xl font-extrabold tracking-tight">Edit Modul Pembelajaran</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Perbarui konten materi pembelajaran.</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="p-12 text-center text-xs text-muted-foreground">Memuat materi...</div>
            ) : material ? (
                <MaterialFormSection
                    mode="edit"
                    initialData={material}
                    submitLabel="Simpan Perubahan"
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/admin/materials")}
                />
            ) : (
                <div className="p-12 text-center text-xs text-muted-foreground">Materi tidak ditemukan.</div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 13: Refactor materials list page to use Links

**Files:**
- Modify: `frontend/app/(portal)/admin/materials/page.tsx`

- [ ] **Step 1: Remove create/edit modal logic**

Remove `Dialog` for create/edit (lines 431–617), `isCreateOpen`, `editingMaterial`, `formData`, `showNewChapter`, `newChapterName`, `showNewTopic`, `newTopicName`, `textareaRef`, `insertMedia`, `handleOpenCreate`, `handleOpenEdit`, `handleSave`, `handleCreateChapter`, `handleCreateTopic`, `useTopics`/`refetchTopics`, `createMutation`, `updateMutation`. Keep: delete/detail/AI-summary dialogs, `deletingMaterial`, `viewingMaterial`, `isAISummaryOpen`, `aiMaterial`, `aiResult`, `isGeneratingAI`, `handleDelete`, `handleTogglePublish`, `handleGenerateAISummary`, `publishMutation`, `deleteMutation`. Remove now-unused imports (`MediaPicker`, `X`, `useTopics`, `useCreateMaterial`, `useUpdateMaterial`, `Loader2` stays for AI summary/delete).

- [ ] **Step 2: Change toolbar button to a Link**

Replace the "Upload Materi Baru" `Button` (lines 254–260) with:

```tsx
                    <Link href="/admin/materials/create">
                        <Button
                            size="sm"
                            className="text-xs font-bold shadow-md shadow-primary/20 cursor-pointer"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Upload Materi Baru
                        </Button>
                    </Link>
```

- [ ] **Step 3: Change Edit button to a Link**

Replace the Edit `Button` in each material card (lines 404–412) with:

```tsx
                                            <Link href={`/admin/materials/${m.id || m.content_id}/edit`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                                                    title="Edit Modul"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
```

- [ ] **Step 4: Clean up imports**

Ensure `Link` imported from `next/link`. Remove any unused imports flagged by the type-check.

- [ ] **Step 5: Verify type-check passes**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

---

### Task 14: Full verification + manual smoke test

**Files:**
- No new files.

- [ ] **Step 1: Run full test suite**

Run: `cmd /c "npm test 2>&1"` from `frontend/`
Expected: all tests pass (existing 29 + new ~7 from Task 1 & Task 2).

- [ ] **Step 2: Run type-check**

Run: `cmd /c "npm run type-check 2>&1"` from `frontend/`
Expected: exit 0.

- [ ] **Step 3: Manual smoke test (dev server :3000)**

Log in as `admin@yakinlulus.id` / `Admin@123!`. Verify in browser:
1. `/admin/question-bank` — toolbar shows "Import Soal" and "Buat Soal Baru" as links; Edit button on each question navigates to edit page.
2. `/admin/question-bank/create` — form renders full-width with live preview; type content → preview updates; select Jenjang/Kelas/Mapel cascades; save creates a question (verify via list).
3. `/admin/question-bank/[id]/edit` — loads existing question, preview reflects current content; save updates it.
4. `/admin/question-bank/import` — Section A renders inline (no overlay); Section B uploads an `.xlsx`, shows editable `StagingQuestionCard`s, and imports.
5. `/admin/materials` — toolbar "Upload Materi Baru" links to create; Edit button links to edit page.
6. `/admin/materials/create` and `/admin/materials/[id]/edit` — full-width form saves/updates.
7. Delete/FSM/KaTeX modals on the list pages still work.

- [ ] **Step 4: Report results**

Report which smoke checks passed/failed with evidence. Fix any failures before claiming completion.

---

## Self-Review

- **Spec coverage:** 5 routes (Tasks 7, 8, 9, 11, 12) ✓; shared form sections (Tasks 3, 4) ✓; AI import inline (Task 5) ✓; Excel/CSV inline (Task 6) ✓; list pages refactored to links (Tasks 10, 13) ✓; small modals kept (Tasks 10, 13 preserve delete/FSM/KaTeX/detail/AI-summary) ✓; live preview for soal (Task 3) ✓; material fields preserved (Task 4) ✓.
- **Placeholder scan:** No TBD/TODO; every step has concrete code or an explicit inline note (the AI import inner-content extraction is described precisely).
- **Type consistency:** `QuestionFormSection`/`MaterialFormSection` props match all 4 consuming pages; `buildQuestionPayload`/`mapQuestionToForm`/`mapMaterialToForm` signatures match their tests and components.
