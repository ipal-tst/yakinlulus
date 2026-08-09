package main

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"

	"yakinlulus.id/backend/pkg/config"
	"yakinlulus.id/backend/pkg/database"
)

type university struct {
	Name     string
	Province string
	City     string
	MinScore int
	MaxScore int
}

func main() {
	ctx := context.Background()

	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	pool, err := database.NewPostgresPool(ctx, cfg.Database)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	universities := []university{
		{"Universitas Indonesia", "DKI Jakarta", "Depok", 520, 680},
		{"Institut Teknologi Bandung", "Jawa Barat", "Bandung", 540, 700},
		{"Universitas Gadjah Mada", "DI Yogyakarta", "Sleman", 520, 670},
		{"Institut Teknologi Sepuluh Nopember", "Jawa Timur", "Surabaya", 500, 650},
		{"Universitas Airlangga", "Jawa Timur", "Surabaya", 500, 650},
		{"Universitas Brawijaya", "Jawa Timur", "Malang", 490, 640},
		{"Universitas Diponegoro", "Jawa Tengah", "Semarang", 490, 640},
		{"Universitas Padjadjaran", "Jawa Barat", "Sumedang", 510, 660},
		{"Universitas Negeri Jakarta", "DKI Jakarta", "Jakarta Timur", 480, 630},
		{"Politeknik Negeri Jakarta", "DKI Jakarta", "Depok", 480, 620},
	}

	const academicYear = "2025/2026"
	const maxTotalScore = 700

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatalf("begin tx: %v", err)
	}
	defer tx.Rollback(ctx)

	created, skipped := 0, 0
	for _, u := range universities {
		var schoolID string
		err := tx.QueryRow(ctx,
			`SELECT id FROM academic.school WHERE name=$1 AND deleted_at IS NULL`, u.Name,
		).Scan(&schoolID)
		if err == nil {
			log.Printf("skip %s: school exists", u.Name)
			skipped++
			continue
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			log.Fatalf("check school %s: %v", u.Name, err)
		}

		if err := tx.QueryRow(ctx,
			`SELECT id FROM academic.target_school WHERE name=$1 AND deleted_at IS NULL`, u.Name,
		).Scan(new(string)); err == nil {
			log.Printf("skip %s: target_school exists", u.Name)
			skipped++
			continue
		} else if !errors.Is(err, pgx.ErrNoRows) {
			log.Fatalf("check target_school %s: %v", u.Name, err)
		}

		if err := tx.QueryRow(ctx,
			`INSERT INTO academic.school (name, education_level, province, city, is_active)
			 VALUES ($1, 'UNIVERSITY', $2, $3, true) RETURNING id`,
			u.Name, u.Province, u.City,
		).Scan(&schoolID); err != nil {
			log.Fatalf("insert school %s: %v", u.Name, err)
		}

		if _, err := tx.Exec(ctx,
			`INSERT INTO academic.target_school
				(school_id, name, level, min_score, max_score, max_total_score, subjects, academic_year, is_active)
			 VALUES ($1, $2, 'UNIVERSITY', $3, $4, $5, '[]'::jsonb, $6, true)`,
			schoolID, u.Name, u.MinScore, u.MaxScore, maxTotalScore, academicYear,
		); err != nil {
			log.Fatalf("insert target_school %s: %v", u.Name, err)
		}

		log.Printf("seeded %s (%s, %s): min %d max %d", u.Name, u.Province, u.City, u.MinScore, u.MaxScore)
		created++
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("commit: %v", err)
	}

	log.Printf("target school seed done: %d created, %d skipped", created, skipped)
	if created == 0 {
		fmt.Println("No new target schools inserted (all already exist).")
	}
}