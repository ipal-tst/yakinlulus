package target_schools

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/xuri/excelize/v2"

	"yakinlulus.id/backend/internal/importxlsx"
	"yakinlulus.id/backend/internal/shared"
)

var scoreImportHeader = []string{"SEKOLAH", "TAHUN", "NILAI TERENDAH", "NILAI TERTINGGI", "SKALA"}

func scoreTemplateWorkbook() ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Target Sekolah"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	for i, h := range scoreImportHeader {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	example := []interface{}{"SMA NEGERI 1", "2025/2026", 340, 380, 400}
	for i, v := range example {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheetName, cell, v)
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// resolvePayungByNameOrNPSN mencari payung target_school via nama/NPSN sekolah
// yang ter-join di academic.school.
func (r *Repository) resolvePayungByNameOrNPSN(ctx context.Context, name string) (uuid.UUID, bool, error) {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx,
		`SELECT ts.id
		 FROM academic.target_school ts
		 JOIN academic.school s ON s.id = ts.school_id
		 WHERE (s.name ILIKE $1 OR COALESCE(s.npsn,'') = $2) AND ts.deleted_at IS NULL
		 ORDER BY ts.created_at ASC LIMIT 1`,
		"%"+name+"%", name).Scan(&id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return uuid.Nil, false, nil
		}
		return uuid.Nil, false, err
	}
	return id, true, nil
}

// ImportScores meng-import baris nilai per tahun utk payung yang sudah ada
// (atau membuat payung baru bila sekolah ada di katalog).
func (s *Service) ImportScores(ctx context.Context, file io.Reader, fileName string) (*ImportResult, error) {
	rows, err := importxlsx.Parse(file, "Target Sekolah")
	if err != nil {
		return nil, err
	}

	jobID, err := importxlsx.Job(ctx, s.repo.pool, "ACADEMIC", "import-target-scores", fileName)
	if err != nil {
		return nil, fmt.Errorf("create import job: %w", err)
	}

	result := &ImportResult{TotalRows: len(rows)}

	for _, row := range rows {
		schoolName := row.Cells["SEKOLAH"]
		year := row.Cells["TAHUN"]
		minStr := row.Cells["NILAI TERENDAH"]
		maxStr := row.Cells["NILAI TERTINGGI"]
		scaleStr := row.Cells["SKALA"]

		if schoolName == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "sekolah is required")
			result.FailedCount++
			continue
		}
		if year == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "tahun is required")
			result.FailedCount++
			continue
		}

		var minScore, maxScore, maxTotalScore *int
		if minStr != "" {
			var v int
			if _, err := fmt.Sscanf(minStr, "%d", &v); err != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("invalid min score: %s", minStr))
				result.FailedCount++
				continue
			}
			minScore = &v
		}
		if maxStr != "" {
			var v int
			if _, err := fmt.Sscanf(maxStr, "%d", &v); err != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("invalid max score: %s", maxStr))
				result.FailedCount++
				continue
			}
			maxScore = &v
		}
		if scaleStr != "" {
			var v int
			if _, err := fmt.Sscanf(scaleStr, "%d", &v); err != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("invalid scale: %s", scaleStr))
				result.FailedCount++
				continue
			}
			maxTotalScore = &v
		}

		// pastikan sekolah ada di katalog; bila belum, lewati (tidak auto-create sekolah)
		payungID, found, err := s.repo.resolvePayungByNameOrNPSN(ctx, schoolName)
		if err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("resolve payung: %v", err))
			result.FailedCount++
			continue
		}
		if !found {
			// coba resolusi sekolah di katalog utk membuat payung baru
			var schoolID uuid.UUID
			err = s.repo.pool.QueryRow(ctx,
				`SELECT id FROM academic.school
				 WHERE (name ILIKE $1 OR COALESCE(npsn,'') = $2) AND deleted_at IS NULL LIMIT 1`,
				"%"+schoolName+"%", schoolName).Scan(&schoolID)
			if err != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("school not found in catalog: %s", schoolName))
				result.FailedCount++
				continue
			}
			name, lvl, _, _, _, rerr := s.repo.resolveSchool(ctx, schoolID)
			if rerr != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "school not found or inactive")
				result.FailedCount++
				continue
			}
			created, cerr := s.repo.Create(ctx, SaveSchoolRequest{
				SchoolID:      schoolID,
				Name:          name,
				Level:         lvl,
				MinScore:      minScore,
				MaxScore:      maxScore,
				MaxTotalScore: derefScoreOrZero(maxTotalScore, lvl),
				Subjects:      []string{},
				AcademicYear:  &year,
				IsActive:      ptrBool(true),
			})
			if cerr != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("auto-create payung failed: %v", cerr))
				result.FailedCount++
				continue
			}
			payungID = created.ID
		}

		sc := &TargetSchoolScore{
			TargetSchoolID: payungID,
			AcademicYear:   year,
			MinScore:       minScore,
			MaxScore:       maxScore,
			MaxTotalScore:  derefScoreOrZero(maxTotalScore, ""),
		}
		if _, err := s.repo.UpsertScore(ctx, sc); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("upsert score failed: %v", err))
			result.FailedCount++
			continue
		}
		_ = s.repo.SyncPayungLatest(ctx, payungID)
		result.SuccessCount++
	}

	importxlsx.CompleteJob(ctx, s.repo.pool, jobID, result.FailedCount > 0)
	return result, nil
}

