"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Trash2, Plus, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";
import MediaPicker from "@/components/media-picker";

export interface StagingOption {
  label: string;
  content: string;
  is_correct: boolean;
}

export interface StagingRow {
  rowNum: number;
  content: string;
  difficulty: string;
  question_type: string;
  subject_id: string;
  explanation: string;
  options: StagingOption[];
  bloom_level?: string;
  source?: string;
  score?: number;
  negative_score?: number;
  estimated_time?: number;
}

export function nextOptionLabel(labels: string[]): string {
  const last = labels[labels.length - 1];
  if (!last) return "A";
  const code = last.charCodeAt(0);
  if (code >= "Z".charCodeAt(0)) throw new Error("Melebihi opsi Z");
  return String.fromCharCode(code + 1);
}

export function addOption(options: StagingOption[]): StagingOption[] {
  const next = nextOptionLabel(options.map(o => o.label));
  return [...options, { label: next, content: "", is_correct: false }];
}

export function removeOption(options: StagingOption[], index: number): StagingOption[] {
  if (options.length <= 2) return options;
  const removed = options[index];
  const rest = options.filter((_, i) => i !== index);
  if (removed?.is_correct && rest.length > 0) {
    rest[0] = { ...rest[0]!, is_correct: true };
  }
  return rest;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function relabel(options: StagingOption[]): StagingOption[] {
  return options.map((o, i) => ({ ...o, label: LETTERS[i] ?? o.label }));
}

export function StagingQuestionCard({ row, index, onChange, onDelete }: {
  row: StagingRow;
  index: number;
  onChange: (r: StagingRow) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const correctLabel = row.question_type === "TRUE_FALSE" || row.question_type === "MULTIPLE_CHOICE"
    ? (row.options.filter(o => o.is_correct).map(o => o.label).join(",") || "—")
    : (row.options.find(o => o.is_correct)?.label ?? "—");

  const update = (patch: Partial<StagingRow>) => onChange({ ...row, ...patch });
  const updateOption = (optIndex: number, patch: Partial<StagingOption>) => {
    const options = row.options.map((o, i) => (i === optIndex ? { ...o, ...patch } : o));
    update({ options });
  };
  const toggleCorrect = (optIndex: number) => {
    const isMultiple = row.question_type === "MULTIPLE_CHOICE";
    const options = row.options.map((o, i) => {
      if (i !== optIndex) return o;
      if (isMultiple) return { ...o, is_correct: !o.is_correct };
      return { ...o, is_correct: true };
    });
    update({ options });
  };
  const handleAddOption = () => update({ options: relabel(addOption(row.options)) });
  const handleRemoveOption = (optIndex: number) => update({ options: relabel(removeOption(row.options, optIndex)) });

  const insertMedia = (field: "content" | "explanation" | number) => (md: string) => {
    if (typeof field === "number") {
      updateOption(field, { content: row.options[field]!.content + "\n\n" + md });
    } else {
      update({ [field]: row[field] + "\n\n" + md } as Partial<StagingRow>);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Ciutkan" : "Perluas"}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <span className="font-mono text-xs font-bold text-muted-foreground shrink-0">#{row.rowNum}</span>
        <span className="text-xs font-medium truncate flex-1 min-w-0">{row.content || "(kosong)"}</span>
        <Badge variant="outline" className={`text-[10px] shrink-0 ${row.question_type === "MULTIPLE_CHOICE" ? "border-purple-300 text-purple-700 bg-purple-50" : row.question_type === "TRUE_FALSE" ? "border-amber-300 text-amber-700 bg-amber-50" : "border-blue-300 text-blue-700 bg-blue-50"}`}>{row.question_type === "SINGLE_CHOICE" ? "PG" : row.question_type === "MULTIPLE_CHOICE" ? "PG Kompleks" : row.question_type === "TRUE_FALSE" ? "B/S" : row.question_type}</Badge>
        <Badge variant="outline" className="text-[10px] shrink-0">{row.difficulty}</Badge>
        <Badge variant="outline" className="text-[10px] shrink-0">{row.options.length} opsi · {correctLabel}</Badge>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 text-destructive" onClick={onDelete} aria-label="Hapus soal">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <div className="p-4 pt-2 border-t border-border space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Teks Soal</label>
              <MediaPicker onInsert={insertMedia("content")} entityType="QUESTION">
                <Button type="button" variant="outline" size="sm" className="text-[10px] h-7">
                  <ImagePlus className="mr-1 h-3 w-3" /> Gambar Soal
                </Button>
              </MediaPicker>
            </div>
            <textarea
              value={row.content}
              onChange={e => update({ content: e.target.value })}
              rows={3}
              className="w-full p-2.5 text-xs rounded-xl border bg-background font-mono focus:ring-1 focus:ring-primary"
            />
            {(row.content.includes("![") || row.content.includes("$")) && (
              <div className="mt-1.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="text-[10px] font-bold text-emerald-700 block mb-1">Pratinjau Render:</span>
                <MathKaTeXPreview content={row.content} />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {row.question_type === "TRUE_FALSE"
                  ? "Pernyataan (Tabel Benar / Salah)"
                  : row.question_type === "MULTIPLE_CHOICE"
                  ? "Pilihan Jawaban (Checkbox = Kunci Jawaban Benar)"
                  : "Pilihan Jawaban (Radio Button = Kunci Jawaban Benar)"}
              </label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="text-[10px] h-7">
                <Plus className="mr-1 h-3 w-3" /> {row.question_type === "TRUE_FALSE" ? "Tambah Pernyataan" : "Tambah Opsi"}
              </Button>
            </div>
            {row.question_type === "TRUE_FALSE" ? (
              <div className="border border-sky-600/30 rounded-xl overflow-hidden bg-card shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0284C7] text-white text-xs font-bold tracking-wide">
                      <th className="p-2.5 border-r border-sky-500/30">Pernyataan</th>
                      <th className="p-2.5 w-20 text-center border-r border-sky-500/30">Benar</th>
                      <th className="p-2.5 w-20 text-center border-r border-sky-500/30">Salah</th>
                      <th className="p-2.5 w-14 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {row.options.map((opt, optIdx) => (
                      <tr key={optIdx} className="hover:bg-sky-50/20 transition-colors">
                        <td className="p-2 border-r border-border font-medium">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs w-5 shrink-0 text-muted-foreground">{opt.label || String.fromCharCode(65 + optIdx)}.</span>
                            <input
                              type="text"
                              value={opt.content}
                              onChange={e => updateOption(optIdx, { content: e.target.value })}
                              placeholder={`Pernyataan ${opt.label || optIdx + 1}`}
                              className="flex-1 px-2.5 py-1 text-xs rounded-lg border bg-background font-medium focus:ring-1 focus:ring-primary"
                            />
                            <MediaPicker onInsert={insertMedia(optIdx)} entityType="QUESTION">
                              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" aria-label={`Gambar opsi ${optIdx + 1}`}>
                                <ImagePlus className="h-3.5 w-3.5" />
                              </Button>
                            </MediaPicker>
                          </div>
                        </td>
                        <td className="p-2 text-center border-r border-border bg-emerald-50/20">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1">
                            <input
                              type="checkbox"
                              checked={opt.is_correct === true}
                              onChange={() => updateOption(optIdx, { is_correct: true })}
                              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="p-2 text-center border-r border-border bg-rose-50/20">
                          <label className="inline-flex items-center justify-center cursor-pointer p-1">
                            <input
                              type="checkbox"
                              checked={opt.is_correct === false}
                              onChange={() => updateOption(optIdx, { is_correct: false })}
                              className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            disabled={row.options.length <= 2}
                            onClick={() => handleRemoveOption(optIdx)}
                            aria-label={`Hapus opsi ${optIdx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-1.5">
                {row.options.map((opt, optIdx) => (
                  <div key={opt.label + optIdx} className="flex items-center gap-2 p-2 rounded-lg border bg-background">
                    <span className="font-bold text-xs w-5 shrink-0 text-muted-foreground">{opt.label}.</span>
                    <input
                      type="text"
                      value={opt.content}
                      onChange={e => updateOption(optIdx, { content: e.target.value })}
                      placeholder={`Opsi ${opt.label}`}
                      aria-label={`Opsi ${opt.label}`}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border bg-background min-w-0 font-medium"
                    />
                    <input
                      type={row.question_type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                      name={`correct-${row.rowNum}`}
                      checked={opt.is_correct}
                      onChange={() => toggleCorrect(optIdx)}
                      className="h-4 w-4 cursor-pointer"
                      aria-label={`Kunci ${opt.label}`}
                    />
                    <MediaPicker onInsert={insertMedia(optIdx)} entityType="QUESTION">
                      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={`Gambar opsi ${opt.label}`}>
                        <ImagePlus className="h-3.5 w-3.5" />
                      </Button>
                    </MediaPicker>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive"
                      disabled={row.options.length <= 2}
                      onClick={() => handleRemoveOption(optIdx)}
                      aria-label={`Hapus opsi ${opt.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pembahasan</label>
              <MediaPicker onInsert={insertMedia("explanation")} entityType="QUESTION">
                <Button type="button" variant="outline" size="sm" className="text-[10px] h-7">
                  <ImagePlus className="mr-1 h-3 w-3" /> Gambar Pembahasan
                </Button>
              </MediaPicker>
            </div>
            <textarea
              value={row.explanation}
              onChange={e => update({ explanation: e.target.value })}
              rows={2}
              className="w-full p-2.5 text-xs rounded-xl border bg-background font-mono focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Tipe Soal</label>
              <select
                value={row.question_type}
                onChange={e => {
                  const newType = e.target.value;
                  const patch: Partial<StagingRow> = { question_type: newType };
                  if (newType === "TRUE_FALSE") {
                    patch.options = [
                      { label: "A", content: "Benar", is_correct: true },
                      { label: "B", content: "Salah", is_correct: false },
                    ];
                  } else if (row.question_type === "TRUE_FALSE" && newType !== "TRUE_FALSE") {
                    patch.options = [
                      { label: "A", content: "", is_correct: true },
                      { label: "B", content: "", is_correct: false },
                      { label: "C", content: "", is_correct: false },
                      { label: "D", content: "", is_correct: false },
                      { label: "E", content: "", is_correct: false },
                    ];
                  }
                  update(patch);
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-background"
              >
                <option value="SINGLE_CHOICE">Pilihan Ganda (1 Jawaban)</option>
                <option value="MULTIPLE_CHOICE">Pilihan Ganda Kompleks (Multi)</option>
                <option value="TRUE_FALSE">Benar / Salah</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Kesulitan</label>
              <select
                value={row.difficulty}
                onChange={e => update({ difficulty: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-background"
              >
                {["EASY", "MEDIUM", "HARD"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Bloom</label>
              <select
                value={row.bloom_level || ""}
                onChange={e => update({ bloom_level: e.target.value || undefined } as Partial<StagingRow>)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-background"
              >
                <option value="">—</option>
                {["C1", "C2", "C3", "C4", "C5", "C6"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Preview tampilan ujian */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">Pratinjau Tampilan Ujian</span>
            <div className="rounded-lg bg-card border border-border p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">Soal No. {index + 1}</div>
              <MathKaTeXPreview content={row.content || "(soal kosong)"} />
            </div>

            {row.question_type === "TRUE_FALSE" ? (
              <div className="border border-sky-600/30 rounded-xl overflow-hidden bg-card shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0284C7] text-white text-xs md:text-sm font-bold tracking-wide">
                      <th className="p-2.5 border-r border-sky-500/30">Pernyataan</th>
                      <th className="p-2.5 w-20 text-center border-r border-sky-500/30">Benar</th>
                      <th className="p-2.5 w-20 text-center">Salah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs md:text-sm">
                    {row.options.map((opt, optIdx) => {
                      const textStartsWithNumber = /^\(\d+\)/.test((opt.content || "").trim());
                      const displayLabel = `(${opt.label && !isNaN(Number(opt.label)) ? opt.label : optIdx + 1})`;

                      return (
                        <tr key={optIdx} className="hover:bg-sky-50/20 transition-colors">
                          <td className="p-2.5 text-foreground border-r border-border font-medium leading-relaxed">
                            <div className="flex items-start gap-2">
                              {!textStartsWithNumber && (
                                <span className="font-bold text-muted-foreground shrink-0">{displayLabel}</span>
                              )}
                              <div className="flex-1 min-w-0">
                                <MathKaTeXPreview content={opt.content || "(pernyataan kosong)"} />
                              </div>
                            </div>
                          </td>
                          <td className="p-2.5 text-center border-r border-border bg-emerald-50/20">
                            <input
                              type="checkbox"
                              disabled
                              checked={opt.is_correct === true}
                              className="h-4 w-4 rounded text-emerald-600 border-emerald-400 cursor-not-allowed"
                            />
                          </td>
                          <td className="p-2.5 text-center bg-rose-50/20">
                            <input
                              type="checkbox"
                              disabled
                              checked={opt.is_correct === false}
                              className="h-4 w-4 rounded text-rose-600 border-rose-400 cursor-not-allowed"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-1.5">
                {row.options.map((opt, optIdx) => (
                  <div
                    key={opt.label + optIdx}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${opt.is_correct
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-border bg-card"}`}
                  >
                    <span className={`font-bold shrink-0 ${opt.is_correct ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {opt.label}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <MathKaTeXPreview content={opt.content || "(kosong)"} />
                    </div>
                    {opt.is_correct && (
                      <Badge variant="success" className="text-[9px] shrink-0">Kunci</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            {row.explanation && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <span className="text-[10px] font-bold text-amber-700 block mb-1">Pembahasan:</span>
                <MathKaTeXPreview content={row.explanation} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
