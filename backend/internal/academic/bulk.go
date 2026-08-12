package academic

import (
	"context"
	"fmt"
	"github.com/google/uuid"
)

type BulkRequest struct {
	Kind     string      `json:"kind"`
	IDs      []uuid.UUID `json:"ids"`
	IsActive *bool       `json:"is_active,omitempty"`
}

type BulkResult struct {
	Processed int          `json:"processed"`
	Deleted   int          `json:"deleted"`
	Failed    int          `json:"failed"`
	Errors    []ImportError `json:"errors,omitempty"`
}

func (s *Service) BulkDelete(ctx context.Context, req BulkRequest) (*BulkResult, error) {
	if len(req.IDs) == 0 {
		return nil, fmt.Errorf("ids required")
	}

	var deleteFunc func(ctx context.Context, id uuid.UUID) error
	var tableName string

	switch req.Kind {
	case "level":
		deleteFunc = s.repo.DeleteLevel
		tableName = "academic.education_level"
	case "grade":
		deleteFunc = s.repo.DeleteGrade
		tableName = "academic.grade"
	case "subject":
		deleteFunc = s.repo.DeleteSubject
		tableName = "academic.subject"
	case "curriculum":
		deleteFunc = s.repo.DeleteCurriculum
		tableName = "academic.curriculum"
	case "program":
		deleteFunc = s.repo.DeleteProgram
		tableName = "academic.program"
	default:
		return nil, fmt.Errorf("unknown kind: %s", req.Kind)
	}

	result := &BulkResult{
		Processed: len(req.IDs),
		Deleted:   0,
		Failed:    0,
		Errors:    []ImportError{},
	}

	for _, id := range req.IDs {
		if err := deleteFunc(ctx, id); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, ImportError{
				Row:     0,
				Message: fmt.Sprintf("failed to delete %s: %v", tableName, err),
			})
		} else {
			result.Deleted++
		}
	}

	return result, nil
}

func (s *Service) BulkStatus(ctx context.Context, req BulkRequest) (*BulkResult, error) {
	if len(req.IDs) == 0 {
		return nil, fmt.Errorf("ids required")
	}

	if req.IsActive == nil {
		return nil, fmt.Errorf("is_active required")
	}

	if req.Kind == "level" || req.Kind == "grade" {
		return nil, fmt.Errorf("status update not supported for kind %s", req.Kind)
	}

	var updateFunc func(ctx context.Context, id uuid.UUID, isActive bool) error
	var tableName string

	switch req.Kind {
	case "subject":
		updateFunc = func(ctx context.Context, id uuid.UUID, isActive bool) error {
			return s.repo.UpdateSubjectStatus(ctx, id, isActive)
		}
		tableName = "academic.subject"
	case "curriculum":
		updateFunc = func(ctx context.Context, id uuid.UUID, isActive bool) error {
			return s.repo.UpdateCurriculumStatus(ctx, id, isActive)
		}
		tableName = "academic.curriculum"
	case "program":
		updateFunc = func(ctx context.Context, id uuid.UUID, isActive bool) error {
			return s.repo.UpdateProgramStatus(ctx, id, isActive)
		}
		tableName = "academic.program"
	default:
		return nil, fmt.Errorf("unknown kind: %s", req.Kind)
	}

	result := &BulkResult{
		Processed: 0,
		Failed:    0,
		Errors:    []ImportError{},
	}

	for _, id := range req.IDs {
		if err := updateFunc(ctx, id, *req.IsActive); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, ImportError{
				Row:     0,
				Message: fmt.Sprintf("failed to update status for %s: %v", tableName, err),
			})
		} else {
			result.Processed++
		}
	}

	return result, nil
}
