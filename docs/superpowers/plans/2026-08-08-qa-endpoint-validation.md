# QA Endpoint Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete QA endpoint validation suite for all 149 backend endpoints of YakinLulus.id using an automated Go CLI test runner (`backend/cmd/qa_validator`) and a comprehensive Postman Collection v2.1 with Environment configuration (`docs/qa/`).

**Architecture:** The Go CLI runner boots up, authenticates as SUPER_ADMIN, GURU, and SISWA, then systematically tests each of the 14 module test suites against `http://localhost:8080/api/v1`. It records response status, response JSON envelope compliance, role-based access control (RBAC), and latency, and generates a formatted Markdown report `docs/qa/qa_report.md` and JSON report `docs/qa/qa_report.json`. Concurrently, a complete Postman collection JSON is generated under `docs/qa/`.

**Tech Stack:** Go 1.22+, `net/http`, `encoding/json`, `testing`, Postman Collection Specification v2.1.

## Global Constraints

- Backend Base URL: `http://localhost:8080/api/v1`
- Credentials: `admin@yakinlulus.id` / `Admin@123!`, `guru.budi@yakinlulus.id` / `Admin@123!`, `murid@yakinlulus.id` / `Admin@123!`
- Must cover all 14 modules: Auth, Academic, Question Bank, CBT Exams, CBT Runtime, Scoring, Analytics, Media, Material, School + Branding, Notification, Dashboard, Exam Packages + Ranking, Practice + AI.
- No DB state changes directly via DB queries — tests perform HTTP calls against the running backend server.

---

### Task 1: Create Go QA Validator HTTP Client & Core Data Structures

**Files:**
- Create: `backend/cmd/qa_validator/client/client.go`
- Create: `backend/cmd/qa_validator/reporter/reporter.go`
- Create: `backend/cmd/qa_validator/main.go`

**Interfaces:**
- Consumes: Standard Go `net/http`
- Produces: `client.QAClient` with `Login()`, `DoRequest()`, `TestResult`, and `reporter.GenerateReport()`

- [ ] **Step 1: Write `client/client.go` with HTTP client and auth handler**

```go
package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type TestResult struct {
	ModuleName   string        `json:"module"`
	EndpointName string        `json:"endpoint"`
	Method       string        `json:"method"`
	Path         string        `json:"path"`
	ExpectedRole string        `json:"expected_role"`
	StatusCode   int           `json:"status_code"`
	ExpectedStatus int         `json:"expected_status"`
	Passed       bool          `json:"passed"`
	Latency      time.Duration `json:"latency_ms"`
	Message      string        `json:"message"`
	ResponseBody string        `json:"response_body,omitempty"`
}

type QAClient struct {
	BaseURL    string
	HTTPClient *http.Client
	Tokens     map[string]string // role -> token
}

func NewQAClient(baseURL string) *QAClient {
	return &QAClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		Tokens: make(map[string]string),
	}
}

func (c *QAClient) Login(role, email, password string) error {
	payload := map[string]string{"email": email, "password": password}
	body, _ := json.Marshal(payload)
	resp, err := c.HTTPClient.Post(c.BaseURL+"/auth/login", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("login request failed for %s: %v", role, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("login failed status %d: %s", resp.StatusCode, string(respBytes))
	}

	var res struct {
		Data struct {
			AccessToken string `json:"access_token"`
			Token       string `json:"token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return fmt.Errorf("decode login response: %v", err)
	}

	token := res.Data.AccessToken
	if token == "" {
		token = res.Data.Token
	}
	c.Tokens[role] = token
	return nil
}

func (c *QAClient) TestEndpoint(module, name, method, path, role string, expectedCode int, reqBody interface{}) TestResult {
	start := time.Now()
	var bodyReader io.Reader
	if reqBody != nil {
		b, _ := json.Marshal(reqBody)
		bodyReader = bytes.NewBuffer(b)
	}

	req, err := http.NewRequest(method, c.BaseURL+path, bodyReader)
	if err != nil {
		return TestResult{
			ModuleName: module, EndpointName: name, Method: method, Path: path,
			ExpectedRole: role, ExpectedStatus: expectedCode, Passed: false,
			Message: err.Error(),
		}
	}

	if reqBody != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	if role != "UNAUTH" {
		if token, ok := c.Tokens[role]; ok && token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	}

	resp, err := c.HTTPClient.Do(req)
	latency := time.Since(start)

	if err != nil {
		return TestResult{
			ModuleName: module, EndpointName: name, Method: method, Path: path,
			ExpectedRole: role, ExpectedStatus: expectedCode, Passed: false,
			Latency: latency, Message: err.Error(),
		}
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	passed := resp.StatusCode == expectedCode

	msg := "OK"
	if !passed {
		msg = fmt.Sprintf("Expected status %d, got %d", expectedCode, resp.StatusCode)
	}

	return TestResult{
		ModuleName: module, EndpointName: name, Method: method, Path: path,
		ExpectedRole: role, StatusCode: resp.StatusCode, ExpectedStatus: expectedCode,
		Passed: passed, Latency: latency, Message: msg, ResponseBody: string(respBytes),
	}
}
```

- [ ] **Step 2: Write `reporter/reporter.go` for Markdown and Console Output**

```go
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
```

- [ ] **Step 3: Write `main.go` entrypoint**

```go
package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"yakinlulus.id/backend/cmd/qa_validator/client"
	"yakinlulus.id/backend/cmd/qa_validator/reporter"
	"yakinlulus.id/backend/cmd/qa_validator/suites"
)

