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

	rows, err := conn.Query(ctx, `
		SELECT e.id, e.title,
		       (SELECT COUNT(*) FROM cbt.exam_package_question pq
		        JOIN cbt.exam_package ep ON ep.id = pq.package_id
		        WHERE ep.exam_id = e.id) AS pkg_q,
		       (SELECT COUNT(*) FROM cbt.exam_question_pool eqp
		        WHERE eqp.exam_id = e.id) AS pool_rows,
		       COALESCE((SELECT total_question FROM cbt.exam_question_pool eqp WHERE eqp.exam_id = e.id LIMIT 1), 0) AS pool_total,
		       (SELECT COUNT(*) FROM cbt.exam_package ep
		        JOIN cbt.exam_package_question pq ON pq.package_id = ep.id
		        WHERE ep.exam_id = e.id) AS distinct_q
		FROM cbt.exam e WHERE e.deleted_at IS NULL`)
	if err != nil {
		panic(err)
	}
	defer rows.Close()
	for rows.Next() {
		var id, title string
		var pkgQ, poolRows, poolTotal, distinctQ int
		rows.Scan(&id, &title, &pkgQ, &poolRows, &poolTotal, &distinctQ)
		fmt.Printf("%s | %s | pkgQ=%d poolRows=%d poolTotal=%d distinctQ=%d\n", id, title, pkgQ, poolRows, poolTotal, distinctQ)
	}

	// Where do questions link? sample some question pool rows
	rows2, err := conn.Query(ctx, `
		SELECT eqp.exam_id, eqp.subject_id, eqp.difficulty, eqp.total_question,
		       (SELECT COUNT(*) FROM cbt.exam_question_pool_question e q) 
		FROM cbt.exam_question_pool eqp LIMIT 10`)
	if err != nil {
		fmt.Println("pool detail query err:", err)
	} else {
		defer rows2.Close()
	}
}