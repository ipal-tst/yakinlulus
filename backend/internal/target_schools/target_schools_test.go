package target_schools

import "testing"

func TestValidateSaveRequest(t *testing.T) {
	cases := []struct {
		name    string
		req     SaveSchoolRequest
		wantErr bool
	}{
		{"empty name", SaveSchoolRequest{Level: "SMP"}, true},
		{"bad level", SaveSchoolRequest{Name: "SMPN 1", Level: "SD"}, true},
		{"valid", SaveSchoolRequest{Name: "SMPN 1 Yogyakarta", Level: "SMP", MaxTotalScore: 400}, false},
		{"zero max default", SaveSchoolRequest{Name: "SMA N 1", Level: "SMA", MaxTotalScore: 0}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateSaveRequest(tc.req)
			if tc.wantErr && err == nil {
				t.Fatalf("expected error for %q, got nil", tc.name)
			}
			if !tc.wantErr && err != nil {
				t.Fatalf("expected no error for %q, got %v", tc.name, err)
			}
		})
	}
}
