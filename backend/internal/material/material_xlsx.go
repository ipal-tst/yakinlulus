package material

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"

	"yakinlulus.id/backend/internal/content"
	"yakinlulus.id/backend/internal/shared"
)

// Materi sheet column map (1-indexed on the sheet).
const (
	xmColNo         = 1
	xmColMapel      = 2
	xmColKelas      = 3
	xmColBab        = 4
	xmColTopik      = 5
	xmColJudul      = 6
	xmColFormat     = 7
	xmColIsi        = 8
	xmColAset       = 9
	xmColDurasi     = 10
	xmColStatus     = 11
	xmColPreview    = 12
	materialXlsCols = 12
)

const xmMaxFileSize = 15 << 20

type materialImportRow struct {
	Mapel       string
	GradeName   string
	Title       string
	ChapterID   string
	Format      content.MaterialFormat
	Body        string
	Asset       string
	DurationMin int
	Status      content.ContentStatus
	IsPreview   bool
}

func xmCell(row []string, col int) string {
	idx := col - 1
	if idx < 0 || idx >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[idx])
}

func xmNormalizeFormat(raw string) content.MaterialFormat {
	switch strings.ToUpper(strings.TrimSpace(raw)) {
	case "RICH_TEXT", "RICH TEXT":
		return content.MaterialFormatRichText
	case "MARKDOWN", "MD":
		return content.MaterialFormatMarkdown
	case "VIDEO":
		return content.MaterialFormatVideo
	case "PDF":
		return content.MaterialFormatPDF
	case "AUDIO":
		return content.MaterialFormatAudio
	case "INTERACTIVE":
		return content.MaterialFormatInteractive
	default:
		return content.MaterialFormatText
	}
}

func xmNormalizeStatus(raw string) content.ContentStatus {
	switch strings.ToUpper(strings.TrimSpace(raw)) {
	case "PUBLISH", "PUBLISHED", "TERBIT":
		return content.StatusPublished
	case "ARCHIVE", "ARCHIVED", "ARSIP":
		return content.StatusArchived
	case "REVIEW":
		return content.StatusReview
	case "APPROVED":
		return content.StatusApproved
	default:
		return content.StatusDraft
	}
}

func xmIsTrue(raw string) bool {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "1", "true", "yes", "y", "ya", "preview":
		return true
	default:
		return false
	}
}

func parseMaterialXLSX(f *excelize.File) ([]materialImportRow, []string) {
	sheet := "Materi"
	if idx, err := f.GetSheetIndex(sheet); err != nil || idx == -1 {
		if idx2, err2 := f.GetSheetIndex("Materi (Isi)"); err2 == nil && idx2 != -1 {
			sheet = "Materi (Isi)"
		} else {
			return nil, []string{"Sheet 'Materi' tidak ditemukan di file"}
		}
	}

	raw, err := f.GetRows(sheet)
	if err != nil || len(raw) == 0 {
		return nil, []string{"Sheet 'Materi' kosong atau tidak dapat dibaca"}
	}

	var out []materialImportRow
	var errs []string
	for i := 1; i < len(raw); i++ { // skip header
		row := raw[i]
		mapel := xmCell(row, xmColMapel)
		if mapel == "" {
			continue
		}
		judul := xmCell(row, xmColJudul)
		if judul == "" {
			errs = append(errs, fmt.Sprintf("baris %d: kolom 'Judul' kosong", i+1))
			continue
		}
		durasi, _ := strconv.Atoi(xmCell(row, xmColDurasi))
		out = append(out, materialImportRow{
			Mapel:       mapel,
			GradeName:   xmCell(row, xmColKelas),
			Title:       judul,
			ChapterID:   xmCell(row, xmColBab),
			Format:      xmNormalizeFormat(xmCell(row, xmColFormat)),
			Body:        xmCell(row, xmColIsi),
			Asset:       xmCell(row, xmColAset),
			DurationMin: durasi,
			Status:      xmNormalizeStatus(xmCell(row, xmColStatus)),
			IsPreview:   xmIsTrue(xmCell(row, xmColPreview)),
		})
	}
	return out, errs
}

func ptrUUIDFromString(s string) *uuid.UUID {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	if id, err := uuid.Parse(strings.TrimSpace(s)); err == nil && id != uuid.Nil {
		return &id
	}
	return nil
}

func resolveNameID(ctx context.Context, fn func(context.Context, string) (*uuid.UUID, error), name string) (*uuid.UUID, error) {
	n := strings.TrimSpace(name)
	if n == "" {
		return nil, errors.New("nama kosong")
	}
	id, err := fn(ctx, n)
	if err != nil {
		return nil, fmt.Errorf("'%s' tidak ditemukan di database", n)
	}
	return id, nil
}

