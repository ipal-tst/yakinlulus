# Bulk Import Preview Editable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti preview tabel statis pada modal Bulk Import (Excel/CSV) dengan editor kartu per soal yang lengkap, editable, menampilkan SEMUA soal, mendukung tambah/hapus opsi dan insert gambar via MediaPicker.

**Architecture:** Komponen baru `StagingQuestionCard` (pure, editable, reusable) + wire ke state `parsedImportRows` di halaman admin question-bank. Helper murni (tambah/hapus opsi, label lanjutan) diekstrak dan diuji TDD. Import tetap mengirim `parsedImportRows` yang sudah diedit ke `POST /questions/import` (backend tidak berubah).

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, TypeScript (strict + noUncheckedIndexedAccess), vitest+jsdom, komponen UI existing (`Card`, `Badge`, `Button`, `AdminActionModal`, `MediaPicker`, `MathKaTeXPreview`).

## Global Constraints

- Frontend-only — JANGAN ubah `backend/`, DB schema, atau `POST /questions/import`.
- Content soal = markdown; gambar sebagai `![alt](url)` (Supabase URL dari MediaPicker).
- Kunci jawaban per opsi via radio `is_correct` (SINGLE_CHOICE). Opsi baru `is_correct: false`.
- Minimum 2 opsi per soal. Hapus opsi yang `is_correct` → kunci pindah otomatis ke opsi pertama.
- XSS: markdown dirender via `MathKaTeXPreview` (react-markdown, raw HTML tidak dirender).
- Style: 2-space, double quotes, TANPA komentar. Ikuti pola file yang ada.
- tsconfig `strict` + `noUncheckedIndexedAccess` — semua kode HARUS type-check.
- Test: vitest, jsdom. Jalankan `npm.cmd test -- <file>` dan `npm.cmd run type-check`.

---
## File Structure

- **Create:** `frontend/components/admin/StagingQuestionCard.tsx` — komponen kartu + helper murni (`nextOptionLabel`, `addOption`, `removeOption`).
- **Create:** `frontend/components/admin/StagingQuestionCard.test.tsx` — unit test helper.
- **Modify:** `frontend/app/(portal)/admin/question-bank/page.tsx` — ganti preview tabel (baris ~1422-1461) dengan daftar kartu, tambah handler update/hapus state, sisip MediaPicker + MathKaTeXPreview import.

---

### Task 1: Komponen `StagingQuestionCard` + helper murni (TDD)

**Files:**
- Create: `frontend/components/admin/StagingQuestionCard.tsx`
- Test: `frontend/components/admin/StagingQuestionCard.test.tsx`

**Interfaces:**
- Produces:
  - `interface StagingOption { label: string; content: string; is_correct: boolean }`
  - `interface StagingRow { rowNum: number; content: string; difficulty: string; question_type: string; subject_id: string; explanation: string; options: StagingOption[]; bloom_level?: string; source?: string; score?: number; negative_score?: number; estimated_time?: number }`
  - `function nextOptionLabel(labels: string[]): string` — huruf alfabet berikutnya setelah label terakhir; jika melewati 'Z' throw.
  - `function addOption(options: StagingOption[]): StagingOption[]` — append `{label: nextOptionLabel, content: "", is_correct: false}`.
  - `function removeOption(options: StagingOption[], index: number): StagingOption[]` — hapus index; jika hasil < 2 return original; jika opsi yang dihapus `is_correct` dan masih ada opsi lain, set opsi[0].is_correct = true.
  - `function StagingQuestionCard(props: { row: StagingRow; index: number; onChange: (r: StagingRow) => void; onDelete: () => void }): JSX.Element`

- [ ] **Step 1: Write the failing tests**

`frontend/components/admin/StagingQuestionCard.test.tsx`:

