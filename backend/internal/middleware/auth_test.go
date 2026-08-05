package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func signJWT(header, payload, secret string) string {
	sigInput := header + "." + payload
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(sigInput))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return sigInput + "." + sig
}

func makeToken(secret, sub, role string, expDelta time.Duration) string {
	headerB, _ := json.Marshal(jwtHeader{Alg: "HS256", Typ: "JWT"})
	header := base64.RawURLEncoding.EncodeToString(headerB)

	payload := jwtPayload{
		Sub:  sub,
		Role: role,
		Iat:  time.Now().Unix(),
		Exp:  time.Now().Add(expDelta).Unix(),
	}
	payloadB, _ := json.Marshal(payload)
	payloadEnc := base64.RawURLEncoding.EncodeToString(payloadB)

	return signJWT(header, payloadEnc, secret)
}

func setupAuthApp(secret string) *fiber.App {
	app := fiber.New()
	app.Get("/protected", RequireAuth(secret), func(c *fiber.Ctx) error {
		return c.SendString("ok")
	})
	return app
}

func TestRequireAuthValidToken(t *testing.T) {
	secret := "test-secret"
	token := makeToken(secret, "user-123", "USER", 1*time.Hour)

	app := setupAuthApp(secret)
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestRequireAuthExpiredToken(t *testing.T) {
	secret := "test-secret"
	token := makeToken(secret, "user-123", "USER", -1*time.Hour)

	app := setupAuthApp(secret)
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)
}

func TestRequireAuthNoToken(t *testing.T) {
	secret := "test-secret"
	app := setupAuthApp(secret)
	req, _ := http.NewRequest("GET", "/protected", nil)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)
}

func TestRequireAuthBadSignature(t *testing.T) {
	secret := "test-secret"
	wrongSecret := "wrong-secret"
	token := makeToken(wrongSecret, "user-123", "USER", 1*time.Hour)

	app := setupAuthApp(secret)
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)
}

func TestRequireAuthTokenFromCookie(t *testing.T) {
	secret := "test-secret"
	token := makeToken(secret, "user-123", "USER", 1*time.Hour)

	app := setupAuthApp(secret)
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.AddCookie(&http.Cookie{Name: "token", Value: token})

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

// --- RequireRole tests ---

func setupRoleApp(secret string, roles ...string) *fiber.App {
	app := fiber.New()
	app.Get("/admin", RequireAuth(secret), RequireRole(roles...), func(c *fiber.Ctx) error {
		return c.SendString("admin ok")
	})
	return app
}

func TestRequireRoleCorrectRolePasses(t *testing.T) {
	secret := "test-secret"
	token := makeToken(secret, "user-123", "ADMIN", 1*time.Hour)

	app := setupRoleApp(secret, "ADMIN", "STAFF")
	req, _ := http.NewRequest("GET", "/admin", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestRequireRoleWrongRoleReturns403(t *testing.T) {
	secret := "test-secret"
	token := makeToken(secret, "user-123", "USER", 1*time.Hour)

	app := setupRoleApp(secret, "ADMIN", "STAFF")
	req, _ := http.NewRequest("GET", "/admin", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	require.NoError(t, err)
	assert.Equal(t, 403, resp.StatusCode)
}

func TestHasAnyRole(t *testing.T) {
	cases := []struct {
		name     string
		role     string
		allowed  []string
		expected bool
	}{
		{"guru in staff list", "GURU", []string{"SUPER_ADMIN", "STAFF", "GURU"}, true},
		{"siswa not in staff list", "SISWA", []string{"SUPER_ADMIN", "STAFF", "GURU"}, false},
		{"super admin allowed", "SUPER_ADMIN", []string{"SUPER_ADMIN"}, true},
		{"empty allowed", "SISWA", []string{}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := HasAnyRole(tc.role, tc.allowed...); got != tc.expected {
				t.Fatalf("HasAnyRole(%q, %v) = %v, want %v", tc.role, tc.allowed, got, tc.expected)
			}
		})
	}
}

// --- ValidateJWT unit tests ---

func TestValidateJWTValid(t *testing.T) {
	secret := "mysecret"
	token := makeToken(secret, "user-1", "STAFF", 1*time.Hour)

	claims, err := ValidateJWT(token, secret)
	require.NoError(t, err)
	assert.Equal(t, "user-1", claims.UserID)
	assert.Equal(t, "STAFF", claims.Role)
}

func TestValidateJWTExpired(t *testing.T) {
	secret := "mysecret"
	token := makeToken(secret, "user-1", "USER", -1*time.Hour)

	_, err := ValidateJWT(token, secret)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "expired")
}

func TestValidateJWTBadFormat(t *testing.T) {
	_, err := ValidateJWT("invalid-token", "secret")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "invalid token format")
}

func TestValidateJWTFmt(t *testing.T) {
	t.Run("too_few_parts", func(t *testing.T) {
		_, err := ValidateJWT("a.b", "secret")
		assert.ErrorContains(t, err, "invalid token format")
	})

	t.Run("bad_payload_encoding", func(t *testing.T) {
		secret := "secret"
		headerB, _ := json.Marshal(jwtHeader{Alg: "HS256", Typ: "JWT"})
		header := base64.RawURLEncoding.EncodeToString(headerB)
		badPayload := base64.RawURLEncoding.EncodeToString([]byte("{{{not json}"))
		sigInput := header + "." + badPayload
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write([]byte(sigInput))
		sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
		token := sigInput + "." + sig

		_, err := ValidateJWT(token, secret)
		assert.ErrorContains(t, err, "invalid payload")
	})
}
