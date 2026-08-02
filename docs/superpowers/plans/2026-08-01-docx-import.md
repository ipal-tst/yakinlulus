# Import Bank Soal dari .docx — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import soal dari file `.docx` (teks + tabel + gambar) menjadi baris staging yang bisa divalidasi lalu diimport ke database.

**Architecture:** Frontend-only. `mammoth` (JS) mengkonversi `.docx` → HTML penuh (teks, `<table>`, gambar `data:URI`). Util baru `docx-to-rows.ts` mengubah HTML → `StagingQuestionRow[]`, lalu gambar data-URI di-upload ke Supabase (`/media/upload`) dan diganti `![nama](url)` markdown. Hasil masuk tab staging yang sudah ada di `AIPDFImportModal`, user validasi/koreksi kunci → `POST /questions/import`. Tidak ada perubahan backend, tidak ada DB migration.

**Tech Stack:** TypeScript, React 19, mammoth (baru), vitest+jsdom (sudah ada), react-markdown (sudah ada), TanStack Query (sudah ada).

## Global Constraints

- Framework: Next.js 15, App Router, Tailwind v4. Ikuti pola file yang sudah ada.
- Frontend-only — JANGAN ubah `backend/` atau DB schema.
- Content soal disimpan sebagai **markdown**: gambar `![alt](url)` (URL Supabase public), tabel markdown.
- Kunci jawaban TIDAK terdeteksi otomatis — semua opsi `is_correct: false`; user set manual di staging.
- Per-soal: upload dengan `entity_type="QUESTION"`, `entity_id` dikosongkan (belum ada question id saat staging). Setiap gambar dipakai hanya di soal itu (tidak shared).
- XSS: mammoth tidak mengeksekusi makro; output dirender via `react-markdown` (raw HTML tidak dirender).
- Ukuran file max 25MB (sama seperti modal yang ada). Endpoint upload `/api/v1/media/upload` butuh auth (pakai `localStorage.token` + `Authorization: Bearer`, sama seperti `media-picker.tsx`).
- Test runner: `npm run test` (vitest), jsdom env, path alias `@` → frontend root (sudah dikonfigurasi di `vitest.config.ts`).
- Jangan tambah komentar. Ikuti style yang ada (2-space, double quotes).

---

### Task 1: Pasang mammoth + buat util `docx-to-rows.ts` (fungsi parse HTML→rows)

**Files:**
- Modify: `frontend/package.json` (tambah dependency `mammoth`)
- Create: `frontend/components/editor/docx-to-rows.ts`
- Test: `frontend/components/editor/docx-to-rows.test.ts`

**Interfaces:**
- Consumes: tidak ada (task pertama dari sisi util; `StagingQuestionRow` shape mengikuti interface yang sudah ada di `AIPDFImportModal.tsx:35`)
- Produces:
  - `interface StagingQuestionRow` — re-export shape yang sama (id, question_type, content, difficulty, bloom_level, source, subject_id, chapter_id, explanation, has_image, options `{label, option_text, is_correct}[]`)
  - `htmlToStagingRows(html: string, defaults: { source: string; subject_id: string; chapter_id: string }): StagingQuestionRow[]`
  - `renderBlockToMarkdown(el: Element): string` — konversi satu elemen block (p, table, img) ke markdown

- [ ] **Step 1: Install mammoth**

```bash
npm.cmd install mammoth
```

- [ ] **Step 2: Write the failing test**

