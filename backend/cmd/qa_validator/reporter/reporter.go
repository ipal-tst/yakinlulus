package reporter

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"yakinlulus.id/backend/cmd/qa_validator/client"
)

func SaveReports(results []client.TestResult, mdPath, jsonPath string) error {
	total := len(results)
	passed := 0
	failed := 0
	var totalLatency time.Duration

	for _, r := range results {
		if r.Passed {
			passed++
		} else {
			failed++
		}
		totalLatency += r.Latency
	}

	avgLatency := time.Duration(0)
	if total > 0 {
		avgLatency = totalLatency / time.Duration(total)
	}

	// 1. Write Markdown Report
	_ = os.MkdirAll(filepath.Dir(mdPath), 0755)
	mdFile, err := os.Create(mdPath)
	if err != nil {
		return fmt.Errorf("create md report: %v", err)
	}
	defer mdFile.Close()

	fmt.Fprintf(mdFile, "# QA Endpoint Validation Report\n\n")
	fmt.Fprintf(mdFile, "**Generated**: %s  \n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Fprintf(mdFile, "**Total Tests**: %d | **Passed**: %d | **Failed**: %d | **Pass Rate**: %.2f%%  \n",
		total, passed, failed, float64(passed)/float64(total)*100)
	fmt.Fprintf(mdFile, "**Avg Latency**: %v\n\n", avgLatency)

	fmt.Fprintf(mdFile, "## Results Summary Table\n\n")
	fmt.Fprintf(mdFile, "| # | Module | Method | Endpoint Path | Role | Status | Expected | Result | Latency |\n")
	fmt.Fprintf(mdFile, "|---|--------|--------|---------------|------|--------|----------|--------|---------|\n")

	for i, r := range results {
		resStr := "✅ PASS"
		if !r.Passed {
			resStr = "❌ FAIL"
		}
		fmt.Fprintf(mdFile, "| %d | %s | `%s` | `%s` | %s | %d | %d | %s | %v |\n",
			i+1, r.ModuleName, r.Method, r.Path, r.ExpectedRole, r.StatusCode, r.ExpectedStatus, resStr, r.Latency.Round(time.Millisecond))
	}

	// 2. Write JSON Report
	_ = os.MkdirAll(filepath.Dir(jsonPath), 0755)
	jsonBytes, err := json.MarshalIndent(results, "", "  ")
	if err == nil {
		_ = os.WriteFile(jsonPath, jsonBytes, 0644)
	}

	return nil
}
