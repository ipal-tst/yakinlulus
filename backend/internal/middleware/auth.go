package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"yakinlulus.id/backend/internal/shared"
)

type RBACConfig struct {
	Secret string
}

type JWTClaims struct {
	UserID string
	Role   string
}

func RequireAuth(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := extractToken(c)
		if token == "" {
			return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Missing authentication token"))
		}

		claims, err := ValidateJWT(token, secret)
		if err != nil {
			return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Invalid or expired token"))
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("role", claims.Role)
		return c.Next()
	}
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role")
		if role == nil {
			return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
		}

		for _, r := range roles {
			if role.(string) == r {
				return c.Next()
			}
		}

		return c.Status(403).JSON(shared.Error(shared.ErrForbidden, "Insufficient permissions"))
	}
}

type jwtHeader struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

type jwtPayload struct {
	Sub  string `json:"sub"`
	Role string `json:"role"`
	Iat  int64  `json:"iat"`
	Exp  int64  `json:"exp"`
}

func ValidateJWT(token, secret string) (*JWTClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	sigInput := parts[0] + "." + parts[1]
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(sigInput))
	expectedSig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(expectedSig), []byte(parts[2])) {
		return nil, fmt.Errorf("invalid signature")
	}

	payloadB, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid payload encoding")
	}

	var payload jwtPayload
	if err := json.Unmarshal(payloadB, &payload); err != nil {
		return nil, fmt.Errorf("invalid payload")
	}

	if time.Now().Unix() > payload.Exp {
		return nil, fmt.Errorf("token expired")
	}

	return &JWTClaims{
		UserID: payload.Sub,
		Role:   payload.Role,
	}, nil
}

func extractToken(c *fiber.Ctx) string {
	token := c.Cookies("token")
	if token != "" {
		return token
	}
	auth := c.Get("Authorization")
	if len(auth) > 7 && auth[:7] == "Bearer " {
		return auth[7:]
	}
	return ""
}
