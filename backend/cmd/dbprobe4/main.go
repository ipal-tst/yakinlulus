package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	conn, err := pgx.Connect(ctx, os.Args[1])
	if err != nil {
		panic(err)
	}
	defer conn.Close(ctx)

	// session created earlier: c71c10b3-6de3-4a11-ad50-56abd75af2dc, exam 55635163-5e72-4b78-8bed-6f4a0f954096
	rows, err := conn.Query(ctx, `
		SELECT a.id, p.exam_id, a.status, a.started_at,
		       (SELECT COUNT(*) FROM cbt.attempt_question q WHERE q.attempt_id = a.id) AS questions
		FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id = a.participant_id
		ORDER BY a.started_at DESC LIMIT 5`)
	if err != nil {
		panic(err)
	}
	defer rows.Close()
	for rows.Next() {
		var id, examID, status string
		var started time.Time
		var q int
		rows.Scan(&id, &examID, &status, &started, &q)
		fmt.Printf("attempt %s exam=%s status=%s started=%s questions=%d\n", id, examID, status, started.Format("2006-01-02 15:04:05"), q)
	}

	// metadata for exam 5563...
	var subCount int
	var poolQIDs []string
	err = conn.QueryRow(ctx, `
		SELECT COALESCE(jsonb_array_length(COALESCE(md.metadata->'subtests', '[]'::jsonb)::jsonb),0)
		FROM cbt.exam_metadata md WHERE md.exam_id = $1`, "55635163-5e72-4b78-8bed-6f4a0f954096").Scan(&subCount)
	if err != nil {
		fmt.Println("subtest count err:", err)
	} else {
		fmt.Println("exam 5563 subtests:", subCount)
	}
	err = conn.QueryRow(ctx, `
		SELECT ARRAY(SELECT jsonb_array_elements_text(COALESCE(s->'pool_question_ids','[]'::jsonb))
		FROM jsonb_array_elements(COALESCE(md.metadata->'subtests','[]'::jsonb)::jsonb) s)
		FROM cbt.exam_metadata md WHERE md.exam_id = $1`, "55635163-5e72-4b78-8bed-6f4a0f954096").Scan(&poolQIDs)
	if err != nil {
		fmt.Println("pool ids err:", err)
	} else {
		fmt.Println("exam 5563 pool_question_ids count:", len(poolQIDs), "sample:", poolQIDs[:min(3, len(poolQIDs))])
	}

	// do those pool ids exist in question.question?
	if len(poolQIDs) > 0 {
		var existing int
		_ = conn.QueryRow(ctx, `SELECT COUNT(*) FROM question.question WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`, poolQIDs).Scan(&existing)
		fmt.Println("of pool ids existing in question.question:", existing)
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}