func (h *Handler) ImportMaterialsXLSX(c *fiber.Ctx) error {
	fh, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Field 'file' (multipart) diperlukan"))
	}
	if fh.Size > xmMaxFileSize {
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

	rows, rowErrs := parseMaterialXLSX(xls)
	if len(rowErrs) > 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Baris bermasalah: "+strings.Join(rowErrs, "; ")))
	}
	if len(rows) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Tidak ada data materi valid di sheet 'Materi'"))
	}

	userID := uuid.MustParse(c.Locals("user_id").(string))
	repo := h.svc.ContentRepo()

	var created int
	var failed []string
	for idx, row := range rows {
		subj, serr := resolveNameID(c.Context(), repo.FindSubjectIDByName, row.Mapel)
		if serr != nil {
			failed = append(failed, fmt.Sprintf("baris %d: %v", idx+1, serr))
			continue
		}
		grade, gerr := resolveNameID(c.Context(), repo.FindGradeIDByName, row.GradeName)
		if gerr != nil {
			failed = append(failed, fmt.Sprintf("baris %d: Kelas: %v", idx+1, gerr))
			continue
		}

		m := &content.Material{
			ContentFormat:     row.Format,
			EstimatedDuration: iptr(row.DurationMin),
			IsPreview:         row.IsPreview,
		}
		body := row.Body
		if row.Asset != "" {
			if body != "" {
				body += "\n" + row.Asset
			} else {
				body = row.Asset
			}
		}

		base := &content.Content{
			GradeID:   *grade,
			SubjectID: *subj,
			ChapterID: ptrUUIDFromString(row.ChapterID),
			Body:      body,
			Title:     row.Title,
			Status:    row.Status,
			CreatedBy: userID,
		}

		if err := h.svc.Create(c.Context(), m, base); err != nil {
			failed = append(failed, fmt.Sprintf("baris %d: %v", idx+1, err))
			continue
		}
		created++
	}

	return c.Status(200).JSON(shared.Success(fiber.Map{
		"created": created,
		"failed":  len(failed),
		"errors":  failed,
	}))
}

func iptr(n int) *int { return &n }

func materialXlsxHeaders() []string {
	return []string{
		"No", "Mapel", "Kelas", "Bab (ID)", "Subbab/Topik", "Judul",
		"Format", "Isi/Body", "Link Aset", "Durasi (menit)", "Status", "IsPreview",
	}
}

// MaterialImportTemplate streams a downloadable .xlsx template.
func (h *Handler) MaterialImportTemplate(c *fiber.Ctx) error {
	f := excelize.NewFile()
	defer f.Close()

	f.SetSheetName("Sheet1", "Materi")
	f.NewSheet("Petunjuk")

	headers := materialXlsxHeaders()
	collet := excelize.ColumnNumberToName
	for i, hd := range headers {
		cellRef, _ := collet(i + 1)
		_ = f.SetCellValue("Materi", cellRef+"1", hd)
	}

	example := make([]string, materialXlsCols)
	example[xmColMapel-1] = "Matematika"
	example[xmColKelas-1] = "10"
	example[xmColJudul-1] = "Contoh Judul Materi"
	example[xmColFormat-1] = "RICH_TEXT"
	example[xmColIsi-1] = "Tulis isi materi di sini..."
	for i, v := range example {
		cellRef, _ := collet(i + 1)
		_ = f.SetCellValue("Materi", cellRef+"2", v)
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#2563EB"}},
	})
	_ = f.SetCellStyle("Materi", "A1", "L1", headerStyle)

	widths := map[string]float64{"A": 6, "B": 22, "C": 10, "D": 24, "E": 18, "F": 30, "G": 16, "H": 48, "I": 30, "J": 14, "K": 12, "L": 10}
	for col, w := range widths {
		_ = f.SetColWidth("Materi", col, col, w)
	}
	_ = f.SetPanes("Materi", &excelize.Panes{Freeze: true, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})
	_ = f.AutoFilter("Materi", "A1:L1", []excelize.AutoFilterOptions{})

	instructions := [][]string{
		{"PENGISIAN FILE TEMPLATE IMPORT MATERI"},
		{""},
		{"1. Setiap baris = 1 materi. Jangan mengubah baris header."},
		{"2. Mapel: tulis nama mapel (contoh: Matematika)."},
		{"3. Kelas: tulis nama kelas/tingkat (contoh: 10). Wajib diisi."},
		{"4. Bab (ID) & Subbab/Topik: opsional, UUID dari sistem."},
		{"5. Format: TEXT / RICH_TEXT / MARKDOWN / VIDEO / PDF / AUDIO / INTERACTIVE. Kosongkan = TEXT."},
		{"6. Isi/Body: konten materi. Link Aset: ditambahkan ke akhir isi."},
		{"7. Durasi dalam menit (angka). Status: DRAFT/REVIEW/APPROVED/PUBLISHED/ARCHIVED. Kosongkan = DRAFT."},
		{"8. IsPreview: 1/0 atau ya/tidak. Baris dengan Mapel kosong diabaikan."},
	}
	for i, line := range instructions {
		cellRef, _ := collet(1)
		_ = f.SetCellValue("Petunjuk", cellRef+fmt.Sprintf("%d", i+1), line[0])
	}
	_ = f.SetColWidth("Petunjuk", "A", "A", 120)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Gagal membuat template"))
	}

	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", "attachment; filename=template_import_materi.xlsx")
	return c.SendStream(buf)
}
