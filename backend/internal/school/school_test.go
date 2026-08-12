package school

import (
	"bytes"
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

func TestValidateCreateReq(t *testing.T) {
	good := CreateSchoolReq{SchoolName: "SMA N 1", NPSN: strPtr("20100001"), InstitutionType: "SEKOLAH", EducationLevel: strPtr("SMA"), SchoolStatus: "NEGERI"}
	if err := validateCreateReq(good); err != nil {
		t.Fatalf("expected valid: %v", err)
	}
	if err := validateCreateReq(CreateSchoolReq{SchoolName: "X", InstitutionType: "PT", SchoolStatus: "NEGERI"}); err != nil {
		t.Fatalf("PT tanpa level harus valid: %v", err)
	}
	if err := validateCreateReq(CreateSchoolReq{SchoolName: "X", InstitutionType: "SEKOLAH", SchoolStatus: "NEGERI"}); err == nil {
		t.Fatal("SEKOLAH tanpa education_level harus error")
	}
	if err := validateCreateReq(CreateSchoolReq{SchoolName: "X", NPSN: strPtr("123"), InstitutionType: "SEKOLAH", EducationLevel: strPtr("SMA"), SchoolStatus: "NEGERI"}); err == nil {
		t.Fatal("NPSN bukan 8 digit harus error")
	}
	if err := validateCreateReq(CreateSchoolReq{SchoolName: "X", InstitutionType: "SEKOLAH", EducationLevel: strPtr("SMA"), SchoolStatus: "SWASTA"}); err == nil {
		t.Fatal("SWASTA tanpa yayasan_name harus error")
	}
}

func TestValidateUpdateReq(t *testing.T) {
	swasta := "SWASTA"
	if err := validateUpdateReq(UpdateSchoolReq{SchoolStatus: &swasta}); err == nil {
		t.Fatal("SWASTA tanpa yayasan_name pada update harus error")
	}
	yayasan := "Yayasan X"
	if err := validateUpdateReq(UpdateSchoolReq{SchoolStatus: &swasta, YayasanName: &yayasan}); err != nil {
		t.Fatalf("SWASTA dengan yayasan valid: %v", err)
	}
	negara := "NEGERI"
	if err := validateUpdateReq(UpdateSchoolReq{SchoolStatus: &negara}); err != nil {
		t.Fatalf("NEGERI tanpa yayasan valid: %v", err)
	}
	badNPSN := "abc"
	if err := validateUpdateReq(UpdateSchoolReq{NPSN: &badNPSN}); err == nil {
		t.Fatal("NPSN bukan 8 digit pada update harus error")
	}
}

func strPtr(s string) *string { return &s }

func TestDemographicValidation(t *testing.T) {
	s := &Service{}
	if _, err := s.UpsertDemographic(context.Background(), DemographicReq{AcademicYear: "2025/2026"}); err == nil {
		t.Fatal("school_id required")
	}
	neg := -1
	if _, err := s.UpsertDemographic(context.Background(), DemographicReq{SchoolID: uuid.New(), AcademicYear: "2025/2026", TotalStudents: &neg}); err == nil {
		t.Fatal("total_students cannot be negative")
	}
	badNegRombel := -2
	if _, err := s.UpsertDemographic(context.Background(), DemographicReq{SchoolID: uuid.New(), AcademicYear: "2025/2026", TotalRombel: &badNegRombel}); err == nil {
		t.Fatal("total_rombel cannot be negative")
	}
	if _, err := s.UpsertDemographic(context.Background(), DemographicReq{SchoolID: uuid.New(), AcademicYear: ""}); err == nil {
		t.Fatal("academic_year required")
	}
}

func TestSchoolTemplateHeaders(t *testing.T) {
	b, err := schoolTemplateWorkbook()
	if err != nil {
		t.Fatalf("template: %v", err)
	}
	f, err := excelize.OpenReader(bytes.NewReader(b))
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer f.Close()
	rows, _ := f.GetRows("Sekolah")
	if len(rows) < 2 {
		t.Fatal("need header + example row")
	}
	want := []string{"NAMA", "NPSN", "BENTUK", "JENJANG", "STATUS", "YAYASAN", "PROVINSI", "KOTA", "KECAMATAN", "DESA", "ALAMAT", "KODEPOS", "TELP", "EMAIL", "WEBSITE", "KURIKULUM"}
	for i, w := range want {
		if rows[0][i] != w {
			t.Fatalf("col %d = %q, want %q", i, rows[0][i], w)
		}
	}
}
