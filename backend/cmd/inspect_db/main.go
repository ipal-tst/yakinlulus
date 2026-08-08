package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:kqHtPV72xUL1PYv1@db.cjrhqywtwlmebthajrkx.supabase.co:5432/postgres?sslmode=require&connect_timeout=10"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer pool.Close()

	rows, err := pool.Query(ctx, `
		SELECT q.id, q.created_at, v.version_no, COUNT(qb.id) as block_count
		FROM question.question q
		JOIN question.question_version v ON v.id = q.current_version_id
		LEFT JOIN question.question_block qb ON qb.question_version_id = v.id
		WHERE q.deleted_at IS NULL
		GROUP BY q.id, q.created_at, v.version_no
		ORDER BY q.created_at DESC
	`)
	if err != nil {
		log.Fatalf("Query error: %v", err)
	}
	defer rows.Close()

	fmt.Println("--- All Questions in Database ---")
	for rows.Next() {
		var id string
		var createdAt time.Time
		var verNo, blockCount int
		if err := rows.Scan(&id, &createdAt, &verNo, &blockCount); err != nil {
			log.Fatalf("Scan error: %v", err)
		}
		fmt.Printf("QID: %s | Created: %s | Ver: %d | BlocksInDB: %d\n", id, createdAt.Format("15:04:05"), verNo, blockCount)
	}
}