```ts
import { describe, it, expect } from "vitest";
import { nextOptionLabel, addOption, removeOption } from "./StagingQuestionCard";

const baseOpt = (label: string, content = "", is_correct = false): any => ({ label, content, is_correct });

describe("nextOptionLabel", () => {
  it("mengembalikan huruf berikutnya setelah label terakhir", () => {
    expect(nextOptionLabel(["A", "B", "C"])).toBe("D");
  });
  it("mendukung lanjutan setelah E (F, G, ...)", () => {
    expect(nextOptionLabel(["A", "B", "C", "D", "E"])).toBe("F");
  });
  it("throw bila melewati Z", () => {
    expect(() => nextOptionLabel(["Z"])).toThrow();
  });
});

describe("addOption", () => {
  it("menambahkan opsi kosong dengan label berikutnya", () => {
    const opts = [baseOpt("A"), baseOpt("B")];
    const result = addOption(opts);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ label: "C", content: "", is_correct: false });
  });
  it("tidak mengubah opsi lama", () => {
    const opts = [baseOpt("A", "x", true), baseOpt("B")];
    const result = addOption(opts);
    expect(result[0]).toEqual(opts[0]);
    expect(result[1]).toEqual(opts[1]);
  });
});

describe("removeOption", () => {
  it("menghapus opsi di index tertentu", () => {
    const opts = [baseOpt("A"), baseOpt("B"), baseOpt("C")];
    expect(removeOption(opts, 1)).toHaveLength(2);
  });
  it("menolak penghapusan jika sisa kurang dari 2", () => {
    const opts = [baseOpt("A"), baseOpt("B")];
    expect(removeOption(opts, 1)).toEqual(opts);
  });
  it("memindahkan kunci ke opsi pertama jika opsi benar dihapus", () => {
    const opts = [baseOpt("A"), baseOpt("B"), baseOpt("C", "", true)];
    const result = removeOption(opts, 2);
    expect(result).toHaveLength(2);
    expect(result[0]!.is_correct).toBe(true);
  });
  it("tidak menyentuh kunci jika opsi salah yang dihapus", () => {
    const opts = [baseOpt("A", "", true), baseOpt("B"), baseOpt("C")];
    const result = removeOption(opts, 2);
    expect(result[0]!.is_correct).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- components/admin/StagingQuestionCard.test.tsx`
Expected: FAIL — `Cannot find module './StagingQuestionCard'`

- [ ] **Step 3: Write the helper implementation + component**

`frontend/components/admin/StagingQuestionCard.tsx`:

```ts
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
```

CATATAN: komponen React `StagingQuestionCard` ditulis di Task 2 (langkah 5 task ini hanya helper). Task 1 selesai saat helper + test hijau.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- components/admin/StagingQuestionCard.test.tsx`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/components/admin/StagingQuestionCard.tsx frontend/components/admin/StagingQuestionCard.test.tsx
git commit -m "feat: add staging question card helpers (add/remove option)"
```

---

### Task 2: Komponen React `StagingQuestionCard` (UI)

**Files:**
- Modify: `frontend/components/admin/StagingQuestionCard.tsx`

**Interfaces:**
- Consumes: `StagingRow`, `StagingOption`, `addOption`, `removeOption` dari Task 1
- Produces: `function StagingQuestionCard(props: { row: StagingRow; index: number; onChange: (r: StagingRow) => void; onDelete: () => void }): JSX.Element`
  - Props yang dipakai Task 3.

- [ ] **Step 1: Tambah import komponen UI di `StagingQuestionCard.tsx`**

Di atas `export interface StagingOption` tambahkan (file mulai dengan "use client"):

```tsx
"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Trash2, Plus, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";
import MediaPicker from "@/components/media-picker";
import { addOption, removeOption, type StagingRow } from "./StagingQuestionCard";
```

- [ ] **Step 2: Tambah komponen di akhir file**

```tsx
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
                onChange={e => update({ bloom_level: e.target.value || undefined })}
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
```

CATATAN: `relabel` menyusun ulang label A,B,C,... setelah tambah/hapus agar konsisten. `insertMedia` menerima target "content" | "explanation" | nomor index opsi.

