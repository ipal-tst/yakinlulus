package question_bank

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"

	"yakinlulus.id/backend/internal/shared"
)

// Soal sheet column map (1-indexed on the sheet).
const (
	xqColNo         = 1
	xqColKode       = 2
	xqColMapel      = 3
	xqColKelas      = 4
	xqColBab        = 5
	xqColTipe       = 6
	xqColKesulitan  = 7
	xqColBlockTipe  = 8  // Blok i – Tipe (cols 8,10,12,14)
	xqColBlockIsi   = 9  // Blok i – Isi  (cols 9,11,13,15)
	xqColOptionA    = 16 // Opsi A..H     (cols 16..23)
	xqColKunci      = 24
	xqColSkor       = 25
	xqColSkorNeg    = 26
	xqColPembahasan = 27
	xqColBloom      = 28
	xqColBahasa     = 29
	questionXlsCols = 29
)

const (
	xqBlockPairs  = 4
	xqOptColumns  = 8
	xqMaxFileSize = 15 << 20
)

func xqCell(row []string, col int) string {
	idx := col - 1
	if idx < 0 || idx >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[idx])
}

func xqNormalizeBlockType(t string) string {
	switch strings.ToUpper(strings.TrimSpace(t)) {
	case "IMAGE", "GAMBAR", "IMG":
		return "IMAGE"
	default:
		return "PARAGRAPH"
	}
}

func xqNormalizeQuestionType(t string) string {
	switch strings.ToUpper(strings.TrimSpace(t)) {
	case "SINGLE", "PG", "PILIHAN GANDA", "PILIHAN_GANDA":
		return "SINGLE_CHOICE"
	case "MULTIPLE", "MULTIPLE_CHOICE", "PGK", "PILIHAN GANDA KOMPLEKS", "MCMA":
		return "MULTIPLE_CHOICE"
	case "TRUE_FALSE", "TF", "BENAR/SALAH", "BENAR SALAH":
		return "TRUE_FALSE"
	default:
		return "SINGLE_CHOICE"
	}
}

func ptrStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// parseQuestionXLSX reads the "Soal" sheet into ImportRow values. It returns
func parseQuestionXLSX(f *excelize.File) ([]ImportRow, []string) {
	sheet := "Soal"
	if idx, err := f.GetSheetIndex(sheet); err != nil || idx == -1 {
		if idx2, err2 := f.GetSheetIndex("Soal (Isi)"); err2 == nil && idx2 != -1 {
			sheet = "Soal (Isi)"
		} else {
			return nil, []string{"Sheet 'Soal' tidak ditemukan di file"}
		}
	}

	raw, err := f.GetRows(sheet)
	if err != nil || len(raw) == 0 {
		return nil, []string{"Sheet 'Soal' kosong atau tidak dapat dibaca"}
	}

	var out []ImportRow
	var errs []string
	letters := "ABCDEFGH"

	for i := 1; i < len(raw); i++ { // skip header row
		row := raw[i]
		mapel := xqCell(row, xqColMapel)
		if mapel == "" {
			continue // blank line
		}
		content := xqCell(row, xqColBlockIsi)
		if content == "" {
			errs = append(errs, fmt.Sprintf("baris %d: kolom 'Blok 1 - Isi' kosong", i+1))
			continue
		}

		var blocks []QuestionBlock
		for b := 0; b < xqBlockPairs; b++ {
			tipe := xqNormalizeBlockType(xqCell(row, xqColBlockTipe+b*2))
			isi := xqCell(row, xqColBlockIsi+b*2)
			if isi == "" {
				continue
			}
			blocks = append(blocks, QuestionBlock{BlockType: tipe, Content: isi})
		}

		correctMap := map[string]bool{}
		for _, k := range stringsToUpperChars(xqCell(row, xqColKunci)) {
			correctMap[k] = true
		}

		var opts []QuestionOption
		for i := 0; i < xqOptColumns; i++ {
			optContent := xqCell(row, xqColOptionA+i)
			if optContent == "" {
				continue
			}
			label := string(letters[i])
			opts = append(opts, QuestionOption{
				Label:     label,
				Content:   optContent,
				IsCorrect: correctMap[label],
			})
		}

		var correctCount int
		for _, o := range opts {
			if o.IsCorrect {
				correctCount++
			}
		}
		qType := xqNormalizeQuestionType(xqCell(row, xqColTipe))
		if correctCount > 1 && qType == "SINGLE_CHOICE" {
			qType = "MULTIPLE_CHOICE"
		}

		difficulty := strings.ToUpper(xqCell(row, xqColKesulitan))
		if difficulty != "EASY" && difficulty != "MEDIUM" && difficulty != "HARD" && difficulty != "VERY_HARD" {
			difficulty = "MEDIUM"
		}

		score, _ := strconv.ParseFloat(xqCell(row, xqColSkor), 64)
		neg, _ := strconv.ParseFloat(xqCell(row, xqColSkorNeg), 64)

		lang := strings.ToLower(xqCell(row, xqColBahasa))
		if lang == "" {
			lang = "id"
		}

		out = append(out, ImportRow{
			Content:       content,
			Difficulty:    difficulty,
			SubjectID:     mapel,
			QuestionsType: qType,
			BloomLevel:    ptrStr(xqCell(row, xqColBloom)),
			Language:      lang,
			Explanation:   xqCell(row, xqColPembahasan),
			Score:         score,
			NegativeScore: neg,
			Options:       opts,
			Blocks:        blocks,
		})
	}
	return out, errs
}

