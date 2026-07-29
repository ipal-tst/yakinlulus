package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"yakinlulus.id/backend/pkg/config"
	"yakinlulus.id/backend/pkg/database"
)

func main() {
	flag.Parse()
	cmd := flag.Arg(0)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	cfg, err := config.Load("config.yaml")
	if err != nil {
		fmt.Fprintf(os.Stderr, "config: %v\n", err)
		os.Exit(1)
	}

	pool, err := database.NewPostgresPool(ctx, cfg.Database)
	if err != nil {
		fmt.Fprintf(os.Stderr, "db: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	switch cmd {
	case "up":
		fmt.Println("Running all pending migrations...")
		if err := database.AutoMigrate(ctx, pool, "migrations"); err != nil {
			fmt.Fprintf(os.Stderr, "migrate up: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Done.")

	case "down":
		fmt.Println("Rollback not implemented — use SQL manually.")
		os.Exit(1)

	case "status":
		var count int
		pool.QueryRow(ctx, "SELECT COUNT(*) FROM _migrations").Scan(&count)
		fmt.Printf("Applied migrations: %d\n", count)

	default:
		fmt.Println("Usage: go run cmd/migrate/main.go <up|down|status>")
	}
}
