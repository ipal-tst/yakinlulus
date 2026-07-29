package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"yakinlulus.id/backend/pkg/config"
)

func main() {
	ctx := context.Background()
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("Failed: %v", err)
	}
	pool, err := pgxpool.New(ctx, cfg.Database.URL)
	if err != nil {
		log.Fatalf("Connect: %v", err)
	}
	defer pool.Close()

	pool.Exec(ctx, "DELETE FROM user_streaks")
	pool.Exec(ctx, "DELETE FROM user_levels")

	// Student 1: Ahmad Pratama
	pool.Exec(ctx, `INSERT INTO user_levels (user_id, level, current_xp, total_xp_earned) VALUES ($1,4,1250,1250) ON CONFLICT (user_id) DO UPDATE SET level=4,current_xp=1250,total_xp_earned=1250`,
		"00000000-0000-0000-0000-000000000010")
	pool.Exec(ctx, `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES ($1,7,14,CURRENT_DATE) ON CONFLICT (user_id) DO UPDATE SET current_streak=7,longest_streak=14`,
		"00000000-0000-0000-0000-000000000010")

	// Student 2: Nabila Putri
	pool.Exec(ctx, `INSERT INTO user_levels (user_id, level, current_xp, total_xp_earned) VALUES ($1,3,850,850) ON CONFLICT (user_id) DO UPDATE SET level=3,current_xp=850,total_xp_earned=850`,
		"00000000-0000-0000-0000-000000000011")
	pool.Exec(ctx, `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES ($1,3,5,CURRENT_DATE) ON CONFLICT (user_id) DO UPDATE SET current_streak=3,longest_streak=5`,
		"00000000-0000-0000-0000-000000000011")

	// Student 3: Rizky Ramadhan
	pool.Exec(ctx, `INSERT INTO user_levels (user_id, level, current_xp, total_xp_earned) VALUES ($1,2,400,400) ON CONFLICT (user_id) DO UPDATE SET level=2,current_xp=400,total_xp_earned=400`,
		"00000000-0000-0000-0000-000000000012")
	pool.Exec(ctx, `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES ($1,1,3,CURRENT_DATE) ON CONFLICT (user_id) DO UPDATE SET current_streak=1,longest_streak=3`,
		"00000000-0000-0000-0000-000000000012")

	fmt.Println("Seeded gamification data (user_levels + user_streaks)")
}
