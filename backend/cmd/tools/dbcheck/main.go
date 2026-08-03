package main

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Supabase Session Pooler URLs (IPv4 capable)
// Format: postgres://postgres.[project-ref]:[password]@[region].pooler.supabase.com:5432/postgres
var connStrings = []struct {
	name string
	url  string
}{
	{
		"Pooler SEA-1 Session (port 5432)",
		"postgresql://postgres.cjrhqywtwlmebthajrkx:kqHtPV72xUL1PYv1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
	},
	{
		"Pooler SEA-1 Transaction (port 6543)",
		"postgresql://postgres.cjrhqywtwlmebthajrkx:kqHtPV72xUL1PYv1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
	},
	{
		"Direct DB (original)",
		"postgresql://postgres:kqHtPV72xUL1PYv1@db.cjrhqywtwlmebthajrkx.supabase.co:5432/postgres?sslmode=disable",
	},
}

func maskURL(url string) string {
	atIdx := strings.LastIndex(url, "@")
	if atIdx == -1 {
		return url
	}
	prefix := url[:atIdx]
	suffix := url[atIdx:]
	colonIdx := strings.LastIndex(prefix, ":")
	if colonIdx == -1 {
		return url
	}
	return prefix[:colonIdx+1] + "****" + suffix
}

func testConn(name, url string) {
	fmt.Printf("\n[%s]\n", name)
	fmt.Printf("URL: %s\n", maskURL(url))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	start := time.Now()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		fmt.Printf("❌ Pool error: %v\n", err)
		return
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		fmt.Printf("❌ Ping gagal: %v\n", err)
		return
	}
	elapsed := time.Since(start)
	fmt.Printf("✅ CONNECTED — Latency: %dms\n", elapsed.Milliseconds())

	var version string
	if err := pool.QueryRow(ctx, "SELECT version()").Scan(&version); err == nil {
		// Trim to first line
		if idx := strings.Index(version, " on "); idx != -1 {
			version = version[:idx]
		}
		fmt.Printf("📦 %s\n", version)
	}

	var tableCount int
	pool.QueryRow(ctx, `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`).Scan(&tableCount)
	fmt.Printf("🗂️  Tabel public: %d\n", tableCount)

	// List tables
	rows, err := pool.Query(ctx, `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`)
	if err == nil {
		defer rows.Close()
		var tables []string
		for rows.Next() {
			var t string
			rows.Scan(&t)
			tables = append(tables, t)
		}
		if len(tables) > 0 {
			fmt.Printf("📋 Tabel: %s\n", strings.Join(tables, ", "))
		}
	}

	// Migration count
	var migCount int
	if err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM schema_migrations").Scan(&migCount); err == nil {
		fmt.Printf("🔄 Migrasi applied: %d\n", migCount)
	}
}

func main() {
	fmt.Println("================================================")
	fmt.Println("   YakinLulus.id — Database Connection Check")
	fmt.Println("================================================")

	for _, c := range connStrings {
		testConn(c.name, c.url)
	}

	fmt.Println("\n================================================")
	fmt.Println("✅ Check selesai!")
	fmt.Println("================================================")
}

func init() {
	log.SetFlags(0)
}