`frontend/components/editor/docx-to-rows.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { htmlToStagingRows } from "./docx-to-rows";

const defaults = { source: "UTBK", subject_id: "subj-1", chapter_id: "" };

describe("htmlToStagingRows", () => {
  it("memecah soal berdasarkan nomor dan mendeteksi opsi A-E", () => {
    const html = `
      <h1>Bank Soal Matematika</h1>
      <p>1. Berapakah hasil dari 2 + 3?</p>
      <p>A. 5</p>
      <p>B. 6</p>
      <p>C. 7</p>
      <p>D. 8</p>
      <p>2. Manakah bilangan prima?</p>
      <p>A. 4</p>
      <p>B. 7</p>
    `;
    const rows = htmlToStagingRows(html, defaults);
    expect(rows).toHaveLength(2);
    expect(rows[0].content).toContain("Berapakah hasil dari 2 + 3?");
    expect(rows[0].options.map(o => o.label)).toEqual(["A", "B", "C", "D"]);
    expect(rows[0].options.every(o => !o.is_correct)).toBe(true);
    expect(rows[0].has_image).toBe(false);
  });

  it("mengkonversi tabel menjadi markdown table", () => {
    const html = `
      <p>1. Perhatikan tabel berikut!</p>
      <table>
        <tr><td>x</td><td>1</td><td>2</td></tr>
        <tr><td>y</td><td>3</td><td>5</td></tr>
      </table>
      <p>A. 3</p>
      <p>B. 5</p>
    `;
    const rows = htmlToStagingRows(html, defaults);
    expect(rows[0].content).toContain("| x | 1 | 2 |");
  });

  it("menyisipkan data URI gambar sebagai placeholder markdown", () => {
    const html = `
      <p>1. Perhatikan grafik:</p>
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="grafik" />
      <p>A. 1</p>
      <p>B. 2</p>
    `;
    const rows = htmlToStagingRows(html, defaults);
    expect(rows[0].content).toContain("![grafik](data:image/png;base64,");
    expect(rows[0].has_image).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm.cmd test -- components/editor/docx-to-rows.test.ts`
Expected: FAIL — `Cannot find module './docx-to-rows'`

- [ ] **Step 4: Write minimal implementation**

`frontend/components/editor/docx-to-rows.ts`:

```ts
export interface DocxOption {
  label: string;
  option_text: string;
  is_correct: boolean;
}

export interface StagingQuestionRow {
  id: string;
  question_type: string;
  content: string;
  difficulty: string;
  bloom_level: string;
  source: string;
  subject_id: string;
  chapter_id: string;
  explanation: string;
  has_image: boolean;
  options: DocxOption[];
}

interface Defaults {
  source: string;
  subject_id: string;
  chapter_id: string;
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, "\\|").trim();
}

export function renderBlockToMarkdown(el: Element): string {
  if (el.tagName === "TABLE") {
    const rows = Array.from(el.querySelectorAll("tr"));
    const lines = rows.map((tr) => {
      const cells = Array.from(tr.querySelectorAll("th,td")).map((c) => escapeCell(c.textContent || ""));
      return `| ${cells.join(" | ")} |`;
    });
    if (lines.length === 0) return "";
    const header = lines[0];
    const sep = `| ${header.split("|").slice(1, -1).map(() => "---").join(" | ")} |`;
    return [header, sep, ...lines.slice(1)].join("\n");
  }
  if (el.tagName === "IMG") {
    const src = el.getAttribute("src") || "";
    const alt = el.getAttribute("alt") || "gambar";
    return `![${alt}](${src})`;
  }
  if (el.tagName === "H1" || el.tagName === "H2") {
    return `## ${el.textContent || ""}`.trim();
  }
  return (el.textContent || "").trim();
}

function isQuestionStart(text: string): boolean {
  return /^\s*(soal\s*)?\d+[\.\)]\s+/i.test(text);
}

function stripQuestionPrefix(text: string): string {
  return text.replace(/^\s*(soal\s*)?\d+[\.\)]\s*/i, "");
}

function detectOptionLine(text: string): { label: string; text: string } | null {
  const m = text.match(/^([A-Ea-e])[\.\)]\s*(.*)/);
  if (!m) return null;
  return { label: m[1].toUpperCase(), text: m[2] };
}

