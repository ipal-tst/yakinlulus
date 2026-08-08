package main

import (
	"context"
	"fmt"
	"log"

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
		log.Fatalf("Failed to connect database: %v", err)
	}
	defer pool.Close()

	var qCount int
	err = pool.QueryRow(ctx, "SELECT COUNT(*) FROM question.question WHERE deleted_at IS NULL").Scan(&qCount)
	if err != nil {
		log.Fatalf("Query count failed: %v", err)
	}
	fmt.Printf("Total questions in DB: %d\n", qCount)

	rows, err := pool.Query(ctx, `
		SELECT q.id, st.code, qv.id as version_id
		FROM question.question q
		LEFT JOIN question.question_status st ON st.id = q.status_id
		LEFT JOIN question.question_version qv ON qv.id = q.current_version_id
		WHERE q.deleted_at IS NULL
		ORDER BY q.created_at DESC
		LIMIT 10
	`)
	if err != nil {
		log.Fatalf("Query questions failed: %v", err)
	}
	defer rows.Close()

	fmt.Println("\n--- Questions ---")
	for rows.Next() {
		var qID, stCode string
		var vID *string
		if err := rows.Scan(&qID, &stCode, &vID); err == nil {
			vIDStr := "NIL"
			if vID != nil {
				vIDStr = *vID
			}
			fmt.Printf("QID: %s | Status: %s | VersionID: %s\n", qID, stCode, vIDStr)

			if vID != nil {
				bRows, err := pool.Query(ctx, `
					SELECT block_order, block_type, content
					FROM question.question_block
					WHERE question_version_id = $1::uuid
					ORDER BY block_order
				`, *vID)
				if err == nil {
					for bRows.Next() {
						var bo int
						var bt, bc string
						if err := bRows.Scan(&bo, &bt, &bc); err == nil {
							if len(bc) > 80 {
								bc = bc[:80] + "..."
							}
							fmt.Printf("   -> Block #%d [%s]: %s\n", bo, bt, bc)
						}
					}
					bRows.Close()
				}
			}
		}
	}
}
