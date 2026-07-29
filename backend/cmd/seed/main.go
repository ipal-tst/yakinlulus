package main

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Seeding test dummy data across all tables...")

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Admin@123!"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}
	pwHash := string(hashedPassword)

	adminID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	staffID := uuid.MustParse("00000000-0000-0000-0000-000000000002")
	teacherBudiID := uuid.MustParse("00000000-0000-0000-0000-000000000003")
	teacherSitiID := uuid.MustParse("00000000-0000-0000-0000-000000000004")
	student1ID := uuid.MustParse("00000000-0000-0000-0000-000000000010")

	usersData := []struct {
		id       uuid.UUID
		email    string
		fullName string
		role     string
	}{
		{adminID, "admin@yakinlulus.id", "Super Admin YakinLulus", "ADMIN"},
		{staffID, "staff@yakinlulus.id", "Staf Akademik YakinLulus", "STAFF"},
		{teacherBudiID, "guru.budi@yakinlulus.id", "Drs. Budi Santoso, M.Pd", "TEACHER"},
		{teacherSitiID, "guru.siti@yakinlulus.id", "Siti Rahmawati, S.Si", "TEACHER"},
		{student1ID, "murid@yakinlulus.id", "Ahmad Pratama", "STUDENT"},
	}

	for _, u := range usersData {
		_, err = pool.Exec(ctx, `
			INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
			ON CONFLICT (email) DO NOTHING
		`, u.id, u.email, pwHash, u.fullName, u.role)
		if err != nil {
			log.Printf("Skip or err user %s: %v", u.email, err)
		}
	}

	fmt.Println("Seeder completed successfully.")
}
