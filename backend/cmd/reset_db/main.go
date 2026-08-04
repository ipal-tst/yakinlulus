package main

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"yakinlulus.id/backend/pkg/config"
	"yakinlulus.id/backend/pkg/database"
)

func main() {
	ctx := context.Background()
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	pool, err := database.NewPostgresPool(ctx, cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("1. Resetting public schema...")
	_, err = pool.Exec(ctx, "DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
	if err != nil {
		log.Fatalf("Failed to reset schema: %v", err)
	}
	log.Println("Public schema reset successfully!")

	log.Println("2. Applying database migrations (001 - 028)...")
	if err := database.AutoMigrate(ctx, pool, "migrations"); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("All migrations applied successfully!")

	log.Println("3. Seeding complete test dummy data across all tables...")

	// -------------------------------------------------------------
	// 3a. USERS & PROFILES
	// -------------------------------------------------------------
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Admin@123!"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}
	pwHash := string(hashedPassword)

	// -------------------------------------------------------------
	// 3a. EDUCATION LEVELS & GRADES
	// -------------------------------------------------------------
	sdID := uuid.MustParse("10000000-0000-0000-0000-000000000001")
	smpID := uuid.MustParse("10000000-0000-0000-0000-000000000002")
	smaID := uuid.MustParse("10000000-0000-0000-0000-000000000003")
	utbkID := uuid.MustParse("10000000-0000-0000-0000-000000000004")

	g7ID := uuid.MustParse("11000000-0000-0000-0000-000000000007")
	g8ID := uuid.MustParse("11000000-0000-0000-0000-000000000008")
	g9ID := uuid.MustParse("11000000-0000-0000-0000-000000000009")

	g10ID := uuid.MustParse("11000000-0000-0000-0000-000000000010")
	g11ID := uuid.MustParse("11000000-0000-0000-0000-000000000011")
	g12ID := uuid.MustParse("11000000-0000-0000-0000-000000000012")
	gUTBKID := uuid.MustParse("11000000-0000-0000-0000-000000000099")

	_, err = pool.Exec(ctx, `
		INSERT INTO education_levels (id, name, code, display_order)
		VALUES 
			($1, 'Sekolah Dasar', 'SD', 1),
			($2, 'Sekolah Menengah Pertama', 'SMP', 2),
			($3, 'Sekolah Menengah Atas / Kejuruan', 'SMA', 3),
			($4, 'Persiapan UTBK / Gapyear', 'UTBK_GAPYEAR', 4)
		ON CONFLICT DO NOTHING
	`, sdID, smpID, smaID, utbkID)

	_, err = pool.Exec(ctx, `
		INSERT INTO grades (id, education_level_id, name, alias, display_order)
		VALUES 
			(gen_random_uuid(), $1, 'Kelas 4 SD', '4', 1),
			(gen_random_uuid(), $1, 'Kelas 5 SD', '5', 2),
			(gen_random_uuid(), $1, 'Kelas 6 SD', '6', 3),
			($9, $2, 'Kelas 7 SMP', '7', 4),
			($10, $2, 'Kelas 8 SMP', '8', 5),
			($11, $2, 'Kelas 9 SMP', '9', 6),
			($3, $4, 'Kelas 10 SMA', '10', 7),
			($5, $4, 'Kelas 11 SMA', '11', 8),
			($6, $4, 'Kelas 12 SMA', '12', 9),
			($7, $8, 'Pejuang UTBK / Gapyear', 'UTBK', 10)
		ON CONFLICT DO NOTHING
	`, sdID, smpID, g10ID, smaID, g11ID, g12ID, gUTBKID, utbkID, g7ID, g8ID, g9ID)

	log.Println("Seeded Education Levels & Grades")

	// -------------------------------------------------------------
	// 3b. USERS
	// -------------------------------------------------------------
	adminID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	staffID := uuid.MustParse("00000000-0000-0000-0000-000000000002")
	teacherBudiID := uuid.MustParse("00000000-0000-0000-0000-000000000003")
	teacherSitiID := uuid.MustParse("00000000-0000-0000-0000-000000000004")

	student1ID := uuid.MustParse("00000000-0000-0000-0000-000000000010")
	student2ID := uuid.MustParse("00000000-0000-0000-0000-000000000011")
	student3ID := uuid.MustParse("00000000-0000-0000-0000-000000000012")
	student4ID := uuid.MustParse("00000000-0000-0000-0000-000000000013")
	student5ID := uuid.MustParse("00000000-0000-0000-0000-000000000014")

	studentBudiID := uuid.MustParse("00000000-0000-0000-0000-000000000020")
	studentBudiAlt1ID := uuid.MustParse("00000000-0000-0000-0000-000000000021")
	studentBudiAlt2ID := uuid.MustParse("00000000-0000-0000-0000-000000000022")

	usersData := []struct {
		id       uuid.UUID
		email    string
		fullName string
		role     string
		gradeID  *uuid.UUID
	}{
		{adminID, "admin@yakinlulus.id", "Super Admin YakinLulus", "ADMIN", nil},
		{staffID, "staff@yakinlulus.id", "Staf Akademik YakinLulus", "STAFF", nil},
		{teacherBudiID, "guru.budi@yakinlulus.id", "Drs. Budi Santoso, M.Pd", "TEACHER", nil},
		{teacherSitiID, "guru.siti@yakinlulus.id", "Siti Rahmawati, S.Si", "TEACHER", nil},
		{student1ID, "murid@yakinlulus.id", "Ahmad Pratama", "STUDENT", &g7ID},
		{student2ID, "student2@yakinlulus.id", "Nabila Putri", "STUDENT", &g7ID},
		{student3ID, "student3@yakinlulus.id", "Rizky Ramadhan", "STUDENT", &g8ID},
		{student4ID, "student4@yakinlulus.id", "Dewi Lestari", "STUDENT", &g9ID},
		{student5ID, "student5@yakinlulus.id", "Fikri Ardiansyah", "STUDENT", &gUTBKID},
		{studentBudiID, "budi@yakinlulus.id", "Budi Santoso (Siswa SMP)", "STUDENT", &g7ID},
		{studentBudiAlt1ID, "budi.siswa@yakinlulus.id", "Budi Santoso (Siswa SMP)", "STUDENT", &g7ID},
		{studentBudiAlt2ID, "siswa.budi@yakinlulus.id", "Budi Santoso (Siswa SMP)", "STUDENT", &g7ID},
	}

	for _, u := range usersData {
		_, err = pool.Exec(ctx, `
			INSERT INTO users (id, email, password_hash, full_name, role, grade_id, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
			ON CONFLICT (email) DO UPDATE SET grade_id = EXCLUDED.grade_id, full_name = EXCLUDED.full_name, role = EXCLUDED.role
		`, u.id, u.email, pwHash, u.fullName, u.role, u.gradeID)
		if err != nil {
			log.Fatalf("Failed to seed user %s: %v", u.email, err)
		}
	}
	log.Println("Seeded core Users with Grade assignments")

	// -------------------------------------------------------------
	// 3c. SCHOOLS
	// -------------------------------------------------------------
	school1ID := uuid.MustParse("05000000-0000-0000-0000-000000000001")
	school2ID := uuid.MustParse("05000000-0000-0000-0000-000000000002")

	_, err = pool.Exec(ctx, `
		INSERT INTO schools (id, school_name, school_code, npsn, education_level, province, regency, status, created_at, updated_at)
		VALUES 
			($1, 'SMA Negeri 1 Jakarta', 'SMAN1JKT', '20100001', 'SMA', 'DKI Jakarta', 'Jakarta Pusat', 'PUBLISHED', NOW(), NOW()),
			($2, 'SMA Negeri 8 Jakarta', 'SMAN8JKT', '20100008', 'SMA', 'DKI Jakarta', 'Jakarta Selatan', 'PUBLISHED', NOW(), NOW()),
			(gen_random_uuid(), 'SMA Negeri 3 Bandung', 'SMAN3BDG', '20200003', 'SMA', 'Jawa Barat', 'Kota Bandung', 'PUBLISHED', NOW(), NOW()),
			(gen_random_uuid(), 'SMA Negeri 1 Yogyakarta', 'SMAN1YOG', '20400001', 'SMA', 'DI Yogyakarta', 'Kota Yogyakarta', 'PUBLISHED', NOW(), NOW())
		ON CONFLICT DO NOTHING
	`, school1ID, school2ID)
	if err != nil {
		log.Fatalf("Failed to seed schools: %v", err)
	}
	log.Println("Seeded Schools data")





	log.Println("Seeded Education Levels & Grades")

	// -------------------------------------------------------------
	// 3d. CURRICULUMS & SUBJECTS
	// -------------------------------------------------------------
	curMerdekaID := uuid.MustParse("20000000-0000-0000-0000-000000000001")
	curUTBKID := uuid.MustParse("20000000-0000-0000-0000-000000000002")

	_, err = pool.Exec(ctx, `
		INSERT INTO curriculums (id, name, code, description)
		VALUES 
			($1, 'Kurikulum Merdeka', 'MERDEKA', 'Kurikulum Nasional Merdeka Belajar'),
			($2, 'UTBK SNBT 2024/2025', 'UTBK_SNBT', 'Standar Penilaian SNPMB UTBK')
		ON CONFLICT DO NOTHING
	`, curMerdekaID, curUTBKID)

	subjFisikaID := uuid.MustParse("21000000-0000-0000-0000-000000000001")
	subjPUID := uuid.MustParse("21000000-0000-0000-0000-000000000002")
	subjPKID := uuid.MustParse("21000000-0000-0000-0000-000000000003")
	subjLitEngID := uuid.MustParse("21000000-0000-0000-0000-000000000004")
	subjLitIndoID := uuid.MustParse("21000000-0000-0000-0000-000000000005")

	subjSMPMatID := uuid.MustParse("21000000-0000-0000-0000-000000000007")
	subjSMPIndoID := uuid.MustParse("21000000-0000-0000-0000-000000000008")
	subjSMPIPAID := uuid.MustParse("21000000-0000-0000-0000-000000000009")

	_, err = pool.Exec(ctx, `
		INSERT INTO subjects (id, level_id, grade_id, curriculum_id, name, code, description)
		VALUES 
			($1, $2, $3, $4, 'Fisika SMA', 'FIS-10', 'Dinamika Gerak & Hukum Fisika'),
			($5, $6, $7, $8, 'Penalaran Umum (PU)', 'PU-UTBK', 'Penalaran Induktif, Deduktif & Kuantitatif'),
			($9, $6, $7, $8, 'Penalaran Kuantitatif (PK)', 'PK-UTBK', 'Matematika Dasar & Logika Angka'),
			($10, $6, $7, $8, 'Literasi Bahasa Inggris', 'ENG-UTBK', 'Reading Comprehension & Critical Analysis'),
			($11, $6, $7, $8, 'Literasi Bahasa Indonesia', 'IND-UTBK', 'Pemahaman Wacana & Ejaan Bahasa Indonesia'),
			($12, $13, $14, $4, 'Matematika SMP', 'MAT-SMP', 'Matematika Aljabar, Geometri & Logika SMP'),
			($15, $13, $14, $4, 'Bahasa Indonesia SMP', 'IND-SMP', 'Literasi & Tatabahasa Bahasa Indonesia SMP'),
			($16, $13, $14, $4, 'IPA Terpadu SMP', 'IPA-SMP', 'Fisika, Biologi & Kimia Dasar SMP')
		ON CONFLICT DO NOTHING
	`, subjFisikaID, smaID, g10ID, curMerdekaID,
		subjPUID, utbkID, gUTBKID, curUTBKID,
		subjPKID, subjLitEngID, subjLitIndoID,
		subjSMPMatID, smpID, g7ID,
		subjSMPIndoID, subjSMPIPAID)

	log.Println("Seeded Curriculums & Subjects")

	// -------------------------------------------------------------
	// 3e. PROGRAMS (Tahun Ajaran & Program PTN)
	// -------------------------------------------------------------
	progSNBTID := uuid.MustParse("22000000-0000-0000-0000-000000000001")
	progKedinasanID := uuid.MustParse("22000000-0000-0000-0000-000000000002")
	progSIMAKID := uuid.MustParse("22000000-0000-0000-0000-000000000003")

	_, err = pool.Exec(ctx, `
		INSERT INTO academic_programs (id, code, name, academic_year, target_type, status, description, enrolled_students)
		VALUES 
			($1, 'TA-2026-SNBT', 'Super Intensive SNBT 2026', '2025/2026', 'SNBT_UTBK', 'ACTIVE', 'Bimbingan & Tryout CBT persiapan seleksi nasional berbasis tes 2026', 1250),
			($2, 'TA-2026-KED', 'Program Kedinasan & STAN 2026', '2025/2026', 'KEDINASAN', 'ACTIVE', 'Persiapan Tes SKD TWK, TIU, TKP, dan Psikotes Sekolah Kedinasan', 480),
			($3, 'TA-2026-SUI', 'Simulasi SIMAK UI & UTUL UGM', '2025/2026', 'SIMAK_UI', 'UPCOMING', 'Ujian mandiri PTN klaster papan atas dengan tingkat kesulitan tinggi', 310)
		ON CONFLICT (code) DO NOTHING
	`, progSNBTID, progKedinasanID, progSIMAKID)

	log.Println("Seeded Academic Programs")

	// -------------------------------------------------------------
	// 3f. CHAPTERS & SUB-CHAPTERS
	// -------------------------------------------------------------
	chapFisikaID := uuid.MustParse("30000000-0000-0000-0000-000000000001")
	chapPUID := uuid.MustParse("30000000-0000-0000-0000-000000000002")
	chapPKID := uuid.MustParse("30000000-0000-0000-0000-000000000003")

	_, err = pool.Exec(ctx, `
		INSERT INTO chapters (id, subject_id, grade_id, name, display_order, description)
		VALUES 
			($1, $2, $3, 'Hukum Gerak Newton & Dinamika', 1, 'Konsep gaya, massa, dan percepatan'),
			($4, $5, $6, 'Penalaran Analitis & Silogisme', 1, 'Premis logika dan inferensi wacana'),
			($7, $8, $6, 'Geometri Kesebangunan & Aritmatika', 1, 'Perhitungan denah dan persamaan kuadrat')
		ON CONFLICT DO NOTHING
	`, chapFisikaID, subjFisikaID, g10ID, chapPUID, subjPUID, gUTBKID, chapPKID, subjPKID)

	subChapFisikaID := uuid.MustParse("31000000-0000-0000-0000-000000000001")
	subChapPUID := uuid.MustParse("31000000-0000-0000-0000-000000000002")

	_, err = pool.Exec(ctx, `
		INSERT INTO sub_chapters (id, chapter_id, title, sequence, description)
		VALUES 
			($1, $2, 'Hukum II Newton pada Bidang Miring', 1, 'Analisis gaya F = m * a dan gaya gesek'),
			($3, $4, 'Penarikan Kesimpulan Premis Silogisme', 1, 'Logika Modus Ponens dan Modus Tollens')
		ON CONFLICT DO NOTHING
	`, subChapFisikaID, chapFisikaID, subChapPUID, chapPUID)

	log.Println("Seeded Chapters & Sub-Chapters")

	// -------------------------------------------------------------
	// 3f. MATERIALS & MULTI-MEDIA
	// -------------------------------------------------------------
	mat1ID := uuid.MustParse("50000000-0000-0000-0000-000000000001")
	mat2ID := uuid.MustParse("50000000-0000-0000-0000-000000000002")
	mat3ID := uuid.MustParse("50000000-0000-0000-0000-000000000003")
	mat4ID := uuid.MustParse("50000000-0000-0000-0000-000000000004")
	mat5ID := uuid.MustParse("50000000-0000-0000-0000-000000000005")
	mat6ID := uuid.MustParse("50000000-0000-0000-0000-000000000006")

	// Legacy materials table
	_, err = pool.Exec(ctx, `
		INSERT INTO materials (id, grade_id, subject_id, chapter_id, title, content, status, created_by, created_at, updated_at)
		VALUES 
			(
				$1, $2, $3, $4, 
				'Konsep Dasar Logika Induktif & Deduktif UTBK SNBT', 
				'<h3>1. Pengertian Logika Induktif vs Deduktif</h3><p>Logika induktif menarik kesimpulan dari fakta khusus ke umum. Logika deduktif menarik kesimpulan mutlak dari premis umum ke khusus.</p><h3>2. Rumus Cepat Modus Ponens & Tollens</h3><p>Modus Ponens: $P \to Q$ dan $P$ maka $Q$.</p><p>Modus Tollens: $P \to Q$ dan $\neg Q$ maka $\neg P$.</p>', 
				'PUBLISHED', $5, NOW(), NOW()
			),
			(
				$6, $2, $3, $4, 
				'Teknik Penalaran Silogisme UTBK', 
				'<h3>Metode Diagram Venn Silogisme</h3><p>Semua A adalah B. Semua B adalah C. Kesimpulan: Semua A adalah C.</p><p>Hati-hati dengan konvers: "Semua A adalah B" TIDAK BERARTI "Semua B adalah A".</p>', 
				'PUBLISHED', $5, NOW(), NOW()
			),
			(
				$7, $2, $8, $9, 
				'Persamaan Kuadrat & Geometri Kesebangunan', 
				'<h3>Formula Rumus ABC</h3><p>Persamaan kuadrat $ax^2 + bx + c = 0$ memiliki akar-akar:</p><p>$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$</p><h3>Kesebangunan Segitiga</h3><p>Dua segitiga sebangun memiliki perbandingan sisi-sisi bersesuaian yang senilai.</p>', 
				'PUBLISHED', $5, NOW(), NOW()
			),
			(
				$10, $11, $12, $13, 
				'Hukum II Newton & Dinamika Gerak Bidang Miring', 
				'<h3>Hukum II Newton</h3><p>Percepatan suatu benda berbanding lurus dengan gaya net dan berbanding terbalik dengan massanya.</p><p>$$\\vec{F}_{net} = m \\cdot \\vec{a}$$</p><p>Pada bidang miring licin bersudut $\\theta$: $a = g \\sin\\theta$.</p>', 
				'PUBLISHED', $5, NOW(), NOW()
			),
			(
				$14, $2, $15, $4, 
				'Strategi Analisis Paragraf & Ide Pokok Wacana', 
				'<h3>Langkah Menemukan Ide Pokok</h3><ol><li>Identifikasi kalimat utama di awal (deduktif) atau di akhir (induktif).</li><li>Abaikan kalimat penjelas dan contoh-contoh spesifik.</li><li>Perhatikan kata kunci yang diulang-ulang.</li></ol>', 
				'PUBLISHED', $5, NOW(), NOW()
			),
			(
				$16, $2, $17, $4, 
				'English Reading Comprehension: Inference & Main Idea', 
				'<h3>Key Strategies for TOEFL/SNBT Passages</h3><p><strong>1. Main Idea Questions:</strong> Skim the first line of each paragraph.</p><p><strong>2. Inference Questions:</strong> Look for implicit facts grounded directly in the text evidence.</p>', 
				'PUBLISHED', $5, NOW(), NOW()
			)
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			content = EXCLUDED.content,
			status = EXCLUDED.status,
			updated_at = NOW()
	`, mat1ID, gUTBKID, subjPUID, chapPUID, adminID,
		mat2ID,
		mat3ID, subjPKID, chapPKID,
		mat4ID, g10ID, subjFisikaID, chapFisikaID,
		mat5ID, subjLitIndoID,
		mat6ID, subjLitEngID)

	_, err = pool.Exec(ctx, `
		INSERT INTO material_media (id, material_id, media_type, url, caption, display_order)
		VALUES 
			(gen_random_uuid(), $1, 'IMAGE', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb', 'Diagram Gaya Bidang Miring', 1),
			(gen_random_uuid(), $1, 'VIDEO_YOUTUBE', 'https://www.youtube.com/embed/kKKM8Y-u7ds', 'Video Animasi Hukum Newton', 2)
		ON CONFLICT DO NOTHING
	`, mat4ID)

	// Unified contents & content_materials tables
	_, err = pool.Exec(ctx, `
		INSERT INTO contents (id, content_type, grade_id, subject_id, chapter_id, title, body, status, created_by, metadata, published_at, created_at, updated_at)
		VALUES
			($1, 'MATERIAL', $2, $3, $4, 'Konsep Dasar Logika Induktif & Deduktif UTBK SNBT', '<h3>1. Pengertian Logika Induktif vs Deduktif</h3><p>Logika induktif menarik kesimpulan dari fakta khusus ke umum. Logika deduktif menarik kesimpulan mutlak dari premis umum ke khusus.</p><h3>2. Rumus Cepat Modus Ponens & Tollens</h3><p>Modus Ponens: $P \to Q$ dan $P$ maka $Q$.</p><p>Modus Tollens: $P \to Q$ dan $\neg Q$ maka $\neg P$.</p>', 'PUBLISHED', $5, '{"content_format":"VIDEO","estimated_duration":18,"read_count":1420}'::jsonb, NOW(), NOW(), NOW()),
			($6, 'MATERIAL', $2, $3, $4, 'Teknik Penalaran Silogisme UTBK', '<h3>Metode Diagram Venn Silogisme</h3><p>Semua A adalah B. Semua B adalah C. Kesimpulan: Semua A adalah C.</p><p>Hati-hati dengan konvers: "Semua A adalah B" TIDAK BERARTI "Semua B adalah A".</p>', 'PUBLISHED', $5, '{"content_format":"MARKDOWN","estimated_duration":15,"read_count":890}'::jsonb, NOW(), NOW(), NOW()),
			($7, 'MATERIAL', $2, $8, $9, 'Persamaan Kuadrat & Geometri Kesebangunan', '<h3>Formula Rumus ABC</h3><p>Persamaan kuadrat $ax^2 + bx + c = 0$ memiliki akar-akar:</p><p>$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$</p><h3>Kesebangunan Segitiga</h3><p>Dua segitiga sebangun memiliki perbandingan sisi-sisi bersesuaian yang senilai.</p>', 'PUBLISHED', $5, '{"content_format":"RICH_TEXT","estimated_duration":25,"read_count":2100}'::jsonb, NOW(), NOW(), NOW()),
			($10, 'MATERIAL', $11, $12, $13, 'Hukum II Newton & Dinamika Gerak Bidang Miring', '<h3>Hukum II Newton</h3><p>Percepatan suatu benda berbanding lurus dengan gaya net dan berbanding terbalik dengan massanya.</p><p>$$\\vec{F}_{net} = m \\cdot \\vec{a}$$</p><p>Pada bidang miring licin bersudut $\\theta$: $a = g \\sin\\theta$.</p>', 'PUBLISHED', $5, '{"content_format":"VIDEO","estimated_duration":20,"read_count":3050}'::jsonb, NOW(), NOW(), NOW()),
			($14, 'MATERIAL', $2, $15, $4, 'Strategi Analisis Paragraf & Ide Pokok Wacana', '<h3>Langkah Menemukan Ide Pokok</h3><ol><li>Identifikasi kalimat utama di awal (deduktif) atau di akhir (induktif).</li><li>Abaikan kalimat penjelas dan contoh-contoh spesifik.</li><li>Perhatikan kata kunci yang diulang-ulang.</li></ol>', 'PUBLISHED', $5, '{"content_format":"TEXT","estimated_duration":12,"read_count":750}'::jsonb, NOW(), NOW(), NOW()),
			($16, 'MATERIAL', $2, $17, $4, 'English Reading Comprehension: Inference & Main Idea', '<h3>Key Strategies for TOEFL/SNBT Passages</h3><p><strong>1. Main Idea Questions:</strong> Skim the first line of each paragraph.</p><p><strong>2. Inference Questions:</strong> Look for implicit facts grounded directly in the text evidence.</p>', 'PUBLISHED', $5, '{"content_format":"PDF","estimated_duration":15,"read_count":620}'::jsonb, NOW(), NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			body = EXCLUDED.body,
			status = EXCLUDED.status,
			metadata = EXCLUDED.metadata,
			updated_at = NOW()
	`, mat1ID, gUTBKID, subjPUID, chapPUID, adminID,
		mat2ID,
		mat3ID, subjPKID, chapPKID,
		mat4ID, g10ID, subjFisikaID, chapFisikaID,
		mat5ID, subjLitIndoID,
		mat6ID, subjLitEngID)

	_, err = pool.Exec(ctx, `
		INSERT INTO content_materials (content_id, content_format, estimated_duration, read_count, is_preview, prerequisites)
		VALUES
			($1, 'VIDEO', 18, 1420, true, '[]'::jsonb),
			($2, 'MARKDOWN', 15, 890, true, '[]'::jsonb),
			($3, 'RICH_TEXT', 25, 2100, false, '[]'::jsonb),
			($4, 'VIDEO', 20, 3050, true, '[]'::jsonb),
			($5, 'TEXT', 12, 750, false, '[]'::jsonb),
			($6, 'PDF', 15, 620, false, '[]'::jsonb)
		ON CONFLICT (content_id) DO UPDATE SET
			content_format = EXCLUDED.content_format,
			estimated_duration = EXCLUDED.estimated_duration,
			read_count = EXCLUDED.read_count
	`, mat1ID, mat2ID, mat3ID, mat4ID, mat5ID, mat6ID)

	log.Println("Seeded Materials & Multi-Media")

	// -------------------------------------------------------------
	// 3g. QUESTION STIMULI & QUESTIONS (Single Choice, Multi Complex, True/False Matrix)
	// -------------------------------------------------------------
	stimulus1ID := uuid.MustParse("60000000-0000-0000-0000-000000000001")
	_, err = pool.Exec(ctx, `
		INSERT INTO question_stimuli (id, title, content_html, image_url, source, created_by)
		VALUES (
			$1, 
			'Wacana Denah Tata Ruang Rumah & Skala', 
			'<p>Perhatikan gambar denah tata ruang rumah berikut ini untuk menjawab soal nomor 1 hingga 3.</p>', 
			'https://images.unsplash.com/photo-1551836022-d5d88e9218df', 
			'Soal Model AKM & UTBK 2024', 
			$2
		)
		ON CONFLICT DO NOTHING
	`, stimulus1ID, adminID)

	q1ComplexID := uuid.MustParse("70000000-0000-0000-0000-000000000001") // Multi-Select Complex
	q2MatrixID := uuid.MustParse("70000000-0000-0000-0000-000000000002")  // True/False Matrix
	q3SingleID := uuid.MustParse("70000000-0000-0000-0000-000000000003")  // Single Choice

	// Q1: MULTIPLE CHOICE COMPLEX (Pilihan Ganda Kompleks)
	_, err = pool.Exec(ctx, `
		INSERT INTO questions (
			id, stimulus_id, subject_id, chapter_id, content, difficulty, question_type, 
			explanation, status, created_by, score, negative_score, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, 
			'Perhatikan denah rumah di bawah ini. Pilihlah lebih dari satu pernyataan yang benar berikut:', 
			'MEDIUM', 'MULTIPLE_CHOICE', 
			'Keliling halaman sebenarnya 28,5 m dan Luas Ruang Tidur 1 sebenarnya 16,25 m².', 
			'APPROVED', $5, 1.00, 0.00, NOW(), NOW()
		)
	`, q1ComplexID, stimulus1ID, subjPKID, chapPKID, adminID)

	_, err = pool.Exec(ctx, `
		INSERT INTO question_options (id, question_id, label, content, is_correct, display_order)
		VALUES 
			(gen_random_uuid(), $1, '(1)', 'Keliling halaman sebenarnya 28,5 m', true, 1),
			(gen_random_uuid(), $1, '(2)', 'Keliling garasi pada denah 13,5 cm', false, 2),
			(gen_random_uuid(), $1, '(3)', 'Luas Ruang Tidur 1 sebenarnya 16,25 m²', true, 3),
			(gen_random_uuid(), $1, '(4)', 'Luas Ruang Tidur 2 pada denah 18,56 cm²', false, 4)
	`, q1ComplexID)

	// Q2: TRUE/FALSE MATRIX (Matriks Benar/Salah)
	_, err = pool.Exec(ctx, `
		INSERT INTO questions (
			id, subject_id, chapter_id, content, difficulty, question_type, 
			explanation, status, created_by, score, negative_score, created_at, updated_at
		) VALUES (
			$1, $2, $3, 
			'Tentukan benar atau salah untuk setiap pernyataan kesebangunan berikut!', 
			'EASY', 'TRUE_FALSE', 
			'Panjang AB = 5 cm (Benar), Sudut R = 81,9° (Salah), Sudut P = 54,5° (Benar).', 
			'APPROVED', $4, 1.00, 0.00, NOW(), NOW()
		)
	`, q2MatrixID, subjPKID, chapPKID, adminID)

	_, err = pool.Exec(ctx, `
		INSERT INTO question_options (id, question_id, label, content, is_correct, display_order)
		VALUES 
			(gen_random_uuid(), $1, 'A', 'Panjang AB = 5 cm', true, 1),
			(gen_random_uuid(), $1, 'B', 'Besar ∠R = 81,9°', false, 2),
			(gen_random_uuid(), $1, 'C', 'Besar ∠P = 54,5°', true, 3)
	`, q2MatrixID)

	// Q3: SINGLE CHOICE (Pilihan Ganda Biasa)
	_, err = pool.Exec(ctx, `
		INSERT INTO questions (
			id, subject_id, chapter_id, content, difficulty, question_type, 
			explanation, status, created_by, score, negative_score, created_at, updated_at
		) VALUES (
			$1, $2, $3, 
			'Lukisan dan karton sebangun, keliling lukisan ABCD adalah ....', 
			'EASY', 'SINGLE_CHOICE', 
			'Menggunakan perbandingan kesebangunan k = 1.25, keliling = 210 cm.', 
			'APPROVED', $4, 1.00, 0.00, NOW(), NOW()
		)
	`, q3SingleID, subjPKID, chapPKID, adminID)

	_, err = pool.Exec(ctx, `
		INSERT INTO question_options (id, question_id, label, content, is_correct, display_order)
		VALUES 
			(gen_random_uuid(), $1, 'A', '210 cm', true, 1),
			(gen_random_uuid(), $1, 'B', '220 cm', false, 2),
			(gen_random_uuid(), $1, 'C', '250 cm', false, 3),
			(gen_random_uuid(), $1, 'D', '280 cm', false, 4)
	`, q3SingleID)

	// Unified contents table for questions
	_, err = pool.Exec(ctx, `
		INSERT INTO contents (id, content_type, grade_id, subject_id, chapter_id, title, body, status, created_by, metadata, published_at, created_at, updated_at)
		VALUES
			($1, 'QUESTION', $2, $3, $4, 'Perhatikan denah rumah...', 'Perhatikan denah rumah di bawah ini. Pilihlah lebih dari satu pernyataan yang benar berikut:', 'APPROVED', $5, '{"difficulty":"MEDIUM","question_type":"MULTIPLE_CHOICE"}'::jsonb, NOW(), NOW(), NOW()),
			($6, 'QUESTION', $2, $3, $4, 'Tentukan benar atau salah...', 'Tentukan benar atau salah untuk setiap pernyataan kesebangunan berikut!', 'APPROVED', $5, '{"difficulty":"EASY","question_type":"TRUE_FALSE"}'::jsonb, NOW(), NOW(), NOW()),
			($7, 'QUESTION', $2, $3, $4, 'Lukisan dan karton sebangun...', 'Lukisan dan karton sebangun, keliling lukisan ABCD adalah ....', 'APPROVED', $5, '{"difficulty":"EASY","question_type":"SINGLE_CHOICE"}'::jsonb, NOW(), NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET status = 'APPROVED'
	`, q1ComplexID, gUTBKID, subjPKID, chapPKID, adminID, q2MatrixID, q3SingleID)

	_, err = pool.Exec(ctx, `
		INSERT INTO content_questions (content_id, question_type, difficulty, score, negative_score, explanation)
		VALUES
			($1, 'MULTIPLE_CHOICE', 'MEDIUM', 1.00, 0.00, 'Keliling halaman sebenarnya 28,5 m dan Luas Ruang Tidur 1 sebenarnya 16,25 m².'),
			($2, 'TRUE_FALSE', 'EASY', 1.00, 0.00, 'Panjang AB = 5 cm (Benar), Sudut R = 81,9° (Salah), Sudut P = 54,5° (Benar).'),
			($3, 'SINGLE_CHOICE', 'EASY', 1.00, 0.00, 'Menggunakan perbandingan kesebangunan k = 1.25, keliling = 210 cm.')
		ON CONFLICT (content_id) DO NOTHING
	`, q1ComplexID, q2MatrixID, q3SingleID)

	_, err = pool.Exec(ctx, `
		INSERT INTO content_question_options (id, content_id, label, option_text, is_correct, display_order)
		VALUES 
			(gen_random_uuid(), $1, '(1)', 'Keliling halaman sebenarnya 28,5 m', true, 1),
			(gen_random_uuid(), $1, '(2)', 'Keliling garasi pada denah 13,5 cm', false, 2),
			(gen_random_uuid(), $1, '(3)', 'Luas Ruang Tidur 1 sebenarnya 16,25 m²', true, 3),
			(gen_random_uuid(), $1, '(4)', 'Luas Ruang Tidur 2 pada denah 18,56 cm²', false, 4),
			(gen_random_uuid(), $2, 'A', 'Panjang AB = 5 cm', true, 1),
			(gen_random_uuid(), $2, 'B', 'Besar ∠R = 81,9°', false, 2),
			(gen_random_uuid(), $2, 'C', 'Besar ∠P = 54,5°', true, 3),
			(gen_random_uuid(), $3, 'A', '210 cm', true, 1),
			(gen_random_uuid(), $3, 'B', '220 cm', false, 2),
			(gen_random_uuid(), $3, 'C', '250 cm', false, 3),
			(gen_random_uuid(), $3, 'D', '280 cm', false, 4)
		ON CONFLICT DO NOTHING
	`, q1ComplexID, q2MatrixID, q3SingleID)

	log.Println("Seeded Question Bank & Options (Single, Multi Complex, True/False Matrix)")

	// -------------------------------------------------------------
	// 3h. EXAMS & CBT RUNTIME
	// -------------------------------------------------------------
	exam1ID := uuid.MustParse("80000000-0000-0000-0000-000000000001")
	exam2ID := uuid.MustParse("80000000-0000-0000-0000-000000000002")
	exam3ID := uuid.MustParse("80000000-0000-0000-0000-000000000003")
	exam4ID := uuid.MustParse("80000000-0000-0000-0000-000000000004")
	examSMP1ID := uuid.MustParse("80000000-0000-0000-0000-000000000005")
	examSMP2ID := uuid.MustParse("80000000-0000-0000-0000-000000000006")
	examSMP3ID := uuid.MustParse("80000000-0000-0000-0000-000000000007")
	attempt1ID := uuid.MustParse("90000000-0000-0000-0000-000000000001")

	// Unified contents (EXAM subtype)
	_, err = pool.Exec(ctx, `
		INSERT INTO contents (id, content_type, grade_id, subject_id, chapter_id, title, body, status, created_by, metadata, published_at, created_at, updated_at)
		VALUES
			($1, 'EXAM', $5, $6, $7, 'Tryout Akbar SNBT UTBK 2026 Paket #3', 'Simulasi Tryout Akbar SNBT UTBK 2026 dengan standar soal terbaru SNPMB.', 'PUBLISHED', $8, '{"code":"TO-SNBT-2026-03","duration_minutes":195,"passing_score":680}'::jsonb, NOW(), NOW(), NOW()),
			($2, 'EXAM', $5, $6, $7, 'Simulasi Intensif Penalaran Kuantitatif #2', 'Simulasi khusus latihan cepat soal-soal Penalaran Kuantitatif.', 'PUBLISHED', $8, '{"code":"TO-TPS-KUANT-02","duration_minutes":50,"passing_score":720}'::jsonb, NOW(), NOW(), NOW()),
			($3, 'EXAM', $5, $6, $7, 'Tryout Spesialis UM UGM Kuantitatif & Logika', 'Paket latihan intensif Ujian Mandiri UGM mata uji Kemampuan Dasar.', 'DRAFT', $8, '{"code":"TO-UM-UGM-2026","duration_minutes":100,"passing_score":650}'::jsonb, NULL, NOW(), NOW()),
			($4, 'EXAM', $5, $6, $7, 'Kuis Pemetaan Diagnostik Kemampuan Awal (Pre-Test)', 'Pre-test evaluasi kemampuan awal siswa untuk menyusun rekomendasi belajar AI.', 'PUBLISHED', $8, '{"code":"TO-DIAG-INIT","duration_minutes":35,"passing_score":600}'::jsonb, NOW(), NOW(), NOW()),
			($9, 'EXAM', $10, $11, $7, 'Tryout Ujian Sekolah SMP / Asesmen Nasional SMP 2026', 'Paket Simulasi Ujian Sekolah SMP & Asesmen Nasional SMP.', 'PUBLISHED', $8, '{"code":"TO-SMP-2026-01","duration_minutes":120,"passing_score":700}'::jsonb, NOW(), NOW(), NOW()),
			($12, 'EXAM', $10, $11, $7, 'Penilaian Tengah Semester (PTS) Matematika SMP Kelas 7', 'Latihan PTS Matematika Aljabar & Geometri SMP Kelas 7.', 'PUBLISHED', $8, '{"code":"PTS-MAT-SMP7","duration_minutes":90,"passing_score":750}'::jsonb, NOW(), NOW(), NOW()),
			($13, 'EXAM', $10, $11, $7, 'Simulasi Ujian Akhir SMP IPA & Matematika', 'Simulasi Ujian Akhir SMP Terpadu IPA dan Matematika.', 'PUBLISHED', $8, '{"code":"TO-SMP-IPA-02","duration_minutes":90,"passing_score":720}'::jsonb, NOW(), NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			status = EXCLUDED.status,
			grade_id = EXCLUDED.grade_id,
			updated_at = NOW()
	`, exam1ID, exam2ID, exam3ID, exam4ID, gUTBKID, subjPKID, chapPKID, adminID, examSMP1ID, g7ID, subjSMPMatID, examSMP2ID, examSMP3ID)

	// Subtype content_exams table
	_, err = pool.Exec(ctx, `
		INSERT INTO content_exams (content_id, description, duration_minutes, passing_score, shuffle_questions, shuffle_options, max_attempts)
		VALUES
			($1, 'Tryout Akbar SNBT UTBK 2026 Paket #3', 195, 680.00, true, true, 3),
			($2, 'Simulasi Intensif Penalaran Kuantitatif #2', 50, 720.00, true, true, 5),
			($3, 'Tryout Spesialis UM UGM Kuantitatif & Logika', 100, 650.00, true, true, 3),
			($4, 'Kuis Pemetaan Diagnostik Kemampuan Awal (Pre-Test)', 35, 600.00, true, true, 1),
			($5, 'Tryout Ujian Sekolah SMP / Asesmen Nasional SMP 2026', 120, 700.00, true, true, 3),
			($6, 'Penilaian Tengah Semester (PTS) Matematika SMP Kelas 7', 90, 750.00, true, true, 5),
			($7, 'Simulasi Ujian Akhir SMP IPA & Matematika', 90, 720.00, true, true, 3)
		ON CONFLICT (content_id) DO UPDATE SET
			duration_minutes = EXCLUDED.duration_minutes,
			passing_score = EXCLUDED.passing_score
	`, exam1ID, exam2ID, exam3ID, exam4ID, examSMP1ID, examSMP2ID, examSMP3ID)

	// Link exam questions
	_, err = pool.Exec(ctx, `
		INSERT INTO content_exam_questions (id, exam_content_id, question_content_id, display_order, points)
		VALUES 
			(gen_random_uuid(), $1, $5, 1, 1.00),
			(gen_random_uuid(), $1, $6, 2, 1.00),
			(gen_random_uuid(), $1, $7, 3, 1.00),
			(gen_random_uuid(), $2, $5, 1, 1.00),
			(gen_random_uuid(), $2, $6, 2, 1.00),
			(gen_random_uuid(), $3, $5, 1, 1.00),
			(gen_random_uuid(), $3, $7, 2, 1.00),
			(gen_random_uuid(), $4, $6, 1, 1.00),
			(gen_random_uuid(), $4, $7, 2, 1.00)
		ON CONFLICT DO NOTHING
	`, exam1ID, exam2ID, exam3ID, exam4ID, q1ComplexID, q2MatrixID, q3SingleID)

	// Student Attempts
	attempt2ID := uuid.MustParse("90000000-0000-0000-0000-000000000002")
	attempt3ID := uuid.MustParse("90000000-0000-0000-0000-000000000003")

	_, err = pool.Exec(ctx, `
		INSERT INTO content_exam_attempts (
			id, exam_content_id, user_id, attempt_number, status, started_at, submitted_at, total_score
		) VALUES 
			($1, $2, $3, 1, 'SUBMITTED', NOW() - INTERVAL '2 HOURS', NOW() - INTERVAL '1 HOUR', 745.50),
			($4, $2, $5, 1, 'SUBMITTED', NOW() - INTERVAL '3 HOURS', NOW() - INTERVAL '2 HOUR', 620.00),
			($6, $2, $7, 1, 'SUBMITTED', NOW() - INTERVAL '5 HOURS', NOW() - INTERVAL '4 HOUR', 530.00)
		ON CONFLICT (id) DO NOTHING
	`, attempt1ID, exam1ID, student1ID, attempt2ID, student2ID, attempt3ID, student3ID)

	// Answer records for Item Fit & Answer Analytics
	_, err = pool.Exec(ctx, `
		INSERT INTO content_exam_attempt_answers (
			id, attempt_id, question_content_id, selected_option_ids, is_correct, score, answered_at
		) VALUES
			(gen_random_uuid(), $1, $2, '[]'::jsonb, true, 1.00, NOW()),
			(gen_random_uuid(), $1, $3, '[]'::jsonb, true, 1.00, NOW()),
			(gen_random_uuid(), $1, $4, '[]'::jsonb, true, 1.00, NOW()),
			(gen_random_uuid(), $5, $2, '[]'::jsonb, true, 1.00, NOW()),
			(gen_random_uuid(), $5, $3, '[]'::jsonb, false, 0.00, NOW()),
			(gen_random_uuid(), $6, $2, '[]'::jsonb, false, 0.00, NOW()),
			(gen_random_uuid(), $6, $4, '[]'::jsonb, true, 1.00, NOW())
		ON CONFLICT DO NOTHING
	`, attempt1ID, q1ComplexID, q2MatrixID, q3SingleID, attempt2ID, attempt3ID)

	log.Println("Seeded CBT Exam Packages, Attempts & Answer Log Records")

	// -------------------------------------------------------------
	// 3i. EXAM ANALYTICS & CUSTOM CONFIGS
	// -------------------------------------------------------------
	_, err = pool.Exec(ctx, `
		INSERT INTO exam_analytics (
			id, attempt_id, user_id, total_correct, total_wrong, total_unanswered, 
			easy_accuracy_pct, medium_accuracy_pct, hard_accuracy_pct, national_rank, created_at
		) VALUES (
			gen_random_uuid(), $1, $2, 3, 0, 0, 100.00, 100.00, 0.00, 12, NOW()
		)
		ON CONFLICT DO NOTHING
	`, attempt1ID, student1ID)

	_, err = pool.Exec(ctx, `
		INSERT INTO exam_custom_configs (
			id, user_id, title, easy_count, medium_count, hard_count, duration_minutes, created_at
		) VALUES (
			gen_random_uuid(), $1, 'Latihan Lintas Topik Mandiri', 5, 10, 5, 30, NOW()
		)
		ON CONFLICT DO NOTHING
	`, student1ID)

	log.Println("Seeded Exam Analytics & Custom Configs")

	// -------------------------------------------------------------
	// 3j. SCHOOL NAME & NOTIFICATIONS & AI TUTOR
	// -------------------------------------------------------------
	_, err = pool.Exec(ctx, `
		UPDATE users SET school_name = CASE id
			WHEN $1 THEN 'SMA Negeri 1 Jakarta'
			WHEN $2 THEN 'SMA Muhammadiyah 2 Bandung'
			WHEN $3 THEN 'SMA Cendekia Surabaya'
			ELSE school_name
		END
		WHERE id IN ($1, $2, $3)
	`, student1ID, student2ID, student3ID)
	if err != nil {
		log.Fatalf("seed school_name: %v", err)
	}

	_, err = pool.Exec(ctx, `
		INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
		VALUES 
			(gen_random_uuid(), $1, 'Selamat Datang di YakinLulus.id!', 'Akun Anda telah aktif. Mulai latihan soal UTBK sekarang.', true, NOW() - INTERVAL '1 DAY'),
			(gen_random_uuid(), $1, 'Hasil Tryout UTBK Batch 1', 'Selamat! Anda meraih nilai 85.50 dan menduduki Peringkat 12 Nasional.', false, NOW() - INTERVAL '1 HOUR')
		ON CONFLICT DO NOTHING
	`, student1ID)

	aiConvID := uuid.MustParse("09000000-0000-0000-0000-000000000001")
	_, err = pool.Exec(ctx, `
		INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at)
		VALUES ($1, $2, 'Diskusi Hukum Newton & Dinamika', NOW(), NOW())
		ON CONFLICT DO NOTHING
	`, aiConvID, student1ID)

	_, err = pool.Exec(ctx, `
		INSERT INTO ai_messages (id, conversation_id, role, content, created_at)
		VALUES 
			(gen_random_uuid(), $1, 'user', 'Bagaimana cara menentukan arah gaya gesek pada bidang miring?', NOW() - INTERVAL '10 MINS'),
			(gen_random_uuid(), $1, 'assistant', 'Gaya gesek selalu berlawanan arah dengan kecenderungan arah gerak benda. Pada bidang miring, jika benda cenderung meluncur ke bawah, gaya gesek mengarah ke atas menyusuri bidang miring.', NOW() - INTERVAL '9 MINS')
		ON CONFLICT DO NOTHING
	`, aiConvID)

	log.Println("Seeded Gamification, Notifications, & AI Tutor Conversations")

	fmt.Println("\n========================================================")
	fmt.Println("SUCCESS: All database tables seeded with complete dummy data!")
	fmt.Println("========================================================")
	fmt.Println("Default User Credentials:")
	fmt.Println("  1. Admin:   admin@yakinlulus.id   / Admin@123!")
	fmt.Println("  2. Staff:   staff@yakinlulus.id   / Admin@123!")
	fmt.Println("  3. Teacher: guru.budi@yakinlulus.id / Admin@123!")
	fmt.Println("  4. Student: murid@yakinlulus.id   / Admin@123!")
	fmt.Println("========================================================")
}