func derefScoreOrZero(p *int, level string) int {
	if p != nil {
		return *p
	}
	if level == "" {
		return 400
	}
	return defaultMaxTotalForLevel(level)
}

// ExportScoresXLSX mengekspor nilai utk satu payung (semua tahun) atau semua.
func (s *Service) ExportScoresXLSX(ctx context.Context, targetSchoolID uuid.UUID, year string) ([]byte, error) {
	scores, err := s.repo.ListScores(ctx, targetSchoolID, year)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Target Sekolah"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	header := []string{"SEKOLAH", "TAHUN", "NILAI TERENDAH", "NILAI TERTINGGI", "SKALA", "DELTA MIN", "DELTA MAX"}
	for i, h := range header {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	trend, _ := s.repo.Trend(ctx, targetSchoolID)
	trendByYear := map[string]TrendPoint{}
	for _, p := range trend {
		trendByYear[p.AcademicYear] = p
	}

	rowIdx := 2
	for _, sc := range scores {
		tp := trendByYear[sc.AcademicYear]
		vals := []interface{}{
			payungName(ctx, s.repo, sc.TargetSchoolID),
			sc.AcademicYear,
			derefScoreOrEmpty(sc.MinScore),
			derefScoreOrEmpty(sc.MaxScore),
			sc.MaxTotalScore,
			derefScoreOrEmpty(tp.DeltaMin),
			derefScoreOrEmpty(tp.DeltaMax),
		}
		for i, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(i+1, rowIdx)
			f.SetCellValue(sheetName, cell, v)
		}
		rowIdx++
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func derefScoreOrEmpty(p *int) interface{} {
	if p == nil {
		return ""
	}
	return *p
}

func payungName(ctx context.Context, r *Repository, id uuid.UUID) string {
	var name string
	_ = r.pool.QueryRow(ctx,
		`SELECT COALESCE(ts.name, s.name, '')
		 FROM academic.target_school ts
		 LEFT JOIN academic.school s ON s.id = ts.school_id
		 WHERE ts.id = $1`, id).Scan(&name)
	return name
}

// --- Handlers ---

func (h *Handler) ImportScoresXlsx(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "file required"))
	}
	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to open file"))
	}
	defer file.Close()
	result, err := h.svc.ImportScores(c.Context(), file, fileHeader.Filename)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to import scores"))
	}
	return c.JSON(shared.Success(result))
}

func (h *Handler) ImportScoresTemplate(c *fiber.Ctx) error {
	b, err := scoreTemplateWorkbook()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to generate template"))
	}
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", `attachment; filename="template-target-scores.xlsx"`)
	return c.Send(b)
}

func (h *Handler) ExportScoresXlsx(c *fiber.Ctx) error {
	var req struct {
		TargetSchoolID uuid.UUID `json:"target_school_id"`
		AcademicYear   string    `json:"academic_year"`
	}
	if c.Method() == "POST" {
		_ = c.BodyParser(&req)
	}
	b, err := h.svc.ExportScoresXLSX(c.Context(), req.TargetSchoolID, req.AcademicYear)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to export scores"))
	}
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="target-scores-%s.xlsx"`, time.Now().Format("2006-01-02")))
	return c.Send(b)
}