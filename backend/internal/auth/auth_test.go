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
		name     string
		email    string
		password string
		wantErr  bool
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

func TestPublicRegisterRoleMapsToSiswa(t *testing.T) {
	if err := validatePublicRegisterRole("ADMIN"); err == nil {
		t.Fatal("expected error for legacy ADMIN public register")
	}
	if err := validatePublicRegisterRole("SISWA"); err != nil {
		t.Fatalf("expected SISWA allowed, got %v", err)
	}
}

func TestPublicRegisterRejectsElevatedRoles(t *testing.T) {
	assert.Error(t, validatePublicRegisterRole("ADMIN"))
	assert.Error(t, validatePublicRegisterRole("STAFF"))
	assert.Error(t, validatePublicRegisterRole("TEACHER"))
	assert.Error(t, validatePublicRegisterRole("STUDENT"))
	assert.Error(t, validatePublicRegisterRole(""))
}

func TestRestrictGradeSchoolByRole(t *testing.T) {
	g := "grade-123"
	s := "SMPN 1 Jakarta"

	for _, role := range []string{"SISWA", "INVESTOR", "FINANCE"} {
		req := UpdateProfileRequest{GradeID: &g, SchoolName: &s}
		got := restrictGradeSchoolForRole(req, role)
		assert.Nil(t, got.GradeID, "role %s must not update grade", role)
		assert.Nil(t, got.SchoolName, "role %s must not update school", role)
	}

	for _, role := range []string{"SUPER_ADMIN", "STAFF", "GURU"} {
		req := UpdateProfileRequest{GradeID: &g, SchoolName: &s}
		got := restrictGradeSchoolForRole(req, role)
		assert.NotNil(t, got.GradeID, "role %s may update grade", role)
		assert.NotNil(t, got.SchoolName, "role %s may update school", role)
	}

	name := "Budi"
	req := UpdateProfileRequest{FullName: &name, GradeID: &g, SchoolName: &s}
	got := restrictGradeSchoolForRole(req, "SISWA")
	assert.NotNil(t, got.FullName)
	assert.Equal(t, "Budi", *got.FullName)
}

func TestIsValidRoleCode(t *testing.T) {
	cases := []struct {
		in   string
		want bool
	}{
		{"SUPER_ADMIN", true},
		{"STAFF_1", true},
		{"staff", false},
		{"A B", false},
		{"", false},
	}
	for _, c := range cases {
		if got := isValidRoleCode(c.in); got != c.want {
			t.Errorf("isValidRoleCode(%q) = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestPermissionCatalogDefaultsCoverage(t *testing.T) {
	ids := map[string]bool{}
	for _, p := range PermissionCatalog {
		ids[p.ID] = true
	}
	for role, perms := range defaultRolePerms {
		for id := range perms {
			if !ids[id] {
				t.Errorf("role %s references unknown permission %s", role, id)
			}
		}
	}
	for _, p := range PermissionCatalog {
		if strings.Count(p.ID, ".") != 1 {
			t.Errorf("permission %s should be module.code", p.ID)
		}
	}
}

func TestModuleOf(t *testing.T) {
	if moduleOf("academic.read") != "academic" {
		t.Error("moduleOf mismatch")
	}
	if resourceOf("academic.read") != "academic" {
		t.Error("resourceOf mismatch")
	}
}

func TestBuildUserWherePlaceholders(t *testing.T) {
	f := UserListFilter{Q: "x", Role: "SISWA", Status: "ACTIVE", EducationLevel: "SMA"}
	where, args := buildUserWhere(f)
	if len(args) != 4 {
		t.Fatalf("expected 4 args, got %d", len(args))
	}
	if !strings.Contains(where, "$1") || !strings.Contains(where, "$4") {
		t.Errorf("placeholder indexing broken: %s", where)
	}
	if strings.Contains(where, "$5") {
		t.Errorf("placeholder overflow: %s", where)
	}
}
