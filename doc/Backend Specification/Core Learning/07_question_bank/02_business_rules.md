Berikut **`07_question_bank/02_business_rules.md`**. Dokumen ini menjadi acuan seluruh validasi domain, backend service, database constraint, workflow review, AI generation, dan CBT Engine.

```markdown
# 02_business_rules.md

# Question Bank Business Rules

Version : 1.0

---

# 1. Overview

Dokumen ini mendefinisikan seluruh aturan bisnis (Business Rules) pada modul Question Bank.

Seluruh backend service, API, AI Service, Import Service, CBT Engine, dan Database Constraint wajib mengikuti aturan ini.

Business Rule memiliki prioritas lebih tinggi dibanding implementasi teknis.

---

# 2. General Principles

## BR-001

Question Bank merupakan Single Source of Truth untuk seluruh soal.

Tidak diperbolehkan membuat soal langsung dari modul CBT.

---

## BR-002

Setiap soal harus memiliki UUID permanen.

UUID tidak boleh berubah.

---

## BR-003

Question Code harus unik.

Contoh

YL-MTK-07-000001

---

## BR-004

Seluruh perubahan soal menghasilkan audit log.

Tidak ada perubahan tanpa histori.

---

## BR-005

Seluruh operasi bersifat Soft Delete.

Question tidak pernah dihapus permanen.

---

# 3. Question Creation Rules

## BR-100

Question hanya dapat dibuat oleh user yang memiliki permission:

Question.Create

---

## BR-101

Saat Question dibuat, sistem otomatis menghasilkan:

- UUID
- Question Code
- Draft Version 1
- Metadata Default
- Audit Log

---

## BR-102

Question baru selalu memiliki status:

DRAFT

---

## BR-103

Minimal memiliki:

- title
- stem
- subject
- grade
- chapter

---

## BR-104

Question belum dapat digunakan sampai status Published.

---

# 4. Question Content Rules

## BR-200

Stem tidak boleh kosong.

---

## BR-201

Question wajib memiliki minimal dua opsi.

---

## BR-202

MVP hanya mendukung:

Single Choice Question

---

## BR-203

Harus terdapat tepat satu jawaban benar.

Tidak boleh:

0 jawaban benar

atau

lebih dari satu.

---

## BR-204

Semua option harus unik.

---

## BR-205

Option kosong tidak diperbolehkan.

---

## BR-206

Penjelasan (Explanation) wajib tersedia sebelum Publish.

---

## BR-207

Jika menggunakan gambar,

Attachment harus valid.

---

# 5. Metadata Rules

## BR-300

Question wajib memiliki:

Grade

Subject

Chapter

Difficulty

Bloom Level

Source

Language

---

## BR-301

Difficulty:

Easy

Medium

Hard

---

## BR-302

Bloom Level:

Remember

Understand

Apply

Analyze

Evaluate

Create

---

## BR-303

Question harus terhubung ke Curriculum.

---

## BR-304

Question hanya boleh memiliki satu Subject utama.

---

## BR-305

Question dapat memiliki banyak Tag.

---

# 6. Version Rules

## BR-400

Setiap perubahan konten menghasilkan Version baru.

---

## BR-401

Version lama immutable.

Tidak boleh diedit.

---

## BR-402

Published Version tidak boleh diubah.

Harus membuat Version baru.

---

## BR-403

Question selalu memiliki tepat satu Current Version.

---

# 7. Review Rules

## BR-500

Question harus melalui Review sebelum Publish.

---

## BR-501

Reviewer tidak boleh sama dengan Creator.

---

## BR-502

Review Status

Pending

↓

In Review

↓

Approved

atau

Rejected

atau

Need Revision

---

## BR-503

Rejected Question tidak dapat Published.

---

## BR-504

Approved Question dapat dipublikasikan.

---

# 8. Publish Rules

## BR-600

Question hanya dapat Published jika:

✓ Metadata lengkap

✓ Option valid

✓ Answer valid

✓ Explanation tersedia

✓ Attachment valid

✓ Review Approved

---

## BR-601

Published Question bersifat Read Only.

---

## BR-602

Jika ingin mengubah Published Question:

Create New Version

---

## BR-603

Published Question langsung tersedia untuk:

CBT

Practice

Learning

Recommendation

Search

---

# 9. Archive Rules

## BR-700

Question dapat di-Archive.

---

## BR-701

Archived Question tidak muncul pada pencarian default.

---

## BR-702

Archived Question tidak dapat dipilih untuk Exam baru.

---

## BR-703

Archived Question tetap disimpan.

---

# 10. Import Rules

## BR-800

Import hanya menerima template resmi.

---

## BR-801

Setiap baris divalidasi.

---

## BR-802

Jika satu row gagal,

row lain tetap diproses.

---

## BR-803

Import menghasilkan Import Report.

---

## BR-804

Question duplikat tidak langsung dibuat.

Masuk ke Duplicate Queue.

---

# 11. Export Rules

## BR-900

Export mengikuti permission user.

---

## BR-901

Question Archived tidak ikut export default.

---

## BR-902

Export dapat berupa:

Excel

CSV

JSON

PDF

---

# 12. AI Rules

## BR-1000

AI tidak boleh langsung Publish Question.

---

## BR-1001

AI Generated Question selalu masuk Draft.

---

## BR-1002

AI wajib menghasilkan:

Question

Options

Answer

Explanation

Metadata

---

## BR-1003

Seluruh hasil AI harus direview manusia.

---

## BR-1004

AI Confidence disimpan.

---

## BR-1005

Embedding diperbarui setiap perubahan konten.

---

# 13. Search Rules

## BR-1100

Search mendukung:

Keyword

Tag

Subject

Difficulty

Bloom

Chapter

Similarity

---

## BR-1101

Default Search hanya Published.

---

## BR-1102

Draft hanya dapat dicari oleh Editor.

---

# 14. Randomization Rules

## BR-1200

Random hanya mengambil Published Question.

---

## BR-1201

Random tidak boleh memilih Question Archived.

---

## BR-1202

Question yang sama tidak boleh muncul dua kali dalam satu paket ujian.

---

## BR-1203

Random harus menghormati filter:

Subject

Chapter

Difficulty

Tag

Source

---

# 15. Similarity Rules

## BR-1300

Similarity dihitung menggunakan Embedding.

---

## BR-1301

Similarity > 95%

Masuk Duplicate Queue.

---

## BR-1302

Similarity 80–95%

Masuk Similar Candidate.

---

# 16. Security Rules

## BR-1400

Permission berbasis Role.

---

## BR-1401

Creator hanya dapat mengedit Draft miliknya.

---

## BR-1402

Reviewer tidak boleh mengubah isi Question.

---

## BR-1403

Approver tidak boleh menjadi Creator.

---

## BR-1404

Seluruh perubahan wajib dicatat Audit Log.

---

# 17. Statistics Rules

## BR-1500

Statistik diperbarui otomatis.

---

## BR-1501

Field yang dihitung:

Usage Count

Correct Rate

Wrong Rate

Average Time

Skip Count

Favorite Count

Difficulty Score

Discrimination Index

---

## BR-1502

Statistics tidak boleh diedit manual.

---

# 18. Performance Rules

## BR-1600

Search < 300 ms

---

## BR-1601

Random 100 soal < 500 ms

---

## BR-1602

Import 10.000 soal tetap dapat diproses melalui Background Job.

---

## BR-1603

Semantic Search menggunakan pgvector.

---

# 19. Integrity Rules

## BR-1700

Question wajib memiliki minimal satu Version.

---

## BR-1701

Version wajib memiliki minimal dua Option.

---

## BR-1702

Question Published wajib memiliki Explanation.

---

## BR-1703

Question Published wajib memiliki Metadata lengkap.

---

## BR-1704

Question tidak boleh orphan.

Seluruh foreign key wajib valid.

---

# 20. Future Rules

Rule berikut dipersiapkan untuk fase berikutnya:

- Multiple Correct Answer
- Essay Question
- Drag & Drop
- Coding Question
- Formula Evaluation
- Audio Question
- Video Question
- Interactive Simulation
- Adaptive Question
- IRT Calibration
- CAT Engine
- AI Auto Reviewer
- Collaborative Review
- Question Marketplace
- Multi-Curriculum Support
- Multi-Language Support
```

### Catatan Arsitektur

Dokumen ini sengaja memisahkan **Business Rules** dari implementasi teknis. Selanjutnya:

* **03_question_structure.md** akan mendefinisikan struktur data lengkap sebuah soal (stem, story passage, option, explanation, attachment, formula, dll.).
* **04_question_lifecycle.md** akan menjelaskan state machine lengkap dari `Draft → Review → Published → Archived → Restored`, termasuk transisi yang diizinkan dan event yang dipicu pada setiap perubahan state.
