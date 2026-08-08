package question_bank

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

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

func ExtractZipImages(fileBytes []byte) ([]string, error) {
	br := bytes.NewReader(fileBytes)
	zr, err := zip.NewReader(br, int64(len(fileBytes)))
	if err != nil {
		return nil, err
	}

	uploadDir := "./uploads"
	_ = os.MkdirAll(uploadDir, 0755)

	var imgURLs []string
	for _, f := range zr.File {
		if strings.HasPrefix(f.Name, "xl/media/") {
			rc, err := f.Open()
			if err != nil {
				continue
			}
			data, err := io.ReadAll(rc)
			rc.Close()
			if err != nil || len(data) == 0 {
				continue
			}

			ext := filepath.Ext(f.Name)
			if ext == "" {
				ext = ".png"
			}
			fileName := fmt.Sprintf("%s_%s%s", time.Now().Format("20060102_150405"), uuid.New().String()[:8], ext)
			dstPath := filepath.Join(uploadDir, fileName)
			if err := os.WriteFile(dstPath, data, 0644); err == nil {
				imgURLs = append(imgURLs, "/uploads/"+fileName)
			}
		}
	}
	return imgURLs, nil
}

// ParseQuestionXLSX reads the "Soal" sheet into ImportRow values.
func ParseQuestionXLSX(f *excelize.File, zipImages []string) ([]ImportRow, []string) {
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
	zipMediaPointer := 0

	cleanBlock := func(val string) string {
		if val == "" || strings.Contains(val, "#VALUE!") || strings.Contains(val, "#REF!") {
			return ""
		}
		return strings.TrimSpace(val)
	}

	for i := 1; i < len(raw); i++ { // skip header row
		row := raw[i]
		mapel := xqCell(row, xqColMapel)
		if mapel == "" {
			continue // blank line
		}
		var blocks []QuestionBlock
		var paragraphTexts []string

		for b := 0; b < xqBlockPairs; b++ {
			rawTipe := xqCell(row, xqColBlockTipe+b*2)
			rawIsi := xqCell(row, xqColBlockIsi+b*2)
			cleanIsi := cleanBlock(rawIsi)

			isImgType := strings.EqualFold(rawTipe, "IMAGE") ||
				strings.EqualFold(rawTipe, "GAMBAR") ||
				strings.Contains(rawIsi, "#VALUE!") ||
				strings.HasPrefix(cleanIsi, "/uploads/") ||
				strings.HasPrefix(cleanIsi, "http://") ||
				strings.HasPrefix(cleanIsi, "https://") ||
				strings.HasPrefix(cleanIsi, "data:image/")

			if isImgType {
				if cleanIsi == "" && zipMediaPointer < len(zipImages) {
					cleanIsi = zipImages[zipMediaPointer]
					zipMediaPointer++
				}
				if cleanIsi != "" {
					blocks = append(blocks, QuestionBlock{BlockType: "IMAGE", Content: cleanIsi})
				}
			} else if cleanIsi != "" {
				blocks = append(blocks, QuestionBlock{BlockType: "PARAGRAPH", Content: cleanIsi})
				paragraphTexts = append(paragraphTexts, cleanIsi)
			}
		}

		content := strings.Join(paragraphTexts, "\n\n")
		if content == "" && len(blocks) > 0 {
			for _, b := range blocks {
				if b.BlockType == "PARAGRAPH" {
					content = b.Content
					break
				}
			}
		}
		if content == "" && len(blocks) == 0 {
			errs = append(errs, fmt.Sprintf("baris %d: kolom 'Blok 1 - Isi' kosong", i+1))
			continue
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

	fileBytes, err := io.ReadAll(f)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Gagal membaca isi file"))
	}

	zipImages, _ := ExtractZipImages(fileBytes)

	xls, err := excelize.OpenReader(bytes.NewReader(fileBytes))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "File Excel tidak valid: "+err.Error()))
	}
	defer xls.Close()

	rows, rowErrs := ParseQuestionXLSX(xls, zipImages)
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
	// 1. Try to serve pre-generated template file from disk if available
	candidatePaths := []string{
		"template_import_soal.xlsx",
		"../template_import_soal.xlsx",
		"d:/Project/EdTech/Yakinlulus.id/template_import_soal.xlsx",
	}
	for _, path := range candidatePaths {
		if _, err := os.Stat(path); err == nil {
			c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
			c.Set("Content-Disposition", "attachment; filename=template_import_soal.xlsx")
			return c.SendFile(path)
		}
	}

	// 2. Fallback: Generate dynamically with full examples
	f := excelize.NewFile()
	defer f.Close()

	f.SetSheetName("Sheet1", "Soal")
	f.NewSheet("Petunjuk Pengisian")

	headers := questionXlsxHeaders()
	colLetters := excelize.ColumnNumberToName
	for i, hd := range headers {
		cellRef, _ := colLetters(i + 1)
		_ = f.SetCellValue("Soal", cellRef+"1", hd)
	}

	// Example 1: SINGLE_CHOICE
	ex1 := make([]string, questionXlsCols)
	ex1[xqColNo-1] = "1"
	ex1[xqColKode-1] = "SOAL-MTK-001"
	ex1[xqColMapel-1] = "Matematika"
	ex1[xqColKelas-1] = "10"
	ex1[xqColTipe-1] = "SINGLE_CHOICE"
	ex1[xqColKesulitan-1] = "MEDIUM"
	ex1[xqColBlockTipe-1] = "PARAGRAPH"
	ex1[xqColBlockIsi-1] = "Sebuah toko menjual 2 jenis buah: apel Rp 5.000/ons dan jeruk Rp 3.000/ons. Jika beli total 10 ons seharga Rp 42.000, maka banyak apel yang dibeli adalah ..."
	ex1[xqColOptionA-1] = "6 ons"
	ex1[xqColOptionA-1+1] = "4 ons"
	ex1[xqColOptionA-1+2] = "5 ons"
	ex1[xqColOptionA-1+3] = "3 ons"
	ex1[xqColOptionA-1+4] = "8 ons"
	ex1[xqColKunci-1] = "A"
	ex1[xqColSkor-1] = "5"
	ex1[xqColSkorNeg-1] = "0"
	ex1[xqColPembahasan-1] = "Misalkan x = apel, y = jeruk. x + y = 10 dan 5000x + 3000y = 42000 => x = 6."
	ex1[xqColBloom-1] = "C3"
	ex1[xqColBahasa-1] = "id"

	// Example 2: MULTIPLE_CHOICE
	ex2 := make([]string, questionXlsCols)
	ex2[xqColNo-1] = "2"
	ex2[xqColKode-1] = "SOAL-FIS-002"
	ex2[xqColMapel-1] = "Fisika"
	ex2[xqColKelas-1] = "11"
	ex2[xqColTipe-1] = "MULTIPLE_CHOICE"
	ex2[xqColKesulitan-1] = "HARD"
	ex2[xqColBlockTipe-1] = "PARAGRAPH"
	ex2[xqColBlockIsi-1] = "Manakah dari besaran-besaran berikut yang merupakan besaran turunan? (Pilih semua yang benar)"
	ex2[xqColOptionA-1] = "Kecepatan"
	ex2[xqColOptionA-1+1] = "Massa"
	ex2[xqColOptionA-1+2] = "Gaya"
	ex2[xqColOptionA-1+3] = "Panjang"
	ex2[xqColOptionA-1+4] = "Energi"
	ex2[xqColKunci-1] = "A,C,E"
	ex2[xqColSkor-1] = "5"
	ex2[xqColSkorNeg-1] = "0"
	ex2[xqColPembahasan-1] = "Besaran turunan meliputi Kecepatan, Gaya, dan Energi."
	ex2[xqColBloom-1] = "C4"
	ex2[xqColBahasa-1] = "id"

	// Example 3: TRUE_FALSE
	ex3 := make([]string, questionXlsCols)
	ex3[xqColNo-1] = "3"
	ex3[xqColKode-1] = "SOAL-BIO-003"
	ex3[xqColMapel-1] = "Biologi"
	ex3[xqColKelas-1] = "10"
	ex3[xqColTipe-1] = "TRUE_FALSE"
	ex3[xqColKesulitan-1] = "MEDIUM"
	ex3[xqColBlockTipe-1] = "PARAGRAPH"
	ex3[xqColBlockIsi-1] = "Tentukan apakah setiap pernyataan mengenai sel berikut bernilai BENAR atau SALAH:"
	ex3[xqColOptionA-1] = "Mitokondria berfungsi sebagai tempat respirasi seluler."
	ex3[xqColOptionA-1+1] = "Dinding sel ditemukan pada sel hewan."
	ex3[xqColOptionA-1+2] = "Ribosom berperan dalam sintesis protein."
	ex3[xqColOptionA-1+3] = "Membran sel bersifat impermiabel terhadap semua zat."
	ex3[xqColKunci-1] = "A:B, B:S, C:B, D:S"
	ex3[xqColSkor-1] = "5"
	ex3[xqColSkorNeg-1] = "0"
	ex3[xqColPembahasan-1] = "Dinding sel hanya ada pada tumbuhan. Membran sel bersifat semi-permiabel."
	ex3[xqColBloom-1] = "C3"
	ex3[xqColBahasa-1] = "id"

	examples := [][]string{ex1, ex2, ex3}
	for rIdx, ex := range examples {
		rowNum := rIdx + 2
		for i, v := range ex {
			cellRef, _ := colLetters(i + 1)
			_ = f.SetCellValue("Soal", fmt.Sprintf("%s%d", cellRef, rowNum), v)
		}
	}

	// Styling Header
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#1E3A8A"}},
	})
	_ = f.SetCellStyle("Soal", "A1", "AC1", headerStyle)

	widths := map[string]float64{
		"A": 6, "B": 15, "C": 22, "D": 10, "E": 24,
		"F": 18, "G": 14, "H": 12, "I": 45, "J": 12, "K": 30,
		"L": 12, "M": 30, "N": 12, "O": 30, "P": 30, "Q": 30,
		"R": 30, "S": 30, "T": 30, "U": 20, "V": 20, "W": 20,
		"X": 22, "Y": 10, "Z": 12, "AA": 40, "AB": 12, "AC": 10,
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

	// Petunjuk Sheet
	instructions := [][]string{
		{"PANDUAN & PETUNJUK PENGISIAN TEMPLATE IMPORT SOAL"},
		{"Platform YakinLulus.id — Format Standar Import Excel (.xlsx)"},
		{""},
		{"1. ATURAN UMUM"},
		{"- Sheet data harus bernama 'Soal' atau 'Soal (Isi)'. Jangan diubah."},
		{"- Header pada Baris 1 tidak boleh dihapus atau diubah."},
		{"- Kolom Mapel dan Blok 1 - Isi WAJIB diisi."},
		{""},
		{"2. KUNCI JAWABAN PER TIPE SOAL"},
		{"- SINGLE_CHOICE (Pilihan Ganda 1 Jawaban): Diisi 1 huruf (A, B, C, D, atau E). Contoh: A"},
		{"- MULTIPLE_CHOICE (Pilihan Ganda Kompleks): Diisi huruf dipisahkan koma atau digabung. Contoh: A,C,E"},
		{"- TRUE_FALSE (Matriks Benar - Salah): Diisi format A:B, B:S, C:B, D:S (atau B,S,B,S)"},
	}
	for i, line := range instructions {
		for j, val := range line {
			cellRef, _ := colLetters(j + 1)
			_ = f.SetCellValue("Petunjuk Pengisian", fmt.Sprintf("%s%d", cellRef, i+1), val)
		}
	}
	_ = f.SetColWidth("Petunjuk Pengisian", "A", "A", 100)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Gagal membuat template"))
	}

	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", "attachment; filename=template_import_soal.xlsx")
	return c.SendStream(buf)
}
