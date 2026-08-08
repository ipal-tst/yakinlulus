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
		log.Fatalf("Failed to connect: %v", err)
	}
	defer pool.Close()

	// Test corrected GetBlocks query
	rows, err := pool.Query(ctx, `
		SELECT qb.block_type,
		       qb.content,
		       qb.asset_id,
		       COALESCE(ast.public_url, '') AS image_url
		FROM question.question_block qb
		JOIN question.question q ON q.current_version_id = qb.question_version_id
		LEFT JOIN media.asset a ON a.id = qb.asset_id
		LEFT JOIN media.asset_storage ast ON ast.id = a.storage_id
		WHERE q.deleted_at IS NULL
		ORDER BY qb.block_order ASC`)
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

	fmt.Println("✅ GetBlocks query executed successfully!")
	var count int
	for rows.Next() {
		var bType, content, imgURL string
		var assetID *string
		rows.Scan(&bType, &content, &assetID, &imgURL)
		fmt.Printf("Block: type=%s | content=%s | imgURL=%s\n", bType, content, imgURL)
		count++
	}
	fmt.Printf("Total blocks fetched: %d\n", count)
}
