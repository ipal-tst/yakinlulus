# Design Spec: Pratinjau Bulk Import Lengkap + Editable

## Goal

Ganti preview tabel statis pada modal Bulk Import (Excel/CSV) di halaman admin Question Bank menjadi editor kartu per soal yang lengkap, dapat diedit, mendukung insert gambar/grafik, dan menampilkan SEMUA soal (bukan hanya 10 pertama).

## Masalah Saat Ini

- Preview hanya `parsedImportRows.slice(0, 10)` + "dan N baris lainnya" — 30 soal hanya tampil 10.
- Tabel statis read-only: teks, kesulitan, jumlah opsi, kunci.
- Tidak ada cara edit sebelum import.
- Tidak ada insert gambar.

## Solusi

### 1. Tampilkan semua soal

Hapus `slice(0, 10)` dan pesan "...dan N baris lainnya". Semua `parsedImportRows` dirender sebagai daftar kartu, discroll penuh di dalam modal (`max-h` pada container, bukan pada tabel).

### 2. Komponen baru: `frontend/components/admin/StagingQuestionCard.tsx`

Editor kartu per soal, pure & reusable.

**Props:**
```ts
interface StagingQuestionCardProps {
  row: ParsedImportRow;
  index: number;
  onChange: (updated: ParsedImportRow) => void;
  onDelete: () => void;
}
```

**Layout:**
- **Header (selalu tampil):** nomor soal, ringkasan (teks terpotong), badge kesulitan, badge jumlah opsi, tombol expand/collapse, tombol hapus.
- **Badan (saat expand):**
  - Teks Soal — textarea markdown + `MathKaTeXPreview` live preview
  - Opsi A–N — tiap opsi: input teks + radio kunci jawaban (`is_correct`) + tombol hapus opsi
  - Tombol "Tambah Opsi" (label huruf lanjutan: F, G, ...)
  - Pembahasan — textarea
  - Kesulitan dropdown (EASY/MEDIUM/HARD)
  - Bloom dropdown (C1–C6)
  - Tombol "Sisipkan Gambar" → `MediaPicker` → sisip markdown `![alt](url)` ke teks soal (atau opsi/pembahasan sesuai target)

### 3. Tambah/hapus opsi

- **Hapus opsi:** tombol X per opsi. Minimum 2 opsi dipertahankan.
- **Tambah opsi:** tombol append; label = huruf alfabet berikutnya (A→F→G...). Opsi baru `{ label, content: "", is_correct: false }`.
- Saat menghapus opsi yang `is_correct`, kunci otomatis dipindah ke opsi pertama.

### 4. Insert gambar via MediaPicker

Reuse `frontend/components/media-picker.tsx` yang sudah ada:
- Upload → `/api/v1/media/upload` (Supabase Storage) → dapat `url`.
- Disisipkan sebagai markdown `![nama](url)` pada field target.
- Karena textarea biasa tidak punya kursor API yang mudah dikendalikan, sisipkan ke **akhir teks** field target yang dipilih user (dropdown "sisipkan ke: Teks Soal / Opsi A / ... / Pembahasan"), atau sisipkan ke field yang sedang fokus. Keputusan: sisip ke akhir field yang sedang aktif/fokus; fallback teks soal.

### 5. Data shape

`parsedImportRows` shape (sudah diproduksi `handleFileUpload`):
```ts
{
  rowNum: number;
  content: string;
  difficulty: string;
  question_type: string;
  subject_id: string;
  explanation: string;
  options: { label: string; content: string; is_correct: boolean }[];
  bloom_level?: string;
  source?: string;
  score?: number;
  negative_score?: number;
  estimated_time?: number;
}
```
Edit per-field mengupdate state via `onChange`. Tombol `Import N Soal` tetap mengirim `parsedImportRows` (versi terbaru) ke `POST /questions/import`.

## File yang Berubah

- **Create:** `frontend/components/admin/StagingQuestionCard.tsx`
- **Modify:** `frontend/app/(portal)/admin/question-bank/page.tsx` — ganti preview tabel dengan daftar kartu, wire `onChange`/`onDelete` ke state, hapus slice(0,10).
- **Test:** `frontend/components/admin/StagingQuestionCard.test.tsx` (jika sesuai pola; minimal helper murni diuji)

## Keamanan

- Input tervalidasi backend (`/questions/import` sudah ada, parameterized).
- Markdown dirender via `react-markdown` (XSS-safe, raw HTML tidak dirender).
- Gambar via `/api/v1/media/upload` yang butuh auth role ADMIN/STAFF/TEACHER.

## Batas & YAGNI

- Tidak ada fitur drag-reorder opsi.
- Tidak ada undo.
- Tidak menyentuh AIPDFImportModal (staging terpisah sudah ada; tidak disatukan).