func stringsToUpperChars(s string) []string {
	var out []string
	for _, r := range s {
		out = append(out, strings.ToUpper(string(r)))
	}
	return out
}

// resolveQuestionSubject returns a subject ID by UUID, then by name/code, then
// falls back to the first subject in the database.
func (h *Handler) resolveQuestionSubject(ctx context.Context, raw string) (uuid.UUID, error) {
	r := strings.TrimSpace(raw)
	if id, err := uuid.Parse(r); err == nil {
		return id, nil
	}
	if r != "" {
		var found uuid.UUID
		if err := h.svc.repo.pool.QueryRow(ctx, `SELECT id FROM academic.subject WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 1`, r).Scan(&found); err == nil {
			return found, nil
		}
	}
	var first uuid.UUID
	if err := h.svc.repo.pool.QueryRow(ctx, `SELECT id FROM academic.subject ORDER BY created_at ASC LIMIT 1`).Scan(&first); err == nil {
		return first, nil
	}
	return uuid.Nil, errors.New("Mapel tidak ditemukan di database")
}

func resolveChapterID(s *string) *uuid.UUID {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil
	}
	if id, err := uuid.Parse(strings.TrimSpace(*s)); err == nil {
		return &id
	}
	return nil
}

func (h *Handler) ImportQuestionsXLSX(c *fiber.Ctx) error {
	fh, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Field 'file' (multipart) diperlukan"))
	}
	if fh.Size > xqMaxFileSize {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Ukuran file melebihi batas 15MB"))
	}
	if !strings.HasSuffix(strings.ToLower(fh.Filename), ".xlsx") {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Format file harus .xlsx"))
	}

	f, err := fh.Open()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Gagal membuka file"))
	}
	defer f.Close()

	xls, err := excelize.OpenReader(f)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "File Excel tidak valid: "+err.Error()))
	}
	defer xls.Close()

	rows, rowErrs := parseQuestionXLSX(xls)
	if len(rowErrs) > 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Baris bermasalah: "+strings.Join(rowErrs, "; ")))
	}
	if len(rows) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Tidak ada data soal valid di sheet 'Soal'"))
	}

	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Belum terautentikasi"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "User ID tidak valid"))
	}

	jobID, _ := h.svc.repo.CreateImportJob(c.Context(), "soal_import.xlsx", len(rows), userID)

	var created int
	var failed []string
	for idx, row := range rows {
		rawBytes, _ := json.Marshal(row)

		subjID, serr := h.resolveQuestionSubject(c.Context(), row.SubjectID)
		if serr != nil {
			failed = append(failed, serr.Error())
			_ = h.svc.repo.CreateImportRowLog(c.Context(), jobID, idx+1, rawBytes, "ERROR", serr.Error(), nil)
			continue
		}

		var opts []CreateOptionReq
		for _, o := range row.Options {
			opts = append(opts, CreateOptionReq{Label: o.Label, Content: o.Content, Correct: o.IsCorrect})
		}

		chID := resolveChapterID(row.ChapterID)
		req := CreateQuestionReq{
			SubjectID:     subjID.String(),
			Content:       row.Content,
			Difficulty:    row.Difficulty,
			QuestionType:  row.QuestionsType,
			Topic:         row.Topic,
			BloomLevel:    row.BloomLevel,
			Language:      row.Language,
			Source:        row.Source,
			TopicID:       row.TopicID,
			SubTopicID:    row.SubTopicID,
			StimulusID:    row.StimulusID,
			Score:         row.Score,
			NegativeScore: row.NegativeScore,
			EstimatedTime: row.EstimatedTime,
			ThinkingLevel: row.ThinkingLevel,
			Explanation:   row.Explanation,
			Options:       opts,
			Blocks:        row.Blocks,
		}
		if chID != nil {
			s := chID.String()
			req.ChapterID = &s
		}

		q, err := h.svc.Create(c.Context(), req, userID)
		if err != nil {
			e := row.Content
			if len(e) > 30 {
				e = e[:30]
			}
			errStr := fmt.Sprintf("Baris '%s...': %v", e, err)
			failed = append(failed, errStr)
			_ = h.svc.repo.CreateImportRowLog(c.Context(), jobID, idx+1, rawBytes, "ERROR", errStr, nil)
		} else {
			created++
			if q != nil {
				_ = h.svc.repo.CreateImportRowLog(c.Context(), jobID, idx+1, rawBytes, "IMPORTED", "", &q.ID)
			}
		}
	}

	if jobID != uuid.Nil {
		status := "COMPLETED"
		if created == 0 && len(failed) > 0 {
			status = "FAILED"
		}
		_ = h.svc.repo.UpdateImportJob(c.Context(), jobID, created, len(failed), status, strings.Join(failed, "\n"))
	}

	return c.Status(200).JSON(shared.Success(fiber.Map{
		"job_id":  jobID,
		"created": created,
		"failed":  len(failed),
		"errors":  failed,
	}))
}

