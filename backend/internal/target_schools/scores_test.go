package target_schools

import (
	"bytes"
	"testing"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

func TestValidateScoreReq(t *testing.T) {
	min, max := 340, 380
	total := 400
	if err := validateScoreReq(SaveScoreRequest{TargetSchoolID: uuid.New(), AcademicYear: "2025/2026", MinScore: &min, MaxScore: &max, MaxTotalScore: &total}); err != nil {
		t.Fatalf("valid case: %v", err)
	}
	if err := validateScoreReq(SaveScoreRequest{TargetSchoolID: uuid.New(), AcademicYear: ""}); err == nil {
		t.Fatal("academic_year required")
	}
	badMin, badMax := 400, 300
	if err := validateScoreReq(SaveScoreRequest{TargetSchoolID: uuid.New(), AcademicYear: "2025/2026", MinScore: &badMin, MaxScore: &badMax}); err == nil {
		t.Fatal("max < min harus error")
	}
	over := 500
	if err := validateScoreReq(SaveScoreRequest{TargetSchoolID: uuid.New(), AcademicYear: "2025/2026", MaxScore: &over, MaxTotalScore: &total}); err == nil {
		t.Fatal("max > max_total harus error")
	}
}

func TestScoreImportTemplateHeaders(t *testing.T) {
	b, err := scoreTemplateWorkbook()
	if err != nil {
		t.Fatalf("template: %v", err)
	}
	f, err := excelize.OpenReader(bytes.NewReader(b))
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer f.Close()
	rows, _ := f.GetRows("Target Sekolah")
	want := []string{"SEKOLAH", "TAHUN", "NILAI TERENDAH", "NILAI TERTINGGI", "SKALA"}
	if len(rows) < 2 {
		t.Fatal("need header + example")
	}
	for i, w := range want {
		if rows[0][i] != w {
			t.Fatalf("col %d = %q want %q", i, rows[0][i], w)
		}
	}
}