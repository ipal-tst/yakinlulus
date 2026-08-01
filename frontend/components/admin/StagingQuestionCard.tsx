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
  const correctLabel = row.options.find(o => o.is_correct)?.label ?? "—";

  const update = (patch: Partial<StagingRow>) => onChange({ ...row, ...patch });
  const updateOption = (optIndex: number, patch: Partial<StagingOption>) => {
    const options = row.options.map((o, i) => (i === optIndex ? { ...o, ...patch } : o));
    update({ options });
  };
  const toggleCorrect = (optIndex: number) => {
    const options = row.options.map((o, i) => ({ ...o, is_correct: i === optIndex }));
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
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Ciutkan" : "Perluas"}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <span className="font-mono text-xs font-bold text-muted-foreground shrink-0">#{row.rowNum}</span>
        <span className="text-xs font-medium truncate flex-1 min-w-0">{row.content || "(kosong)"}</span>
        <Badge variant="outline" className="text-[10px] shrink-0">{row.difficulty}</Badge>
        <Badge variant="outline" className="text-[10px] shrink-0">{row.options.length} opsi · {correctLabel}</Badge>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 text-destructive" onClick={onDelete} aria-label="Hapus soal">
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pilihan Jawaban</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="text-[10px] h-7">
                <Plus className="mr-1 h-3 w-3" /> Tambah Opsi
              </Button>
            </div>
            <div className="space-y-1.5">
              {row.options.map((opt, optIdx) => (
                <div key={opt.label + optIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${row.rowNum}`}
                    checked={opt.is_correct}
                    onChange={() => toggleCorrect(optIdx)}
                    className="h-4 w-4 cursor-pointer"
                    aria-label={`Kunci ${opt.label}`}
                  />
                  <span className="font-bold text-xs w-5 shrink-0">{opt.label}.</span>
                  <input
                    type="text"
                    value={opt.content}
                    onChange={e => updateOption(optIdx, { content: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border bg-background min-w-0"
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

          <div className="grid grid-cols-2 gap-3">
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
        </div>
      )}
    </div>
  );
}