func questionXlsxHeaders() []string {
	headers := []string{"No", "Kode", "Mapel", "Kelas", "Bab (ID)", "Tipe Soal", "Kesulitan"}
	for i := 1; i <= xqBlockPairs; i++ {
		headers = append(headers,
			fmt.Sprintf("Blok %d - Tipe", i),
			fmt.Sprintf("Blok %d - Isi", i))
	}
	letters := "ABCDEFGH"
	for i := 0; i < xqOptColumns; i++ {
		headers = append(headers, "Opsi "+string(letters[i]))
	}
	headers = append(headers, "Kunci Jawaban", "Skor", "Skor Negatif", "Pembahasan", "Bloom Level", "Bahasa")
	return headers
}

// QuestionImportTemplate streams a downloadable .xlsx template.
func (h *Handler) QuestionImportTemplate(c *fiber.Ctx) error {
	f := excelize.NewFile()
	defer f.Close()

	f.SetSheetName("Sheet1", "Soal")
	f.NewSheet("Petunjuk")

	headers := questionXlsxHeaders()
	colLetters := excelize.ColumnNumberToName
	for i, hd := range headers {
		cellRef, _ := colLetters(i + 1)
		_ = f.SetCellValue("Soal", cellRef+"1", hd)
	}

	// Example row
	example := make([]string, questionXlsCols)
	example[xqColMapel-1] = "Matematika"
	example[xqColKelas-1] = "10"
	example[xqColTipe-1] = "SINGLE_CHOICE"
	example[xqColKesulitan-1] = "MEDIUM"
	example[xqColBlockTipe-1] = "PARAGRAPH"
	example[xqColBlockIsi-1] = "Contoh teks soal di sini..."
	example[xqColBlockTipe-1+2] = "IMAGE"
	example[xqColBlockIsi-1+2] = "asset-id-uuid-atau-tautan-gambar"
	example[xqColOptionA-1] = "Pilihan jawaban A"
	example[xqColOptionA-1+1] = "Pilihan jawaban B"
	example[xqColOptionA-1+2] = "Pilihan jawaban C"
	example[xqColOptionA-1+3] = "Pilihan jawaban D"
	example[xqColKunci-1] = "A"
	example[xqColSkor-1] = "5"
	example[xqColSkorNeg-1] = "0"
	example[xqColBloom-1] = "C3"
	example[xqColBahasa-1] = "id"
	for i, v := range example {
		cellRef, _ := colLetters(i + 1)
		_ = f.SetCellValue("Soal", cellRef+"2", v)
	}

	// Styling
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#2563EB"}},
	})
	_ = f.SetCellStyle("Soal", "A1", "AC1", headerStyle)

	widths := map[string]float64{
		"A": 6, "B": 12, "C": 22, "D": 10, "E": 24,
		"F": 18, "G": 14, "H": 12, "I": 42, "J": 12, "K": 42,
		"L": 12, "M": 42, "N": 12, "O": 42, "P": 12, "Q": 42,
		"R": 12, "S": 42, "T": 12, "U": 42, "V": 12, "W": 42,
		"X": 16, "Y": 10, "Z": 12, "AA": 42, "AB": 12, "AC": 10,
	}
	for col, w := range widths {
		_ = f.SetColWidth("Soal", col, col, w)
	}
	_ = f.SetPanes("Soal", &excelize.Panes{
		Freeze:      true,
		YSplit:      1,
		TopLeftCell: "A2",
		ActivePane:  "bottomLeft",
	})

	_ = f.AutoFilter("Soal", "A1:AC1", []excelize.AutoFilterOptions{})

	// Petunjuk sheet
	instructions := [][]string{
		{"PENGISIAN FILE TEMPLATE IMPORT SOAL"},
		{""},
		{"1. Isi setiap baris = 1 soal. Jangan edit baris header (No s/d Bahasa)."},
		{"2. Mapel: tulis nama mapel persis (contoh: Matematika) atau kode mapel."},
		{"3. Bab (ID): opsional, diisi ID bab (UUID) jika ada."},
		{"4. Tipe Soal: SINGLE_CHOICE / MULTIPLE_CHOICE / TRUE_FALSE. Kosongkan = SINGLE_CHOICE."},
		{"5. Kesulitan: EASY / MEDIUM / HARD. Kosongkan = MEDIUM."},
		{"6. Blok digunakan untuk konten kaya: urutan PARAGRAPH > IMAGE > PARAGRAPH. Tipe IMAGE diisi ID aset (asset id) di kolom Isi."},
		{"7. Kunci Jawaban: huruf jawaban benar (A s/d H). MULTIPLE_CHOICE boleh lebih dari satu huruf (contoh: A,C)."},
		{"8. Kolom Opsi yang tidak terpakai cukup dikosongkan."},
		{"9. Baris dengan Mapel kosong akan diabaikan."},
	}
	for i, line := range instructions {
		cellRef, _ := colLetters(1)
		_ = f.SetCellValue("Petunjuk", cellRef+fmt.Sprintf("%d", i+1), line[0])
	}
	_ = f.SetColWidth("Petunjuk", "A", "A", 120)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Gagal membuat template"))
	}

	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", "attachment; filename=template_import_soal.xlsx")
	return c.SendStream(buf)
}
