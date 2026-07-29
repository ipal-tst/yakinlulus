package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"yakinlulus.id/backend/pkg/config"
)

func main() {
	ctx := context.Background()
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	pool, err := pgxpool.New(ctx, cfg.Database.URL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer pool.Close()

	type logEntry struct {
		et, ae, ar, action, desc, ent, eid, ip, sev string
		interval string
	}

	logs := []logEntry{
		{"USER_LOGIN", "admin@yakinlulus.id", "ADMIN", "LOGIN_SUCCESS", "Login berhasil oleh admin@yakinlulus.id", "", "", "103.22.14.88", "INFO", "0 hours"},
		{"USER_SUSPENDED", "admin@yakinlulus.id", "ADMIN", "SUSPEND_USER", "Akun Budi Santoso ditangguhkan karena pelanggaran", "user", "USR-004", "103.22.14.88", "WARNING", "0 hours"},
		{"SECURITY", "System Defender", "SYSTEM", "BLOCKED_BRUTE_FORCE", "Brute force terdeteksi dari IP 182.1.44.12 (15 percobaan gagal)", "", "", "182.1.44.12", "CRITICAL", "0 hours"},
		{"EXAM_PUBLISH", "guru.budi@sman8.sch.id", "TEACHER", "PUBLISH_TRYOUT", "Tryout UTBK 2026 Paket #04 dipublikasikan", "exam", "EXM-004", "36.72.190.12", "INFO", "2 hours"},
		{"API_KEY", "admin@yakinlulus.id", "ADMIN", "ROTATE_AI_KEY", "Rotasi kunci API Gemini 1.5 Flash Provider", "", "", "103.22.14.88", "INFO", "4 hours"},
		{"USER_LOGIN", "staff@yakinlulus.id", "STAFF", "LOGIN_SUCCESS", "Login berhasil oleh staff@yakinlulus.id", "", "", "103.22.14.89", "INFO", "0 hours"},
		{"USER_LOGIN", "unknown@hacker.com", "", "LOGIN_FAILED", "Percobaan login gagal untuk email tidak dikenal", "", "", "182.1.44.12", "WARNING", "0 hours"},
		{"CONTENT", "admin@yakinlulus.id", "ADMIN", "CREATE_MATERIAL", "Materi baru Konsep Dasar Logika Induktif dibuat", "material", "MAT-001", "103.22.14.88", "INFO", "3 hours"},
		{"USER_MANAGEMENT", "staff@yakinlulus.id", "STAFF", "CREATE_USER", "User baru Rudi Hartono (STUDENT) dibuat", "user", "USR-020", "103.22.14.89", "INFO", "5 hours"},
		{"SECURITY", "ahmad@yakinlulus.id", "STUDENT", "LOGIN_ABNORMAL", "Login abnormal dari lokasi tidak biasa", "", "", "45.33.22.100", "CRITICAL", "0 hours"},
	}

	for _, l := range logs {
		_, err = pool.Exec(ctx,
			`INSERT INTO audit_logs (event_type, actor_email, actor_role, action, description, entity_type, entity_id, ip_address, severity, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW() - $10::INTERVAL)`,
			l.et, l.ae, l.ar, l.action, l.desc, l.ent, l.eid, l.ip, l.sev, l.interval)
		if err != nil {
			log.Printf("Failed to insert %s: %v", l.action, err)
		}
	}
	fmt.Printf("Seeded %d audit logs\n", len(logs))
}
