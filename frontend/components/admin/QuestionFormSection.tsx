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
