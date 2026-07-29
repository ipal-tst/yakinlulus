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

func validateSubject(name string) error {
	if name == "" {
		return fmt.Errorf("name is required")
	}
	return nil
}
