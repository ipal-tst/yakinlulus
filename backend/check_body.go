package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	pool, err := pgxpool.New(context.Background(), os.Getenv("DB_URL"))
	if err != nil {
		fmt.Println("err:", err)
		return
	}
	defer pool.Close()

	rows, _ := pool.Query(context.Background(),
		`SELECT id, content_type, LEFT(body, 300) as body_preview FROM contents WHERE content_type IN ('MATERIAL','QUESTION') AND body IS NOT NULL AND body != '' LIMIT 4`)
	for rows.Next() {
		var id, ctype, preview string
		rows.Scan(&id, &ctype, &preview)
		fmt.Printf("--- %s [%s] ---\n%s\n\n", id[:8], ctype, preview)
	}
}
