package academic

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateLevel(t *testing.T) {
	tests := []struct {
		name    string
		levelName string
		code    string
		wantErr bool
	}{
		{"empty name", "", "SMA", true},
		{"empty code", "SMA", "", true},
		{"both empty", "", "", true},
		{"valid", "SMA", "SMA", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateLevel(tt.levelName, tt.code)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateSubject(t *testing.T) {
	tests := []struct {
		name    string
		subjectName string
		wantErr bool
	}{
		{"empty name", "", true},
		{"valid", "Matematika", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateSubject(tt.subjectName)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func validateLevel(name, code string) error {
	if name == "" {
		return fmt.Errorf("name is required")
	}
	if code == "" {
		return fmt.Errorf("code is required")
	}
	return nil
}

func TestResolveLevelCode(t *testing.T) {
	tests := []struct {
		name       string
		levelCode  string
		levelID    string
		want       string
	}{
		{"level code used", "SMA", "", "SMA"},
		{"falls back to level id", "", "some-id", "some-id"},
		{"defaults to SD", "", "", "SD"},
		{"level code wins over id", "SMP", "some-id", "SMP"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, resolveLevelCode(tt.levelCode, tt.levelID))
		})
	}
}

func TestLevelNameFromCode(t *testing.T) {
	tests := []struct {
		code string
		want string
	}{
		{"SD", "Sekolah Dasar"},
		{"SMP", "Sekolah Menengah Pertama"},
		{"SMA", "Sekolah Menengah Atas"},
		{"SMK", "Sekolah Menengah Kejuruan"},
		{"ALUMNI", "Alumni / Gap Year"},
		{"UTBK", "Persiapan UTBK"},
		{"UNKNOWN", "UNKNOWN"},
		{"sd", "Sekolah Dasar"},
	}
	for _, tt := range tests {
		t.Run(tt.code, func(t *testing.T) {
			assert.Equal(t, tt.want, levelNameFromCode(tt.code))
		})
	}
}

func validateSubject(name string) error {
	if name == "" {
		return fmt.Errorf("name is required")
	}
	return nil
}
