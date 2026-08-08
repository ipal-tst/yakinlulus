package main

import (
	"context"
	"fmt"
	"log"
	"os"

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
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	tablesToTruncate := []string{
		"question.exam_package_question",
		"question.question_block",
		"question.question_option",
		"question.question_metadata",
		"question.question_subject",
		"question.question_grade",
		"question.question_chapter",
		"question.question_topic",
		"question.question",
		"question.question_version",
		"question.question_revision",
		"media.asset_reference",
		"media.asset_storage",
		"media.asset",
	}

	for _, tbl := range tablesToTruncate {
		tag, err := pool.Exec(ctx, fmt.Sprintf("DELETE FROM %s", tbl))
		if err != nil {
			fmt.Printf("Warning deleting from %s: %v\n", tbl, err)
		} else {
			fmt.Printf("Deleted %d rows from %s\n", tag.RowsAffected(), tbl)
		}
	}

	fmt.Println("🎉 Database purge for ALL question data and media assets complete!")
}