- [ ] **Step 3: Verify type-check + tests**

Run: `npm.cmd run type-check`
Expected: 0 errors
Run: `npm.cmd test`
Expected: semua pass (existing + 8 helper tests)

- [ ] **Step 4: Commit**

```bash
git add frontend/components/admin/StagingQuestionCard.tsx
git commit -m "feat: add StagingQuestionCard editor component"
```

---

### Task 3: Wire ke halaman admin question-bank (ganti preview tabel)

**Files:**
- Modify: `frontend/app/(portal)/admin/question-bank/page.tsx` — ganti blok preview (baris ~1422-1461), tambah handler, tambah import.

**Interfaces:**
- Consumes: `StagingQuestionCard`, `StagingRow` dari Task 2
- Produces: tidak ada (integrasi UI final)

- [ ] **Step 1: Tambah import `StagingQuestionCard`**

Di `frontend/app/(portal)/admin/question-bank/page.tsx`, setelah import `MediaPicker` (baris 10), tambahkan:

```ts
import { StagingQuestionCard } from "@/components/admin/StagingQuestionCard";
```

- [ ] **Step 2: Tambah handler update/hapus row di dekat state bulk import**

Setelah deklarasi `parsedImportRows` state (baris ~122), tambahkan handler:

```ts
const handleUpdateImportRow = (idx: number, updated: any) => {
    setParsedImportRows(prev => prev.map((r, i) => (i === idx ? updated : r)));
};

const handleRemoveImportRow = (idx: number) => {
    setParsedImportRows(prev => prev.filter((_, i) => i !== idx));
};
```

- [ ] **Step 3: Ganti blok preview tabel dengan daftar kartu**

Ganti seluruh blok dari `{/* Parsed Preview Table */}` sampai penutup `)}` sebelum `</div>` (baris ~1422-1461) dengan:

```tsx
                    {/* Parsed Preview: editable question cards */}
                    {parsedImportRows.length > 0 && (
                        <div className="space-y-2 border-t pt-3">
                            <span className="text-xs font-bold text-foreground block">
                                Pratinjau & Edit Data ({parsedImportRows.length} soal terdeteksi)
                            </span>
                            <div className="max-h-[45vh] overflow-y-auto pr-1 space-y-2">
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
                            <p className="text-[10px] text-muted-foreground italic">
                                Klik soal untuk edit. Tandai kunci jawaban lewat radio, tambah/hapus opsi, sisipkan gambar, lalu Import.
                            </p>
                        </div>
                    )}
```

- [ ] **Step 4: Perbarui teks dropzone untuk menandakan bisa edit**

Di blok dropzone (baris ~1390), ubah label menjadi:

```tsx
                            Pilih File Spreadsheet (.xlsx, .xls, .csv) — pratinjau bisa diedit sebelum import
```

- [ ] **Step 5: Verify**

Run: `npm.cmd run type-check` → 0 errors
Run: `npm.cmd test` → semua pass
Run: `npm.cmd run build` → sukses, 53 routes

- [ ] **Step 6: Commit**

```bash
git add "frontend/app/(portal)/admin/question-bank/page.tsx"
git commit -m "feat: wire editable bulk import preview into question bank page"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Task 1 = helper tambah/hapus opsi + label lanjutan. Task 2 = kartu expandable (teks soal + preview, opsi A-N dengan radio kunci, tambah/hapus opsi, pembahasan, kesulitan, bloom, MediaPicker ke content/opsi/explanation). Task 3 = tampilkan SEMUA soal (hapus slice(0,10)), edit state, hapus soal. Semua bagian spec tercakup.
- [x] **Placeholder scan:** semua langkah punya kode konkret; tidak ada TBD.
- [x] **Type consistency:** `StagingRow`, `StagingOption`, `addOption`, `removeOption`, `nextOptionLabel` konsisten di ketiga task; props `StagingQuestionCard` (row/index/onChange/onDelete) dipakai Task 3 sesuai Task 2.
