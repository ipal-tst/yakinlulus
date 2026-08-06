package content_test

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"

	"yakinlulus.id/backend/internal/middleware"
)

func sign(secret string, sub, role string) string {
	h, _ := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	hb := base64.RawURLEncoding.EncodeToString(h)
	p, _ := json.Marshal(map[string]interface{}{"sub": sub, "role": role, "iat": time.Now().Unix(), "exp": time.Now().Add(time.Hour).Unix()})
	pb := base64.RawURLEncoding.EncodeToString(p)
	sigIn := hb + "." + pb
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(sigIn))
	return sigIn + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

// TestGenericContentRouteDeniesGURUWrite verifies the generic /contents write
// routes (which lack per-row ownership) do NOT accept a GURU caller, so a GURU
// cannot DELETE/PUT a material/exam owned by another user through
// /contents/:id — the ownership bypass the gate remap had briefly opened.
func TestGenericContentRouteDeniesGURUWrite(t *testing.T) {
	secret := "test-secret"
	app := fiber.New()
	api := app.Group("/api/v1")
	auth := middleware.RequireAuth(secret)
	// Mirror content.Handler.RegisterRoutes write-gate: SUPER_ADMIN/STAFF only.
	contents := api.Group("/contents", auth)
	contents.Post("/", middleware.RequireRole("SUPER_ADMIN", "STAFF"), func(c *fiber.Ctx) error { return c.SendStatus(http.StatusNoContent) })
	contents.Put("/:id", middleware.RequireRole("SUPER_ADMIN", "STAFF"), func(c *fiber.Ctx) error { return c.SendStatus(http.StatusNoContent) })
	contents.Delete("/:id", middleware.RequireRole("SUPER_ADMIN", "STAFF"), func(c *fiber.Ctx) error { return c.SendStatus(http.StatusNoContent) })

	uri := "/api/v1/contents/00000000-0000-0000-0000-000000000000"
	send := func(tok, method, path string) int {
		req := httptest.NewRequest(method, path, nil)
		req.Header.Set("Authorization", "Bearer "+tok)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("request %s %s: %v", method, path, err)
		}
		return resp.StatusCode
	}

	guru := sign(secret, "guruA", middleware.RoleGuru)
	if code := send(guru, http.MethodDelete, uri); code != http.StatusForbidden && code != http.StatusUnauthorized {
		t.Fatalf("GURU DELETE /contents/:id status = %d, want 403/401 denied", code)
	}
	if code := send(guru, http.MethodPut, uri); code != http.StatusForbidden && code != http.StatusUnauthorized {
		t.Fatalf("GURU PUT /contents/:id status = %d, want 403/401 denied", code)
	}
	if code := send(guru, http.MethodPost, "/api/v1/contents/"); code != http.StatusForbidden && code != http.StatusUnauthorized {
		t.Fatalf("GURU POST /contents status = %d, want 403/401 denied", code)
	}

	// STAFF is admitted: 204 No Content from the stub.
	staff := sign(secret, "staff", middleware.RoleStaff)
	if code := send(staff, http.MethodDelete, uri); code != http.StatusNoContent {
		t.Fatalf("STAFF DELETE /contents/:id status = %d, want 204 admitted", code)
	}
}