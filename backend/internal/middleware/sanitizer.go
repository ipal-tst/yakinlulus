package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// SanitizeRequest strips common XSS patterns from request body strings.
func SanitizeRequest() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Only sanitize JSON/POST bodies
		if len(c.Body()) == 0 {
			return c.Next()
		}

		raw := string(c.Body())
		clean := sanitize(raw)
		if clean != raw {
			c.Request().SetBody([]byte(clean))
		}
		return c.Next()
	}
}

func sanitize(s string) string {
	s = strings.ReplaceAll(s, "<script>", "&lt;script&gt;")
	s = strings.ReplaceAll(s, "</script>", "&lt;/script&gt;")
	s = strings.ReplaceAll(s, "javascript:", "javascript-blocked:")
	s = strings.ReplaceAll(s, "onerror=", "onerror-blocked=")
	s = strings.ReplaceAll(s, "onload=", "onload-blocked=")
	s = strings.ReplaceAll(s, "onclick=", "onclick-blocked=")
	return s
}
