package exam_packages

import (
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestValidateSaveRequest(t *testing.T) {
	tests := []struct {
		name    string
		req     SavePackageRequest
		wantErr bool
	}{
		{"valid", SavePackageRequest{Code: "TKA-SMP-2026", Name: "Tryout TKA SMP", EducationLevel: "SMP"}, false},
		{"missing code", SavePackageRequest{Name: "Tryout", EducationLevel: "SMP"}, true},
		{"missing name", SavePackageRequest{Code: "X", EducationLevel: "SMP"}, true},
		{"bad level", SavePackageRequest{Code: "X", Name: "Y", EducationLevel: "TK"}, true},
		{"valid grade_id", SavePackageRequest{Code: "X", Name: "Y", EducationLevel: "SMP", GradeID: strPtr("11111111-1111-1111-1111-111111111111")}, false},
		{"empty grade_id ok", SavePackageRequest{Code: "X", Name: "Y", EducationLevel: "SMP", GradeID: strPtr("")}, false},
		{"invalid grade_id", SavePackageRequest{Code: "X", Name: "Y", EducationLevel: "SMP", GradeID: strPtr("nope")}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateSaveRequest(tt.req)
			if tt.wantErr {
				assert.Error(t, err)
				if ferr, ok := err.(*fiber.Error); ok {
					assert.Equal(t, fiber.StatusBadRequest, ferr.Code)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateLinkRequest(t *testing.T) {
	tests := []struct {
		name    string
		req     LinkExamRequest
		wantErr bool
	}{
		{"valid", LinkExamRequest{ExamContentID: "11111111-1111-1111-1111-111111111111", SubjectID: "22222222-2222-2222-2222-222222222222"}, false},
		{"bad exam id", LinkExamRequest{ExamContentID: "nope", SubjectID: "22222222-2222-2222-2222-222222222222"}, true},
		{"bad subject id", LinkExamRequest{ExamContentID: "11111111-1111-1111-1111-111111111111", SubjectID: "nope"}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateLinkRequest(tt.req)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func strPtr(s string) *string {
	return &s
}
