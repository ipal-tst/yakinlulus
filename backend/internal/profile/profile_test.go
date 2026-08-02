package profile

import (
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestTargetTypeFromGrade(t *testing.T) {
	cases := []struct{ level, want string }{
		{"SD", "SMP"}, {"SMP", "SMA"}, {"SMA", "UNIVERSITY"},
		{"SMK", "UNIVERSITY"}, {"ALUMNI", "UNIVERSITY"}, {"UTBK", "UNIVERSITY"},
		{"", "UNIVERSITY"}, {"XYZ", "UNIVERSITY"},
	}
	for _, tc := range cases {
		if got := targetTypeFromGrade(tc.level); got != tc.want {
			t.Errorf("targetTypeFromGrade(%q) = %q, want %q", tc.level, got, tc.want)
		}
	}
}

func TestMotivationalState(t *testing.T) {
	cases := []struct {
		name                string
		hasData             bool
		score, minScore     int
		wantPass, wantMotiv string
	}{
		{"no data", false, 0, 0, "PENDING", "Belum ada nilai tryout"},
		{"below", true, 350, 367, "BELOW", "Kurang 17 poin lagi untuk lolos ambang"},
		{"meets", true, 398, 367, "PASSED", "Nilai kamu di atas ambang sekolah"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			state, motiv := motivationalState(tc.hasData, tc.score, tc.minScore)
			if state != tc.wantPass || motiv != tc.wantMotiv {
				t.Errorf("got (%q, %q), want (%q, %q)", state, motiv, tc.wantPass, tc.wantMotiv)
			}
		})
	}
}

func TestRenderCertificateHTML(t *testing.T) {
	svc := NewService(nil, nil)
	cert := Certificate{
		ID:       uuid.New(),
		Title:    "Tryout SNBT #03",
		ExamID:   uuid.New(),
		Score:    85.5,
		MaxScore: 100,
		Pct:      85.5,
		Rank:     3,
		Total:    120,
		Date:     time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC),
	}

	html, err := svc.RenderCertificateHTML(cert, "Murid Belajar")
	if err != nil {
		t.Fatalf("RenderCertificateHTML returned error: %v", err)
	}

	expected := []string{
		"Yakinlulus.id",
		"SERTIFIKAT PENCAPAIAN",
		"Murid Belajar",
		"Tryout SNBT #03",
		"85.5%",
		"#3 dari 120",
		"01 August 2026",
	}
	for _, s := range expected {
		if !strings.Contains(html, s) {
			t.Errorf("HTML missing expected substring %q", s)
		}
	}

	if !strings.Contains(html, "@media print") {
		t.Error("HTML should include print stylesheet")
	}
}
