package main

import (
	"context"
	"fmt"
	"log"
	"strings"

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

	log.Println("Seeding identity RBAC roles & users...")

	pwHash, err := bcrypt.GenerateFromPassword([]byte("Admin@123!"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// 1. Roles (v2 RBAC codes used by middleware/auth.go).
	roles := []struct{ code, name string }{
		{"SUPER_ADMIN", "Super Admin"},
		{"STAFF", "Staff"},
		{"FINANCE", "Finance"},
		{"GURU", "Guru"},
		{"SISWA", "Siswa"},
		{"INVESTOR", "Investor"},
	}
	for _, r := range roles {
		if _, err := pool.Exec(ctx, `
			INSERT INTO identity.role (id, code, name, is_system)
			VALUES ($1, $2, $3, true)
			ON CONFLICT (code) WHERE deleted_at IS NULL DO NOTHING`,
			uuid.New(), r.code, r.name); err != nil {
			log.Fatalf("Seed role %s: %v", r.code, err)
		}
	}
	log.Println("Roles ensured:", len(roles))

	// 2. Users.
	type seedUser struct {
		email    string
		fullName string
		role     string
	}
	users := []seedUser{
		{"admin@yakinlulus.id", "Super Admin YakinLulus", "SUPER_ADMIN"},
		{"staff@yakinlulus.id", "Staf Akademik YakinLulus", "STAFF"},
		{"finance@yakinlulus.id", "Staf Keuangan YakinLulus", "FINANCE"},
		{"guru.budi@yakinlulus.id", "Drs. Budi Santoso, M.Pd", "GURU"},
		{"guru.siti@yakinlulus.id", "Siti Rahmawati, S.Si", "GURU"},
		{"murid@yakinlulus.id", "Ahmad Pratama", "SISWA"},
	}

	for _, u := range users {
		// Skip if already exists (idempotent).
		var existing uuid.UUID
		err := pool.QueryRow(ctx,
			`SELECT id FROM identity.user WHERE email = $1 AND deleted_at IS NULL LIMIT 1`,
			u.email).Scan(&existing)
		if err == nil {
			log.Printf("Skip %s (already exists)", u.email)
			continue
		}

		id := uuid.New()
		username := strings.ToLower(strings.Split(u.email, "@")[0])

		tx, err := pool.Begin(ctx)
		if err != nil {
			log.Fatalf("Begin tx for %s: %v", u.email, err)
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO identity.user (id, username, email, password_hash, status, email_verified)
			VALUES ($1, $2, $3, $4, 'ACTIVE', true)`,
			id, username, u.email, pwHash)
		if err != nil {
			tx.Rollback(ctx)
			log.Fatalf("Seed user %s: %v", u.email, err)
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, $2)`,
			id, u.fullName)
		if err != nil {
			tx.Rollback(ctx)
			log.Fatalf("Seed profile %s: %v", u.email, err)
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO identity.user_role (user_id, role_id, is_primary)
			SELECT $1, id, true FROM identity.role WHERE code = $2`,
			id, u.role)
		if err != nil {
			tx.Rollback(ctx)
			log.Fatalf("Seed role link %s: %v", u.email, err)
		}

		if err := tx.Commit(ctx); err != nil {
			log.Fatalf("Commit %s: %v", u.email, err)
		}
		log.Printf("Seeded %s (%s -> %s)", u.email, u.fullName, u.role)
	}

	fmt.Println("Seeder completed successfully.")
}