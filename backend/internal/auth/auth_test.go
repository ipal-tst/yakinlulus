package auth

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name    string
		pwd     string
		wantErr bool
	}{
		{"too short", "Ab1!", true},
		{"no upper", "abcdefgh1!", true},
		{"no lower", "ABCDEFGH1!", true},
		{"no digit", "Abcdefghij!", true},
		{"no special", "Abcdefghij1", true},
		{"min valid", "Valid1@abc", false},
		{"complex valid", "Abcd!2xyzZ9#", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validatePassword(tt.pwd)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestGenerateToken(t *testing.T) {
	token, err := generateToken("user-1", "ADMIN", "secret")
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.Contains(t, token, ".")
}

func TestLoginValidation(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		password string
		wantErr bool
	}{
		{"empty email", "", "ValidPass1!", true},
		{"empty password", "test@test.com", "", true},
		{"invalid email format", "not-an-email", "ValidPass1!", true},
		{"valid", "test@test.com", "ValidPass1!", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateLogin(tt.email, tt.password)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func validateLogin(email, password string) error {
	if email == "" || password == "" {
		return fmt.Errorf("email and password required")
	}
	if !strings.Contains(email, "@") {
		return fmt.Errorf("invalid email")
	}
	return nil
}

func TestUpdateProfileRequestAcceptsSchoolName(t *testing.T) {
	school := "SMPN 1 Jakarta"
	req := UpdateProfileRequest{SchoolName: &school}
	assert.Equal(t, "SMPN 1 Jakarta", *req.SchoolName)
}

func TestValidateProfileRequest(t *testing.T) {
	g := "L"
	m := "IPA"
	phone := "08123456789012345678901" // 23 chars > 20
	badG := "X"
	badM := "AGAMA"
	gid := "not-a-uuid"

	okReq := UpdateProfileRequest{Gender: &g, Major: &m}
	assert.NoError(t, validateProfileRequest(okReq))

	empty := ""
	clearGender := UpdateProfileRequest{Gender: &empty, Major: &empty}
	assert.NoError(t, validateProfileRequest(clearGender))

	badGender := UpdateProfileRequest{Gender: &badG}
	assert.Error(t, validateProfileRequest(badGender))

	badMajor := UpdateProfileRequest{Major: &badM}
	assert.Error(t, validateProfileRequest(badMajor))

	longPhone := UpdateProfileRequest{Phone: &phone}
	assert.Error(t, validateProfileRequest(longPhone))

	badGrade := UpdateProfileRequest{GradeID: &gid}
	assert.Error(t, validateProfileRequest(badGrade))

	nilReq := UpdateProfileRequest{}
	assert.NoError(t, validateProfileRequest(nilReq))
}

func TestPublicRegisterRejectsElevatedRoles(t *testing.T) {
	assert.Error(t, validatePublicRegisterRole("ADMIN"))
	assert.Error(t, validatePublicRegisterRole("STAFF"))
	assert.Error(t, validatePublicRegisterRole("TEACHER"))
	assert.NoError(t, validatePublicRegisterRole("STUDENT"))
	assert.NoError(t, validatePublicRegisterRole(""))
}

func TestRestrictGradeSchoolByRole(t *testing.T) {
	g := "grade-123"
	s := "SMPN 1 Jakarta"

	for _, role := range []string{"STUDENT", "TEACHER"} {
		req := UpdateProfileRequest{GradeID: &g, SchoolName: &s}
		got := restrictGradeSchoolForRole(req, role)
		assert.Nil(t, got.GradeID, "role %s must not update grade", role)
		assert.Nil(t, got.SchoolName, "role %s must not update school", role)
	}

	for _, role := range []string{"ADMIN", "STAFF"} {
		req := UpdateProfileRequest{GradeID: &g, SchoolName: &s}
		got := restrictGradeSchoolForRole(req, role)
		assert.NotNil(t, got.GradeID, "role %s may update grade", role)
		assert.NotNil(t, got.SchoolName, "role %s may update school", role)
	}

	name := "Budi"
	req := UpdateProfileRequest{FullName: &name, GradeID: &g, SchoolName: &s}
	got := restrictGradeSchoolForRole(req, "STUDENT")
	assert.NotNil(t, got.FullName)
	assert.Equal(t, "Budi", *got.FullName)
}

func TestUpdateUserSQLIncludesSchoolName(t *testing.T) {
	q := buildUpdateUserQuery()
	assert.Contains(t, q, "school_name", "UpdateUser SQL must set school_name")
}
