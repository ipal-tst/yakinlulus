package cbt_engine

import (
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestPracticeRoutesUseExamPracticePrefix(t *testing.T) {
	app := fiber.New()
	h := NewHandler(nil, "test-secret")
	h.RegisterRoutes(app)

	paths := routePaths(app)
	hasExamPractice := false
	for _, p := range paths {
		if strings.Contains(p, "/exam-practice") {
			hasExamPractice = true
		}
		if strings.Contains(p, "/practice/material") ||
			strings.Contains(p, "/practice/subject") ||
			strings.Contains(p, "/practice/tags") ||
			strings.Contains(p, "/practice/:sessionId") {
			t.Errorf("cbt_engine must not register legacy /practice path: %s", p)
		}
	}
	if !hasExamPractice {
		t.Errorf("expected routes under /exam-practice, got: %v", paths)
	}

	expected := []string{
		"/exam-practice/material/:materialId",
		"/exam-practice/subject",
		"/exam-practice/tags",
		"/exam-practice/:sessionId/submit",
		"/exam-practice/:sessionId",
	}
	for _, want := range expected {
		found := false
		for _, p := range paths {
			if strings.HasSuffix(p, want) {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("missing route %s in %v", want, paths)
		}
	}
}

func routePaths(app *fiber.App) []string {
	var out []string
	for _, group := range app.Stack() {
		for _, rt := range group {
			if rt.Method == "HEAD" {
				continue
			}
			out = append(out, rt.Method+" "+rt.Path)
		}
	}
	return out
}
