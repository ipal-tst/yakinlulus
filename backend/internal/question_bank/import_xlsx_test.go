package question_bank

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
)

func signJWTForTest(secret, sub, role string, exp time.Time) string {
	header, _ := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	payload, _ := json.Marshal(map[string]any{
		"sub":  sub,
		"role": role,
		"iat":  time.Now().Unix(),
		"exp":  exp.Unix(),
	})
	enc := func(b []byte) string { return base64.RawURLEncoding.EncodeToString(b) }
	sigInput := enc(header) + "." + enc(payload)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(sigInput))
	return sigInput + "." + enc(mac.Sum(nil))
}

// TestTemplateEndpointAuthzAndStream verifies GET /questions/import/template
// requires a valid STAFF token and streams a parseable xlsx workbook.
func TestTemplateEndpointAuthzAndStream(t *testing.T) {
	const secret = "test-secret-for-template"

	app := fiber.New()
	api := app.Group("/api/v1")
	h := NewHandler(nil, secret)
	h.RegisterRoutes(api)

	// 1) No token -> 401.
	req, _ := http.NewRequest("GET", "/api/v1/questions/import/template", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("no-token request: %v", err)
	}
	if resp.StatusCode != 401 {
		t.Fatalf("no-token status = %d, want 401", resp.StatusCode)
	}

	// 2) Valid STAFF token -> 200 and a valid xlsx.
	tok := signJWTForTest(secret, "user-1", "STAFF", time.Now().Add(time.Hour))
	req2, _ := http.NewRequest("GET", "/api/v1/questions/import/template", nil)
	req2.Header.Set("Authorization", "Bearer "+tok)
	resp2, err := app.Test(req2)
	if err != nil {
		t.Fatalf("authed request: %v", err)
	}
	if resp2.StatusCode != 200 {
		body, _ := io.ReadAll(resp2.Body)
		t.Fatalf("authed status = %d, want 200; body: %s", resp2.StatusCode, body)
	}
	if ct := resp2.Header.Get("Content-Type"); ct != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" {
		t.Errorf("content-type = %q, want xlsx", ct)
	}
	buf, _ := io.ReadAll(resp2.Body)
	if len(buf) == 0 {
		t.Fatal("empty template body")
	}
	f, err := excelize.OpenReader(bytes.NewReader(buf))
	if err != nil {
		t.Fatalf("streamed output is not a valid xlsx: %v", err)
	}
	defer f.Close()
	sheets := f.GetSheetList()
	if len(sheets) < 2 {
		t.Errorf("sheets = %v, want at least 2 sheets", sheets)
	}
}

// TestQuestionTemplateRoundTrip builds the downloadable template and parses it
// back with parseQuestionXLSX, verifying template and parser stay in sync.
func TestQuestionTemplateRoundTrip(t *testing.T) {
	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "Soal")
	f.NewSheet("Petunjuk")

	headers := questionXlsxHeaders()
	collet := excelize.ColumnNumberToName
	for i, hd := range headers {
		cellRef, _ := collet(i + 1)
		_ = f.SetCellValue("Soal", cellRef+"1", hd)
	}

	example := make([]string, questionXlsCols)
	example[xqColMapel-1] = "Matematika"
	example[xqColTipe-1] = "PG" // normalized -> SINGLE_CHOICE
	example[xqColBlockTipe-1] = "PARAGRAPH"
	example[xqColBlockIsi-1] = "Stimulus teks"
	example[xqColBlockTipe-1+2] = "IMAGE"
	example[xqColBlockIsi-1+2] = "asset-abc"
	example[xqColOptionA-1] = "Pilihan A"
	example[xqColOptionA-1+1] = "Pilihan B"
	example[xqColKunci-1] = "B"
	example[xqColSkor-1] = "5"
	for i, v := range example {
		cellRef, _ := collet(i + 1)
		_ = f.SetCellValue("Soal", cellRef+"2", v)
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		t.Fatalf("Write template: %v", err)
	}

	xls, err := excelize.OpenReader(&buf)
	if err != nil {
		t.Fatalf("OpenReader: %v", err)
	}
	defer xls.Close()

	rows, errs := ParseQuestionXLSX(xls, nil)
	if len(errs) != 0 {
		t.Fatalf("parse errors: %v", errs)
	}
	if len(rows) != 1 {
		t.Fatalf("rows = %d, want 1", len(rows))
	}
	r := rows[0]
	if r.SubjectID != "Matematika" {
		t.Errorf("subject = %q, want Matematika", r.SubjectID)
	}
	if r.QuestionsType != "SINGLE_CHOICE" {
		t.Errorf("question type = %q, want SINGLE_CHOICE", r.QuestionsType)
	}
	if len(r.Blocks) != 2 || r.Blocks[0].BlockType != "PARAGRAPH" || r.Blocks[1].BlockType != "IMAGE" {
		t.Errorf("blocks = %+v, want [PARAGRAPH, IMAGE]", r.Blocks)
	}
	if len(r.Options) != 2 || !r.Options[1].IsCorrect {
		t.Errorf("options = %+v, want A wrong, B correct", r.Options)
	}
	if r.Score != 5.0 {
		t.Errorf("score = %v, want 5", r.Score)
	}
	if r.Difficulty != "MEDIUM" {
		t.Errorf("difficulty = %q, want MEDIUM default", r.Difficulty)
	}
	if r.Language != "id" {
		t.Errorf("language = %q, want id default", r.Language)
	}
}
