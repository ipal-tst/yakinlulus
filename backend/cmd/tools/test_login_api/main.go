package main

import (
	"context"
	"fmt"
	"log"

	"yakinlulus.id/backend/internal/auth"
	"yakinlulus.id/backend/pkg/config"
	"yakinlulus.id/backend/pkg/database"
)

func main() {
	ctx := context.Background()

	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("Load config: %v", err)
	}

	pool, err := database.NewPostgresPool(ctx, cfg.Database)
	if err != nil {
		log.Fatalf("Database pool: %v", err)
	}
	defer pool.Close()

	repo := auth.NewRepository(pool)
	svc := auth.NewService(repo, cfg.JWT.Secret)

	// Test login for admin user
	resp, err := svc.Login(ctx, auth.LoginRequest{
		Email:    "admin@yakinlulus.id",
		Password: "Admin@123!",
	})
	if err != nil {
		log.Fatalf("❌ Login failed for admin@yakinlulus.id: %v", err)
	}

	fmt.Printf("✅ Login successful!\nUser ID: %s\nRole: %s\nToken: %s...\n",
		resp.User.ID, resp.User.Role, resp.Token[:20])
}
