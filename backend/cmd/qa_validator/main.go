package main

import (
	"flag"
	"log"

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