export function htmlToStagingRows(html: string, defaults: Defaults): StagingQuestionRow[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: Element[] = Array.from(doc.body.children);

  const blocksByQuestion: Element[][] = [];
  let current: Element[] = [];

  for (const el of blocks) {
    const text = (el.textContent || "").trim();
    if ((el.tagName === "P" || el.tagName === "H3") && isQuestionStart(text) && current.length > 0) {
      blocksByQuestion.push(current);
      current = [];
    }
    current.push(el);
  }
  if (current.length > 0) blocksByQuestion.push(current);

  const rows: StagingQuestionRow[] = [];

  blocksByQuestion.forEach((blockEls, idx) => {
    let contentParts: string[] = [];
    let explanation = "";
    let hasImage = false;
    const options: DocxOption[] = [];

    for (const el of blockEls) {
      const text = (el.textContent || "").trim();
      if (!text) continue;

      if (el.tagName === "IMG") {
        hasImage = true;
        contentParts.push(renderBlockToMarkdown(el));
        continue;
      }
      if (el.tagName === "TABLE") {
        contentParts.push(renderBlockToMarkdown(el));
        continue;
      }

      const opt = detectOptionLine(text);
      if (opt) {
        options.push({ label: opt.label, option_text: opt.text, is_correct: false });
        continue;
      }

      const expMatch = text.match(/^(pembahasan|penjelasan|explanation)\s*:\s*(.*)/i);
      if (expMatch) {
        explanation = expMatch[2];
        continue;
      }

      if (options.length === 0) {
        contentParts.push(isQuestionStart(text) ? stripQuestionPrefix(text) : text);
      }
    }

    const content = contentParts.filter(Boolean).join("\n\n");
    if (!content && options.length === 0) return;

    rows.push({
      id: `docx-${Date.now()}-${idx}`,
      question_type: "SINGLE_CHOICE",
      content: content || `Soal ${idx + 1}`,
      difficulty: "MEDIUM",
      bloom_level: "C3",
      source: defaults.source,
      subject_id: defaults.subject_id,
      chapter_id: defaults.chapter_id,
      explanation,
      has_image: hasImage,
      options:
        options.length > 0
          ? options
          : [
              { label: "A", option_text: "", is_correct: false },
              { label: "B", option_text: "", is_correct: false },
              { label: "C", option_text: "", is_correct: false },
            ],
    });
  });

  return rows;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm.cmd test -- components/editor/docx-to-rows.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/components/editor/docx-to-rows.ts frontend/components/editor/docx-to-rows.test.ts
git commit -m "feat: add docx to staging rows parser with mammoth"
```

---

### Task 2: Fungsi konversi `.docx` file + upload gambar data-URI ke Supabase

**Files:**
- Modify: `frontend/components/editor/docx-to-rows.ts`
- Test: `frontend/components/editor/docx-to-rows.test.ts`

**Interfaces:**
- Consumes: `htmlToStagingRows` dari Task 1
- Produces:
  - `async function docxFileToHtml(file: File): Promise<string>`
  - `async function uploadDataUriImages(content: string): Promise<string>` — ganti semua `![...](data:image/...)` dengan `![...](<supabase-url>)`
  - `async function docxToStagingRows(file: File, defaults: Defaults): Promise<StagingQuestionRow[]>`

- [ ] **Step 1: Write the failing tests**

Tambahkan ke `frontend/components/editor/docx-to-rows.test.ts`:

```ts
import { uploadDataUriImages } from "./docx-to-rows";

describe("uploadDataUriImages", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { url: "https://supabase/media/abc.png" } }),
    }) as any;
    localStorage.setItem("token", "test-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengupload data URI dan mengganti dengan URL Supabase", async () => {
    const content = "Perhatikan:\n\n![gambar](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==)";
    const result = await uploadDataUriImages(content);
    expect(result).toContain("![gambar](https://supabase/media/abc.png)");
    expect(result).not.toContain("data:image");
  });

  it("tidak menyentuh konten tanpa data URI", async () => {
    const content = "Teks biasa tanpa gambar";
    const result = await uploadDataUriImages(content);
    expect(result).toBe(content);
    expect(fetch).not.toHaveBeenCalled();
  });
});
```

Perlu `vi` di import: ubah baris pertama test file menjadi `import { describe, it, expect, vi } from "vitest";`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- components/editor/docx-to-rows.test.ts`
Expected: FAIL — `uploadDataUriImages is not a function`

- [ ] **Step 3: Write implementation**

Tambahkan di `frontend/components/editor/docx-to-rows.ts`:

```ts
async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export async function docxFileToHtml(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buffer = await fileToArrayBuffer(file);
  const result = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    {
      convertImage: mammoth.images.imgElement(function (image: any) {
        return image.read("base64").then(function (imageBuffer: string) {
          return { src: "data:" + image.contentType + ";base64," + imageBuffer };
        });
      }),
    }
  );
  return result.value;
}

export async function uploadDataUriImages(content: string): Promise<string> {
  const dataUriRegex = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;
  const images: { alt: string; uri: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = dataUriRegex.exec(content)) !== null) {
    images.push({ alt: match[1], uri: match[2] });
  }
  if (images.length === 0) return content;

  const token = localStorage.getItem("token");
  let updated = content;
  for (const img of images) {
    const blob = await (await fetch(img.uri)).blob();
    const formData = new FormData();
    formData.append("file", blob, `docx-${Date.now()}-${images.indexOf(img)}.png`);
    formData.append("entity_type", "QUESTION");
    const res = await fetch("/api/v1/media/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Upload gambar gagal");
    const url = json.data?.url;
    updated = updated.replace(`![${img.alt}](${img.uri})`, `![${img.alt}](${url})`);
  }
  return updated;
}

export async function docxToStagingRows(file: File, defaults: Defaults): Promise<StagingQuestionRow[]> {
  const html = await docxFileToHtml(file);
  const rows = htmlToStagingRows(html, defaults);
  for (const row of rows) {
    if (row.has_image) {
      row.content = await uploadDataUriImages(row.content);
    }
  }
  return rows;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- components/editor/docx-to-rows.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/components/editor/docx-to-rows.ts frontend/components/editor/docx-to-rows.test.ts
git commit -m "feat: add docx to html conversion and data uri image upload"
```

---

### Task 3: Wire `.docx` ke `AIPDFImportModal`

**Files:**
- Modify: `frontend/components/admin/AIPDFImportModal.tsx`

**Interfaces:**
- Consumes: `docxToStagingRows` dari Task 2
- Produces: tidak ada (integrasi UI)

- [ ] **Step 1: Import util + perluas accept**

Di `AIPDFImportModal.tsx`, tambah import setelah import `renderPdfToPages`:

```ts
import { docxToStagingRows } from "@/components/editor/docx-to-rows";
```

Ubah `accept` pada input file (line ~840):

```tsx
accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv,.docx"
```

Ubah teks bantuan (line ~854):

```tsx
Mendukung format <b>.pdf</b>, <b>.png</b>, <b>.jpg</b>, <b>.xlsx</b>, <b>.csv</b>, dan <b>.docx</b> (Maks 25MB).
```

- [ ] **Step 2: Tambah branch parsing docx di `handleStartParsing`**

Tambahkan blok `else if` di dalam `handleStartParsing` (setelah blok spreadsheet, sebelum blok AI vision). Lokasi: setelah penutup blok `if (fileExt === "xlsx" ...)` dan sebelum `} else {` (baris ~322):

```ts
            } else if (fileExt === "docx") {
                // DOCX parsing via mammoth
                try {
                    const rows = await docxToStagingRows(file, {
                        source: globalSource,
                        subject_id: globalSubjectId,
                        chapter_id: globalChapterId,
                    });
                    if (rows.length === 0) {
                        alert("Tidak menemukan format soal di dokumen. Pastikan soal bernomor (1. atau Soal 1).");
                    }
                    setStagingQuestions(rows);
                    setActiveTab("staging");
                } catch (err: any) {
                    alert("Gagal mengurai file .docx: " + (err.message || err));
                } finally {
                    setIsParsing(false);
                }
                return;
            } else {
```

- [ ] **Step 3: Jalankan type-check**

Run: `npm.cmd run type-check`
Expected: exit 0, no errors

- [ ] **Step 4: Jalankan seluruh test suite**

Run: `npm.cmd test`
Expected: PASS — semua test (utils, MathKaTeXPreview, docx-to-rows)

- [ ] **Step 5: Build**

Run: `npm.cmd run build`
Expected: exit 0, 53 routes, "✓ Compiled successfully"

- [ ] **Step 6: Commit**

```bash
git add frontend/components/admin/AIPDFImportModal.tsx
git commit -m "feat: wire docx import into AI PDF import modal"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Task 1 parse HTML→rows (soal, opsi, tabel, gambar). Task 2 konversi file + upload gambar→URL. Task 3 integrasi UI + kunci kosong (isi manual di staging). Semua bagian spesifikasi (gambar per soal via entity_type=QUESTION, storage eksternal + markdown URL, tanpa kunci otomatis) tercakup.
- [x] **Placeholder scan:** semua langkah punya kode konkret, tidak ada TBD.
- [x] **Type consistency:** `StagingQuestionRow`, `DocxOption`, `Defaults` dipakai konsisten; `docxToStagingRows(file, defaults)` di Task 2 → dipanggil di Task 3 dengan bentuk sama.
