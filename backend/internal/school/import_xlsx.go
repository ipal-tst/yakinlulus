package school

import (
	"context"
	"fmt"
	"io"

	"github.com/google/uuid"

	"yakinlulus.id/backend/internal/importxlsx"
)

type ImportResult struct {
	TotalRows    int      `json:"total_rows"`
	SuccessCount int      `json:"success_count"`
	FailedCount  int      `json:"failed_count"`
	Errors       []string `json:"errors,omitempty"`
}

func (s *Service) ImportSchools(ctx context.Context, file io.Reader, fileName string) (*ImportResult, error) {
	rows, err := importxlsx.Parse(file, "Sekolah")
	if err != nil {
		return nil, err
	}

	jobID, err := importxlsx.Job(ctx, s.repo.pool, "ACADEMIC", "import-schools", fileName)
	if err != nil {
		return nil, fmt.Errorf("create import job: %w", err)
	}

	result := &ImportResult{TotalRows: len(rows)}

	validLevels := map[string]bool{"SD": true, "SMP": true, "SMA": true, "SMK": true, "UNIVERSITY": true}

	for _, row := range rows {
		npsn := row.Cells["NPSN"]
		name := row.Cells["NAMA"]
		level := row.Cells["JENJANG"]
		province := row.Cells["PROVINSI"]
		city := row.Cells["KOTA"]
		district := row.Cells["DISTRIK"]
		address := row.Cells["ALAMAT"]
		phone := row.Cells["TELP"]
		email := row.Cells["EMAIL"]
		website := row.Cells["WEBSITE"]

		if level == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "jenjang is required")
			result.FailedCount++
			continue
		}

		if !validLevels[level] {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("invalid jenjang: %s", level))
			result.FailedCount++
			continue
		}

		if name == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "nama sekolah is required")
			result.FailedCount++
			continue
		}

		var existingID uuid.UUID
		err := s.repo.pool.QueryRow(ctx,
			`SELECT id FROM academic.school WHERE (npsn = $1 OR name = $2) AND deleted_at IS NULL LIMIT 1`,
			npsn, name).Scan(&existingID)

		if err == nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("duplicate: NPSN=%s or name=%s already exists", npsn, name))
			result.FailedCount++
			continue
		}

		sc := &School{
			SchoolName:      name,
			NPSN:            &npsn,
			InstitutionType: "SEKOLAH",
			EducationLevel:  level,
			SchoolStatus:    "NEGERI",
			Province:        &province,
			City:            &city,
			District:        &district,
			Address:         &address,
			Phone:           &phone,
			Email:           &email,
			Website:         &website,
		}

		if err := s.repo.Create(ctx, sc); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("create failed: %v", err))
			result.FailedCount++
			continue
		}

		result.SuccessCount++
	}

	importxlsx.CompleteJob(ctx, s.repo.pool, jobID, result.FailedCount > 0)
	return result, nil
}
