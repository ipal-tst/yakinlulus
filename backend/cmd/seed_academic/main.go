package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/pkg/config"
	"yakinlulus.id/backend/pkg/database"
)

type subbab struct {
	Title  string
	Tujuan []string
	Topik  []string
}

type bab struct {
	Title  string
	Subbab []subbab
}

type mapel struct {
	LevelCode string
	Code      string
	Name      string
	Bab       []bab
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

	// Education Level configs
	levels := []struct {
		Code      string
		Name      string
		SortOrder int
		Grades    []string
	}{
		{Code: "SD", Name: "Sekolah Dasar", SortOrder: 1, Grades: []string{"1", "2", "3", "4", "5", "6"}},
		{Code: "SMP", Name: "Sekolah Menengah Pertama", SortOrder: 2, Grades: []string{"7", "8", "9"}},
		{Code: "SMA", Name: "Sekolah Menengah Atas", SortOrder: 3, Grades: []string{"10", "11", "12"}},
	}

	levelMap := make(map[string]uuid.UUID)

	for _, l := range levels {
		var levelID uuid.UUID
		err := pool.QueryRow(ctx, `SELECT id FROM academic.education_level WHERE code=$1`, l.Code).Scan(&levelID)
		if errors.Is(err, pgx.ErrNoRows) {
			levelID = uuid.New()
			if _, err := pool.Exec(ctx,
				`INSERT INTO academic.education_level (id, code, name, sort_order) VALUES ($1, $2, $3, $4)`,
				levelID, l.Code, l.Name, l.SortOrder); err != nil {
				log.Fatalf("create level %s: %v", l.Code, err)
			}
			log.Printf("level %s created: %s", l.Code, levelID)
		} else if err != nil {
			log.Fatalf("check level %s: %v", l.Code, err)
		} else {
			log.Printf("level %s exists: %s", l.Code, levelID)
		}
		levelMap[l.Code] = levelID

		// Ensure grades exist
		for _, gc := range l.Grades {
			var exists bool
			if err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM academic.grade WHERE education_level_id=$1 AND code=$2)`, levelID, gc).Scan(&exists); err != nil {
				log.Fatalf("check grade %s: %v", gc, err)
			}
			if !exists {
				if _, err := pool.Exec(ctx,
					`INSERT INTO academic.grade (id, education_level_id, code, name, sort_order) VALUES ($1,$2,$3,$4,$5)`,
					uuid.New(), levelID, gc, "Kelas "+gc, atoi(gc)); err != nil {
					log.Fatalf("grade %s: %v", gc, err)
				}
				log.Println("grade created:", gc)
			}
		}
	}

	// Active/default curriculum (reused only as FK)
	var curID uuid.UUID
	err = pool.QueryRow(ctx, `SELECT id FROM academic.curriculum WHERE is_active=true ORDER BY created_at LIMIT 1`).Scan(&curID)
	if errors.Is(err, pgx.ErrNoRows) {
		log.Fatal("no active curriculum row found (needed as FK for curriculum_subject)")
	}
	if err != nil {
		log.Fatalf("curriculum: %v", err)
	}
	log.Println("curriculum:", curID)

	for _, m := range allMapel() {
		lID, ok := levelMap[m.LevelCode]
		if !ok {
			log.Fatalf("unknown level code %s for mapel %s", m.LevelCode, m.Code)
		}
		if err := seedMapel(ctx, pool, lID, curID, m); err != nil {
			log.Fatalf("seed %s: %v", m.Code, err)
		}
	}
	fmt.Println("Academic seed done.")
}

func seedMapel(ctx context.Context, pool *pgxpool.Pool, levelID, curID uuid.UUID, m mapel) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var existing uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM academic.subject WHERE code=$1`, m.Code).Scan(&existing)
	if err == nil {
		tx.Commit(ctx)
		log.Printf("skip %s (subject exists)", m.Code)
		return nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	subjID := uuid.New()
	if _, err := tx.Exec(ctx,
		`INSERT INTO academic.subject (id, code, name, is_active) VALUES ($1,$2,$3,true)`,
		subjID, m.Code, m.Name); err != nil {
		return err
	}
	csID := uuid.New()
	if _, err := tx.Exec(ctx,
		`INSERT INTO academic.curriculum_subject (id, curriculum_id, subject_id, education_level_id, grade_id, is_required, credit, sort_order)
		 VALUES ($1,$2,$3,$4,NULL,true,0,0)`,
		csID, curID, subjID, levelID); err != nil {
		return err
	}

	for bi, b := range m.Bab {
		chID := uuid.New()
		chCode := fmt.Sprintf("BAB%02d", bi+1)
		if _, err := tx.Exec(ctx,
			`INSERT INTO academic.chapter (id, curriculum_subject_id, code, title, order_no, description, is_active)
			 VALUES ($1,$2,$3,$4,$5,NULL,true)`,
			chID, csID, chCode, b.Title, bi+1); err != nil {
			return fmt.Errorf("chapter %s: %w", chCode, err)
		}
		for si, sb := range b.Subbab {
			scID := uuid.New()
			scCode := fmt.Sprintf("%d.%d", bi+1, si+1)
			tujuan := strings.Join(sb.Tujuan, "; ")
			if _, err := tx.Exec(ctx,
				`INSERT INTO academic.subchapter (id, chapter_id, code, title, order_no, description, estimated_minutes)
				 VALUES ($1,$2,$3,$4,$5,$6,NULL)`,
				scID, chID, scCode, sb.Title, si+1, tujuan); err != nil {
				return fmt.Errorf("subchapter %s: %w", scCode, err)
			}
			// Batched topic insert (multi-row) per subchapter.
			if len(sb.Topik) > 0 {
				var sbSQL strings.Builder
				sbSQL.WriteString(`INSERT INTO academic.topic (id, subchapter_id, name, description, order_no) VALUES `)
				args := make([]any, 0, len(sb.Topik)*4)
				for ti, t := range sb.Topik {
					if ti > 0 {
						sbSQL.WriteString(",")
					}
					sbSQL.WriteString(fmt.Sprintf("($%d,$%d,$%d,NULL,$%d)", ti*4+1, ti*4+2, ti*4+3, ti*4+4))
					args = append(args, uuid.New(), scID, t, ti+1)
				}
				if _, err := tx.Exec(ctx, sbSQL.String(), args...); err != nil {
					return fmt.Errorf("topics %s: %w", scCode, err)
				}
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}
	log.Printf("seeded %s (%s): %d bab", m.Code, m.Name, len(m.Bab))
	return nil
}

func atoi(s string) int {
	n := 0
	for _, r := range s {
		if r < '0' || r > '9' {
			return 0
		}
		n = n*10 + int(r-'0')
	}
	return n
}