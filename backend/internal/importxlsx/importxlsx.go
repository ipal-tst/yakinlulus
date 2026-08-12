package importxlsx

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xuri/excelize/v2"
)

type ImportRow struct {
	RowNum int
	Cells  map[string]string
}

func Parse(reader io.Reader, sheetName string) ([]ImportRow, error) {
	f, err := excelize.OpenReader(reader)
	if err != nil {
		return nil, fmt.Errorf("open xlsx: %w", err)
	}
	defer f.Close()

	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("get rows: %w", err)
	}
	if len(rows) < 2 {
		return nil, fmt.Errorf("insufficient rows: need header + data")
	}

	headers := make([]string, len(rows[0]))
	for i, h := range rows[0] {
		headers[i] = strings.ToUpper(strings.TrimSpace(h))
	}

	var result []ImportRow
	for i := 1; i < len(rows); i++ {
		cells := make(map[string]string)
		for j, val := range rows[i] {
			if j < len(headers) {
				cells[headers[j]] = strings.TrimSpace(val)
			}
		}
		result = append(result, ImportRow{
			RowNum: i + 1,
			Cells:  cells,
		})
	}

	return result, nil
}

func FirstSheet(reader io.Reader) (string, error) {
	f, err := excelize.OpenReader(reader)
	if err != nil {
		return "", fmt.Errorf("open xlsx: %w", err)
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return "", fmt.Errorf("no sheets found")
	}
	return sheets[0], nil
}

func ResolveByNameOrCode(ctx context.Context, pool *pgxpool.Pool, table, code, name string) (uuid.UUID, bool, error) {
	var id uuid.UUID
	query := fmt.Sprintf("SELECT id FROM %s WHERE code = $1 OR name = $2 LIMIT 1", table)
	err := pool.QueryRow(ctx, query, code, name).Scan(&id)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return uuid.Nil, false, nil
		}
		return uuid.Nil, false, fmt.Errorf("resolve by name or code: %w", err)
	}
	return id, true, nil
}

func RetrieveByCode(ctx context.Context, pool *pgxpool.Pool, table, code string) (uuid.UUID, bool, error) {
	var id uuid.UUID
	query := fmt.Sprintf("SELECT id FROM %s WHERE code = $1 LIMIT 1", table)
	err := pool.QueryRow(ctx, query, code).Scan(&id)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return uuid.Nil, false, nil
		}
		return uuid.Nil, false, fmt.Errorf("retrieve by code: %w", err)
	}
	return id, true, nil
}

func InsertOnConflictDoNothing(ctx context.Context, pool *pgxpool.Pool, table, codeCol string, cols []string, vals []interface{}) (sql.Result, error) {
	placeholders := make([]string, len(vals))
	for i := range vals {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s) ON CONFLICT (%s) DO NOTHING RETURNING id",
		table,
		strings.Join(cols, ", "),
		strings.Join(placeholders, ", "),
		codeCol,
	)

	var id uuid.UUID
	err := pool.QueryRow(ctx, query, vals...).Scan(&id)
	if err != nil && err.Error() != "no rows in result set" {
		return nil, fmt.Errorf("insert on conflict: %w", err)
	}

	return &pgxResult{lastInsertId: id, rowsAffected: 1}, nil
}

type pgxResult struct {
	lastInsertId uuid.UUID
	rowsAffected int64
}

func (r *pgxResult) LastInsertId() (int64, error) {
	return 0, fmt.Errorf("not supported for UUID")
}

func (r *pgxResult) RowsAffected() (int64, error) {
	return r.rowsAffected, nil
}

func Job(ctx context.Context, pool *pgxpool.Pool, module, jobName, fileName string) (uuid.UUID, error) {
	jobID := uuid.New()

	var jobNumber string
	err := pool.QueryRow(ctx, `
		SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM '[0-9]+') AS INTEGER)), 0) + 1
		FROM ocr.import_job
		WHERE module = $1
	`, module).Scan(&jobNumber)
	if err != nil {
		return uuid.Nil, fmt.Errorf("generate job number: %w", err)
	}

	jobNumberFull := fmt.Sprintf("%s-%s", module, jobNumber)

	tx, err := pool.Begin(ctx)
	if err != nil {
		return uuid.Nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO ocr.import_job (id, module, job_number, source, status, created_at, updated_at)
		VALUES ($1, $2, $3, 'EXCEL', 'RUNNING', $4, $4)
	`, jobID, module, jobNumberFull, time.Now())
	if err != nil {
		return uuid.Nil, fmt.Errorf("insert import_job: %w", err)
	}

	fileID := uuid.New()
	_, err = tx.Exec(ctx, `
		INSERT INTO ocr.import_file (id, job_id, file_name, file_type, created_at)
		VALUES ($1, $2, $3, 'EXCEL', $4)
	`, fileID, jobID, fileName, time.Now())
	if err != nil {
		return uuid.Nil, fmt.Errorf("insert import_file: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, fmt.Errorf("commit tx: %w", err)
	}

	return jobID, nil
}

func LogError(ctx context.Context, pool *pgxpool.Pool, jobID uuid.UUID, rowNum int, message string) {
	_, _ = pool.Exec(ctx, `
		INSERT INTO ocr.import_error (id, job_id, row_number, error_message, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`, uuid.New(), jobID, rowNum, message, time.Now())
}

func CompleteJob(ctx context.Context, pool *pgxpool.Pool, jobID uuid.UUID, failed bool) {
	status := "COMPLETED"
	if failed {
		status = "FAILED"
	}
	_, _ = pool.Exec(ctx, `
		UPDATE ocr.import_job
		SET status = $1, updated_at = $2
		WHERE id = $3
	`, status, time.Now(), jobID)
}
