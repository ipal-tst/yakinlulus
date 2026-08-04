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
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	fmt.Println("--- USERS ---")
	rows, err := pool.Query(ctx, "SELECT id, email, full_name, role, grade_id FROM users")
	if err != nil {
		log.Fatalf("users err: %v", err)
	}
	for rows.Next() {
		var id, email, fullName, role string
		var gradeID *string
		rows.Scan(&id, &email, &fullName, &role, &gradeID)
		gStr := "NULL"
		if gradeID != nil {
			gStr = *gradeID
		}
		fmt.Printf("User: %s | Email: %s | Name: %s | Role: %s | GradeID: %s\n", id, email, fullName, role, gStr)
	}
	rows.Close()

	fmt.Println("\n--- GRADES & EDUCATION LEVELS ---")
	rows, err = pool.Query(ctx, "SELECT g.id, g.name, el.name as ed_level, el.code FROM grades g JOIN education_levels el ON g.education_level_id = el.id")
	if err != nil {
		log.Fatalf("grades err: %v", err)
	}
	for rows.Next() {
		var id, gName, edName, edCode string
		rows.Scan(&id, &gName, &edName, &edCode)
		fmt.Printf("Grade: %s (%s) | EdLevel: %s (%s)\n", gName, id, edName, edCode)
	}
	rows.Close()

	fmt.Println("\n--- EXAMS IN CONTENTS TABLE ---")
	rows, err = pool.Query(ctx, "SELECT c.id, c.title, c.grade_id, c.status, g.name FROM contents c LEFT JOIN grades g ON c.grade_id = g.id WHERE c.content_type = 'EXAM'")
	if err != nil {
		log.Fatalf("exams err: %v", err)
	}
	for rows.Next() {
		var id, title, status string
		var gradeID, gName *string
		rows.Scan(&id, &title, &gradeID, &status, &gName)
		gStr := "NULL"
		if gradeID != nil {
			gStr = *gradeID
		}
		gnStr := "NULL"
		if gName != nil {
			gnStr = *gName
		}
		fmt.Printf("Exam: %s | Title: %s | GradeID: %s (%s) | Status: %s\n", id, title, gStr, gnStr, status)
	}
	rows.Close()
}
