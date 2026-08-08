package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

const connString = "postgresql://postgres.cjrhqywtwlmebthajrkx:kqHtPV72xUL1PYv1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Soft delete or hard delete questions
	tag1, err := pool.Exec(ctx, "DELETE FROM question.question CASCADE")
	if err != nil {
		fmt.Printf("Hard delete error: %v. Attempting soft delete...\n", err)
		tag2, err2 := pool.Exec(ctx, "UPDATE question.question SET deleted_at = NOW() WHERE deleted_at IS NULL")
		if err2 != nil {
			log.Fatalf("Soft delete error: %v", err2)
		}
		fmt.Printf("Soft deleted %d questions.\n", tag2.RowsAffected())
		return
	}

	fmt.Printf("Successfully purged %d questions from database!\n", tag1.RowsAffected())
}
