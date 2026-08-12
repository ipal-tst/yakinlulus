package target_schools

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

func (s *Service) ImportTargets(ctx context.Context, file io.Reader, fileName string) (*ImportResult, error) {
	rows, err := importxlsx.Parse(file, "Target Sekolah")
	if err != nil {
		return nil, err
	}

	jobID, err := importxlsx.Job(ctx, s.repo.pool, "ACADEMIC", "import-target-schools", fileName)
	if err != nil {
		return nil, fmt.Errorf("create import job: %w", err)
	}

	result := &ImportResult{TotalRows: len(rows)}

	validLevels := map[string]bool{"SMP": true, "SMA": true, "UNIVERSITY": true}
	defaultMaxScore := map[string]int{"SMP": 400, "SMA": 400, "UNIVERSITY": 700}

	for _, row := range rows {
		schoolName := row.Cells["SEKOLAH"]
		level := row.Cells["JENJANG"]
		name := row.Cells["NAMA SEKOLAH"]
		minScoreStr := row.Cells["NILAI TERENDAH"]
		maxScoreStr := row.Cells["NILAI TERTINGGI"]
		maxTotalStr := row.Cells["SKOR MAKSIMAL"]
		subjectsStr := row.Cells["MAPEL"]
		academicYear := row.Cells["TAHUN AJARAN"]

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
			name = schoolName
		}

		if schoolName == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "sekolah or nama sekolah is required")
			result.FailedCount++
			continue
		}

		var schoolID uuid.UUID
		found := false
		schoolID, found, err = importxlsx.ResolveByNameOrCode(ctx, s.repo.pool, "academic.school", schoolName, schoolName)
		if err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("resolve school error: %v", err))
			result.FailedCount++
			continue
		}

		if !found {
			err = s.repo.pool.QueryRow(ctx,
				`INSERT INTO academic.school (name, education_level, is_active) VALUES ($1, $2, true) RETURNING id`,
				schoolName, level).Scan(&schoolID)
			if err != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("auto-create school failed: %v", err))
				result.FailedCount++
				continue
			}
		}

		var minScore, maxScore, maxTotalScore *int
		if minScoreStr != "" {
			var v int
			if _, err := fmt.Sscanf(minScoreStr, "%d", &v); err != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("invalid min_score: %s", minScoreStr))
				result.FailedCount++
				continue
			}
			minScore = &v
		}
		if maxScoreStr != "" {
			var v int
			if _, err := fmt.Sscanf(maxScoreStr, "%d", &v); err != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("invalid max_score: %s", maxScoreStr))
				result.FailedCount++
				continue
			}
			maxScore = &v
		}
		if maxTotalStr != "" {
			var v int
			if _, err := fmt.Sscanf(maxTotalStr, "%d", &v); err != nil {
				importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("invalid max_total_score: %s", maxTotalStr))
				result.FailedCount++
				continue
			}
			maxTotalScore = &v
		}

		if maxTotalScore == nil {
			defaultMax := defaultMaxScore[level]
			maxTotalScore = &defaultMax
		}

		if minScore != nil && maxScore != nil && *maxScore < *minScore {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "max_score cannot be less than min_score")
			result.FailedCount++
			continue
		}

		if maxScore != nil && *maxScore > *maxTotalScore {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "max_score cannot exceed max_total_score")
			result.FailedCount++
			continue
		}

		var subjects []string
		if subjectsStr != "" {
			subjects = splitSubjects(subjectsStr)
		}

		existingID := uuid.Nil
		err = s.repo.pool.QueryRow(ctx,
			`SELECT id FROM academic.target_school WHERE name = $1 AND level = $2 AND deleted_at IS NULL`,
			name, level).Scan(&existingID)

		if err == nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("duplicate target: name=%s, level=%s", name, level))
			result.FailedCount++
			continue
		}

		req := SaveSchoolRequest{
			SchoolID:      schoolID,
			Name:          name,
			Level:         level,
			MinScore:      minScore,
			MaxScore:      maxScore,
			MaxTotalScore: *maxTotalScore,
			Subjects:      subjects,
			AcademicYear:  &academicYear,
			IsActive:      ptrBool(true),
		}

		if _, err := s.repo.Create(ctx, req); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("create target failed: %v", err))
			result.FailedCount++
			continue
		}

		result.SuccessCount++
	}

	importxlsx.CompleteJob(ctx, s.repo.pool, jobID, result.FailedCount > 0)
	return result, nil
}

func splitSubjects(s string) []string {
	parts := []string{}
	for _, p := range []string{",", ";", "|"} {
		if len(parts) == 0 {
			parts = splitByDelim(s, p)
		}
	}
	if len(parts) == 0 {
		parts = []string{s}
	}
	for i := range parts {
		parts[i] = trimSpace(parts[i])
	}
	return parts
}

func splitByDelim(s, delim string) []string {
	result := []string{}
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i:i+len(delim)] == delim {
			result = append(result, s[start:i])
			start = i + len(delim)
			i += len(delim) - 1
		}
	}
	result = append(result, s[start:])
	return result
}

func trimSpace(s string) string {
	start, end := 0, len(s)-1
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}
	for end > start && (s[end] == ' ' || s[end] == '\t' || s[end] == '\n' || s[end] == '\r') {
		end--
	}
	return s[start : end+1]
}

func ptrBool(b bool) *bool {
	return &b
}