func main() {
	baseURL := flag.String("base-url", "http://localhost:8080/api/v1", "Base API URL")
	reportMD := flag.String("report-md", "../docs/qa/qa_report.md", "Output Markdown report file path")
	reportJSON := flag.String("report-json", "../docs/qa/qa_report.json", "Output JSON report file path")
	flag.Parse()

	log.Printf("Starting QA Endpoint Validator against %s...", *baseURL)
	c := client.NewQAClient(*baseURL)

	// Login accounts
	log.Println("Authenticating default users...")
	if err := c.Login("SUPER_ADMIN", "admin@yakinlulus.id", "Admin@123!"); err != nil {
		log.Printf("Warning: SUPER_ADMIN login failed: %v", err)
	}
	if err := c.Login("GURU", "guru.budi@yakinlulus.id", "Admin@123!"); err != nil {
		log.Printf("Warning: GURU login failed: %v", err)
	}
	if err := c.Login("SISWA", "murid@yakinlulus.id", "Admin@123!"); err != nil {
		log.Printf("Warning: SISWA login failed: %v", err)
	}

	var allResults []client.TestResult

	// Execute Test Suites
	allResults = append(allResults, suites.RunAuthSuite(c)...)
	allResults = append(allResults, suites.RunAcademicSuite(c)...)
	allResults = append(allResults, suites.RunQuestionBankSuite(c)...)
	allResults = append(allResults, suites.RunCBTExamsSuite(c)...)
	allResults = append(allResults, suites.RunCBTRuntimeSuite(c)...)
	allResults = append(allResults, suites.RunScoringSuite(c)...)
	allResults = append(allResults, suites.RunAnalyticsSuite(c)...)
	allResults = append(allResults, suites.RunMediaSuite(c)...)
	allResults = append(allResults, suites.RunMaterialSuite(c)...)
	allResults = append(allResults, suites.RunSchoolSuite(c)...)
	allResults = append(allResults, suites.RunNotificationSuite(c)...)
	allResults = append(allResults, suites.RunDashboardSuite(c)...)
	allResults = append(allResults, suites.RunExamPackagesSuite(c)...)
	allResults = append(allResults, suites.RunPracticeAISuite(c)...)

	passedCount := 0
	for _, r := range allResults {
		if r.Passed {
			passedCount++
		}
	}

	log.Printf("QA Execution Finished! Total: %d, Passed: %d, Failed: %d", len(allResults), passedCount, len(allResults)-passedCount)

	if err := reporter.SaveReports(allResults, *reportMD, *reportJSON); err != nil {
		log.Fatalf("Failed to save QA reports: %v", err)
	}
	log.Printf("Reports successfully saved to %s and %s", *reportMD, *reportJSON)
}
```

---

### Task 2: Implement Test Suites in `backend/cmd/qa_validator/suites/`

**Files:**
- Create: `backend/cmd/qa_validator/suites/suites.go` containing all 14 module test suite runners covering 149 endpoints.

- [ ] **Step 1: Write `backend/cmd/qa_validator/suites/suites.go`** with modular functions for Auth, Academic, Question Bank, CBT Exams, CBT Runtime, Scoring, Analytics, Media, Material, School, Notification, Dashboard, Exam Packages, and Practice/AI suites.

---

### Task 3: Create Postman Collection v2.1 & Environment Files

**Files:**
- Create: `docs/qa/YakinLulus_QA.postman_collection.json`
- Create: `docs/qa/YakinLulus_Dev.postman_environment.json`

- [ ] **Step 1: Build `YakinLulus_QA.postman_collection.json`** containing all 14 folders and 149 endpoints with request URLs, HTTP methods, authorization headers, request bodies, and Postman assertion scripts.
- [ ] **Step 2: Build `YakinLulus_Dev.postman_environment.json`** with `base_url`, `admin_token`, `guru_token`, `siswa_token`, and sample test parameters.

---

### Task 4: Execute QA Runner & Generate Initial Report

- [ ] **Step 1: Verify backend is active or start server**
- [ ] **Step 2: Run `go run ./cmd/qa_validator`** from `backend/`
- [ ] **Step 3: Verify `docs/qa/qa_report.md` output**
