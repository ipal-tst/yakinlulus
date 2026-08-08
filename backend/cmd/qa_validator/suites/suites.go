package suites

import (
	"fmt"
	"net/http"

	"yakinlulus.id/backend/cmd/qa_validator/client"
)

// Helper ID placeholder for parameterized routes
const (
	SampleUUID = "00000000-0000-0000-0000-000000000000"
)

func RunAuthSuite(c *client.QAClient) []client.TestResult {
	module := "Auth"
	return []client.TestResult{
		c.TestEndpoint(module, "Get Current User Profile", "GET", "/auth/me", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Users List", "GET", "/auth/users", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Search Users", "GET", "/auth/users/search?q=test", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get User Profile (Unauthenticated - RBAC check)", "GET", "/auth/me", "UNAUTH", http.StatusUnauthorized, nil),
		c.TestEndpoint(module, "Admin Users List (Student - RBAC check)", "GET", "/auth/users", "SISWA", http.StatusForbidden, nil),
	}
}

func RunAcademicSuite(c *client.QAClient) []client.TestResult {
	module := "Academic"
	return []client.TestResult{
		c.TestEndpoint(module, "Get Education Levels", "GET", "/academic/levels", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Academic Subjects", "GET", "/academic/subjects", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Curriculums", "GET", "/academic/curriculums", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Subject Detail", "GET", "/academic/subjects/"+SampleUUID, "SUPER_ADMIN", http.StatusNotFound, nil),
	}
}

func RunQuestionBankSuite(c *client.QAClient) []client.TestResult {
	module := "Question Bank"
	return []client.TestResult{
		c.TestEndpoint(module, "List Questions", "GET", "/questions", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Export Questions", "GET", "/questions/export", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Question Detail", "GET", "/questions/"+SampleUUID, "SUPER_ADMIN", http.StatusNotFound, nil),
	}
}

func RunCBTExamsSuite(c *client.QAClient) []client.TestResult {
	module := "CBT Engine"
	return []client.TestResult{
		c.TestEndpoint(module, "List Exams", "GET", "/exams", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Exam Detail", "GET", "/exams/"+SampleUUID, "SUPER_ADMIN", http.StatusNotFound, nil),
		c.TestEndpoint(module, "Get Exam Rule", "GET", "/exams/"+SampleUUID+"/rule", "SUPER_ADMIN", http.StatusNotFound, nil),
		c.TestEndpoint(module, "Get Exam Blueprint", "GET", "/exams/"+SampleUUID+"/blueprint", "SUPER_ADMIN", http.StatusNotFound, nil),
	}
}

func RunCBTRuntimeSuite(c *client.QAClient) []client.TestResult {
	module := "CBT Runtime"
	return []client.TestResult{
		c.TestEndpoint(module, "Start Exam Invalid ID", "POST", "/cbt/"+SampleUUID+"/start", "SISWA", http.StatusNotFound, nil),
		c.TestEndpoint(module, "Admin Auto Submit", "POST", "/cbt/admin/auto-submit", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Admin Auto Submit (Siswa RBAC)", "POST", "/cbt/admin/auto-submit", "SISWA", http.StatusForbidden, nil),
	}
}

func RunScoringSuite(c *client.QAClient) []client.TestResult {
	module := "Scoring"
	return []client.TestResult{
		c.TestEndpoint(module, "List Exam Results", "GET", "/results/", "SISWA", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Session Result", "GET", "/results/"+SampleUUID, "SISWA", http.StatusNotFound, nil),
	}
}

func RunAnalyticsSuite(c *client.QAClient) []client.TestResult {
	module := "Analytics"
	return []client.TestResult{
		c.TestEndpoint(module, "Admin Exam Reports", "GET", "/analytics/admin/reports/exams", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Student Analytics Detail", "GET", "/analytics/students/"+SampleUUID, "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Admin Exam Reports (Siswa RBAC)", "GET", "/analytics/admin/reports/exams", "SISWA", http.StatusForbidden, nil),
	}
}

func RunMediaSuite(c *client.QAClient) []client.TestResult {
	module := "Media"
	return []client.TestResult{
		c.TestEndpoint(module, "Get Media Entity", "GET", "/media/entity/question/"+SampleUUID, "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Media Item", "GET", "/media/"+SampleUUID, "SUPER_ADMIN", http.StatusNotFound, nil),
	}
}

func RunMaterialSuite(c *client.QAClient) []client.TestResult {
	module := "Material"
	return []client.TestResult{
		c.TestEndpoint(module, "List Study Materials", "GET", "/materials/", "SISWA", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Overall Progress", "GET", "/materials/progress", "SISWA", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Material Detail", "GET", "/materials/"+SampleUUID, "SISWA", http.StatusNotFound, nil),
	}
}

func RunSchoolSuite(c *client.QAClient) []client.TestResult {
	module := "School"
	return []client.TestResult{
		c.TestEndpoint(module, "List Schools", "GET", "/schools", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get School Branding (Invalid ID)", "GET", "/schools/"+SampleUUID+"/branding", "SUPER_ADMIN", http.StatusInternalServerError, nil),
		c.TestEndpoint(module, "Get School Settings (Invalid ID)", "GET", "/schools/"+SampleUUID+"/settings", "SUPER_ADMIN", http.StatusInternalServerError, nil),
	}
}

func RunNotificationSuite(c *client.QAClient) []client.TestResult {
	module := "Notifications"
	return []client.TestResult{
		c.TestEndpoint(module, "List Notifications", "GET", "/notifications", "SISWA", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Unread Count", "GET", "/notifications/unread-count", "SISWA", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Notification Templates", "GET", "/notification-templates", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Get Templates (Siswa RBAC)", "GET", "/notification-templates", "SISWA", http.StatusForbidden, nil),
	}
}

func RunDashboardSuite(c *client.QAClient) []client.TestResult {
	module := "Dashboard"
	return []client.TestResult{
		c.TestEndpoint(module, "Student Dashboard", "GET", "/dashboard/student", "SISWA", http.StatusOK, nil),
		c.TestEndpoint(module, "Teacher Dashboard", "GET", "/dashboard/teacher", "GURU", http.StatusOK, nil),
		c.TestEndpoint(module, "Admin Dashboard", "GET", "/dashboard/admin", "SUPER_ADMIN", http.StatusOK, nil),
		c.TestEndpoint(module, "Admin Dashboard (Siswa RBAC)", "GET", "/dashboard/admin", "SISWA", http.StatusForbidden, nil),
	}
}

func RunExamPackagesSuite(c *client.QAClient) []client.TestResult {
	module := "Exam Packages"
	return []client.TestResult{
		c.TestEndpoint(module, "List Exam Packages", "GET", "/exam-packages", "SISWA", http.StatusOK, nil),
		c.TestEndpoint(module, "Leaderboard (Missing package_id)", "GET", "/leaderboard", "SISWA", http.StatusBadRequest, nil),
		c.TestEndpoint(module, "Get Package Exams", "GET", fmt.Sprintf("/exam-packages/%s/exams", SampleUUID), "SISWA", http.StatusOK, nil),
	}
}

func RunPracticeAISuite(c *client.QAClient) []client.TestResult {
	module := "Practice & AI"
	return []client.TestResult{
		c.TestEndpoint(module, "List Practice Sessions", "GET", "/practice/sessions", "SISWA", http.StatusOK, nil),
		c.TestEndpoint(module, "Practice Stats", "GET", "/practice/stats", "SISWA", http.StatusOK, nil),
		c.TestEndpoint(module, "AI Tutor Conversations (No AI key)", "POST", "/ai/tutor/conversations", "SISWA", http.StatusInternalServerError, map[string]string{"title": "QA Test Conversation"}),
	}
}
