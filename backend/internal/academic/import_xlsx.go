package academic

import (
	"context"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"

	"yakinlulus.id/backend/internal/importxlsx"
	"yakinlulus.id/backend/internal/shared"
)

const (
	KindLevel          = "level"
	KindGrade          = "grade"
	KindSubject        = "subject"
	KindChapter        = "chapter"
	KindTopic          = "topic"
	KindLearningOutcome = "learning_outcome"
	KindCurriculum     = "curriculum"
	KindProgram        = "program"
)

type AcademicImportResult struct {
	JobID   uuid.UUID     `json:"job_id"`
	Created int           `json:"created"`
	Skipped int           `json:"skipped"`
	Failed  int           `json:"failed"`
	Errors  []ImportError `json:"errors,omitempty"`
}

type ImportError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

func (s *Service) ImportAcademic(ctx context.Context, kind string, file io.Reader, fileName string) (*AcademicImportResult, error) {
	sheetName, err := importxlsx.FirstSheet(file)
	if err != nil {
		return nil, fmt.Errorf("read sheet: %w", err)
	}

	file.(interface{ Seek(int, int) (int64, error) }).Seek(0, 0)
	rows, err := importxlsx.Parse(file, sheetName)
	if err != nil {
		return nil, fmt.Errorf("parse xlsx: %w", err)
	}

	jobID, err := importxlsx.Job(ctx, s.repo.pool, "ACADEMIC", fmt.Sprintf("import-%s", kind), fileName)
	if err != nil {
		return nil, fmt.Errorf("create job: %w", err)
	}

	result := &AcademicImportResult{JobID: jobID}

	switch kind {
	case KindLevel:
		result = s.importLevels(ctx, jobID, rows)
	case KindGrade:
		result = s.importGrades(ctx, jobID, rows)
	case KindSubject:
		result = s.importSubjects(ctx, jobID, rows)
	case KindChapter:
		result = s.importChapters(ctx, jobID, rows)
	case KindTopic:
		result = s.importTopics(ctx, jobID, rows)
	case KindLearningOutcome:
		result = s.importLearningOutcomes(ctx, jobID, rows)
	case KindCurriculum:
		result = s.importCurriculums(ctx, jobID, rows)
	case KindProgram:
		result = s.importPrograms(ctx, jobID, rows)
	default:
		importxlsx.CompleteJob(ctx, s.repo.pool, jobID, true)
		return nil, fmt.Errorf("unknown kind: %s", kind)
	}

	result.JobID = jobID
	importxlsx.CompleteJob(ctx, s.repo.pool, jobID, result.Failed > 0)
	return result, nil
}

func (s *Service) importLevels(ctx context.Context, jobID uuid.UUID, rows []importxlsx.ImportRow) *AcademicImportResult {
	result := &AcademicImportResult{}
	for _, row := range rows {
		code := row.Cells["CODE"]
		name := row.Cells["NAME"]
		orderStr := row.Cells["URUTAN"]

		if code == "" || name == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "CODE dan NAME wajib diisi")
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: "CODE dan NAME wajib diisi"})
			continue
		}

		_, exists, _ := importxlsx.RetrieveByCode(ctx, s.repo.pool, "academic.education_level", code)
		if exists {
			result.Skipped++
			continue
		}

		order := 0
		if orderStr != "" {
			order, _ = strconv.Atoi(orderStr)
		}

		l := &EducationLevel{Code: code, Name: name, DisplayOrder: order}
		if err := s.repo.CreateLevel(ctx, l); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Gagal insert: %v", err))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: err.Error()})
		} else {
			result.Created++
		}
	}
	return result
}

func (s *Service) importGrades(ctx context.Context, jobID uuid.UUID, rows []importxlsx.ImportRow) *AcademicImportResult {
	result := &AcademicImportResult{}
	for _, row := range rows {
		levelStr := row.Cells["JENJANG"]
		code := row.Cells["CODE"]
		name := row.Cells["NAME"]

		if levelStr == "" || code == "" || name == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "JENJANG, CODE, NAME wajib diisi")
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: "JENJANG, CODE, NAME wajib diisi"})
			continue
		}

		levelID, err := s.repo.FindEducationLevelByCodeOrID(ctx, levelStr)
		if err != nil || levelID == nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Jenjang '%s' tidak ditemukan", levelStr))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: fmt.Sprintf("Jenjang '%s' tidak ditemukan", levelStr)})
			continue
		}

		var existingID uuid.UUID
		err = s.repo.pool.QueryRow(ctx, `SELECT id FROM academic.grade WHERE education_level_id=$1 AND code=$2`, *levelID, code).Scan(&existingID)
		if err == nil {
			result.Skipped++
			continue
		}

		order := 0
		if orderStr := row.Cells["URUTAN"]; orderStr != "" {
			order, _ = strconv.Atoi(orderStr)
		}

		g := &Grade{EducationLevelID: *levelID, Name: name, DisplayOrder: order}
		alias := code
		g.Alias = &alias
		if err := s.repo.CreateGrade(ctx, g); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Gagal insert: %v", err))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: err.Error()})
		} else {
			result.Created++
		}
	}
	return result
}

func (s *Service) importSubjects(ctx context.Context, jobID uuid.UUID, rows []importxlsx.ImportRow) *AcademicImportResult {
	result := &AcademicImportResult{}
	for _, row := range rows {
		code := row.Cells["CODE"]
		name := row.Cells["NAME"]
		desc := row.Cells["DESKRIPSI"]

		if code == "" || name == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "CODE dan NAME wajib diisi")
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: "CODE dan NAME wajib diisi"})
			continue
		}

		_, exists, _ := importxlsx.RetrieveByCode(ctx, s.repo.pool, "academic.subject", code)
		if exists {
			result.Skipped++
			continue
		}

		var descPtr *string
		if desc != "" {
			descPtr = &desc
		}

		sub := &Subject{Code: code, Name: name, Description: descPtr, DisplayOrder: 0}

		levelStr := row.Cells["JENJANG"]
		if levelStr != "" {
			levelID, _ := s.repo.FindEducationLevelByCodeOrID(ctx, levelStr)
			if levelID != nil {
				sub.LevelID = *levelID
			}
		}

		gradeStr := row.Cells["KELAS"]
		if gradeStr != "" && sub.LevelID != uuid.Nil {
			var gradeID uuid.UUID
			err := s.repo.pool.QueryRow(ctx, `SELECT id FROM academic.grade WHERE education_level_id=$1 AND (code=$2 OR name=$2)`, sub.LevelID, gradeStr).Scan(&gradeID)
			if err == nil {
				sub.GradeID = &gradeID
			}
		}

		if err := s.repo.CreateSubject(ctx, sub); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Gagal insert: %v", err))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: err.Error()})
		} else {
			result.Created++
		}
	}
	return result
}

func (s *Service) importChapters(ctx context.Context, jobID uuid.UUID, rows []importxlsx.ImportRow) *AcademicImportResult {
	result := &AcademicImportResult{}
	for _, row := range rows {
		subjectStr := row.Cells["MAPEL"]
		code := row.Cells["CODE"]
		name := row.Cells["NAMA"]
		orderStr := row.Cells["URUTAN"]

		if subjectStr == "" || name == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "MAPEL dan NAMA wajib diisi")
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: "MAPEL dan NAMA wajib diisi"})
			continue
		}

		subjectID, found, err := importxlsx.ResolveByNameOrCode(ctx, s.repo.pool, "academic.subject", subjectStr, subjectStr)
		if err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Error resolve subject: %v", err))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: fmt.Sprintf("Error resolve subject: %v", err)})
			continue
		}
		if !found {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Mapel '%s' tidak ditemukan", subjectStr))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: fmt.Sprintf("Mapel '%s' tidak ditemukan", subjectStr)})
			continue
		}

		var csID uuid.UUID
		err = s.repo.pool.QueryRow(ctx, `SELECT id FROM academic.curriculum_subject WHERE subject_id=$1 LIMIT 1`, subjectID).Scan(&csID)
		if err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Subject '%s' belum terhubung ke curriculum", subjectStr))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: fmt.Sprintf("Subject '%s' belum terhubung ke curriculum", subjectStr)})
			continue
		}

		var existingID uuid.UUID
		if code != "" {
			_ = s.repo.pool.QueryRow(ctx, `SELECT id FROM academic.chapter WHERE curriculum_subject_id=$1 AND code=$2`, csID, code).Scan(&existingID)
		}
		if existingID == uuid.Nil {
			_ = s.repo.pool.QueryRow(ctx, `SELECT id FROM academic.chapter WHERE curriculum_subject_id=$1 AND title=$2`, csID, name).Scan(&existingID)
		}
		if existingID != uuid.Nil {
			result.Skipped++
			continue
		}

		order := 0
		if orderStr != "" {
			order, _ = strconv.Atoi(orderStr)
		}

		ch := &Chapter{SubjectID: subjectID, Name: name, DisplayOrder: order}
		if desc := row.Cells["DESKRIPSI"]; desc != "" {
			ch.Description = &desc
		}
		if err := s.repo.CreateChapter(ctx, ch); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Gagal insert: %v", err))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: err.Error()})
		} else {
			result.Created++
		}
	}
	return result
}

func (s *Service) importTopics(ctx context.Context, jobID uuid.UUID, rows []importxlsx.ImportRow) *AcademicImportResult {
	result := &AcademicImportResult{}
	for _, row := range rows {
		chapterStr := row.Cells["BAB"]
		name := row.Cells["NAMA"]
		desc := row.Cells["DESKRIPSI"]
		orderStr := row.Cells["URUTAN"]

		if chapterStr == "" || name == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "BAB dan NAMA wajib diisi")
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: "BAB dan NAMA wajib diisi"})
			continue
		}

		var chapterID uuid.UUID
		err := s.repo.pool.QueryRow(ctx, `SELECT id FROM academic.chapter WHERE title ILIKE $1 OR code ILIKE $1 LIMIT 1`, chapterStr).Scan(&chapterID)
		if err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Bab '%s' tidak ditemukan", chapterStr))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: fmt.Sprintf("Bab '%s' tidak ditemukan", chapterStr)})
			continue
		}

		var existingID uuid.UUID
		_ = s.repo.pool.QueryRow(ctx, `
			SELECT t.id FROM academic.topic t
			JOIN academic.subchapter sc ON sc.id = t.subchapter_id
			WHERE sc.chapter_id=$1 AND t.name=$2
		`, chapterID, name).Scan(&existingID)
		if existingID != uuid.Nil {
			result.Skipped++
			continue
		}

		order := 0
		if orderStr != "" {
			order, _ = strconv.Atoi(orderStr)
		}

		t := &Topic{ChapterID: chapterID, Title: name, Sequence: order}
		if desc != "" {
			t.Description = &desc
		}
		if err := s.repo.CreateTopic(ctx, t); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Gagal insert: %v", err))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: err.Error()})
		} else {
			result.Created++
		}
	}
	return result
}

func (s *Service) importLearningOutcomes(ctx context.Context, jobID uuid.UUID, rows []importxlsx.ImportRow) *AcademicImportResult {
	result := &AcademicImportResult{}
	for _, row := range rows {
		topicStr := row.Cells["TOPIK"]
		name := row.Cells["NAMA"]
		desc := row.Cells["DESKRIPSI"]
		bloom := row.Cells["BLOOM"]

		if topicStr == "" || name == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "TOPIK dan NAMA wajib diisi")
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: "TOPIK dan NAMA wajib diisi"})
			continue
		}

		var topicID uuid.UUID
		err := s.repo.pool.QueryRow(ctx, `SELECT id FROM academic.topic WHERE name ILIKE $1 LIMIT 1`, topicStr).Scan(&topicID)
		if err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Topik '%s' tidak ditemukan", topicStr))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: fmt.Sprintf("Topik '%s' tidak ditemukan", topicStr)})
			continue
		}

		var existingID uuid.UUID
		_ = s.repo.pool.QueryRow(ctx, `
			SELECT lo.id FROM academic.learning_outcome lo
			JOIN academic.competency comp ON comp.id = lo.competency_id
			JOIN academic.chapter ch ON ch.id = comp.chapter_id
			JOIN academic.subchapter sc ON sc.chapter_id = ch.id
			JOIN academic.topic t ON t.subchapter_id = sc.id
			WHERE t.id=$1 AND lo.title=$2
		`, topicID, name).Scan(&existingID)
		if existingID != uuid.Nil {
			result.Skipped++
			continue
		}

		lo := &LearningOutcome{TopicID: topicID, Title: name, Sequence: 0}
		if desc != "" {
			lo.Description = &desc
		}
		if bloom != "" {
			normalized := strings.ToUpper(strings.TrimSpace(bloom))
			lo.BloomDefault = &normalized
		}

		if err := s.repo.CreateLearningOutcome(ctx, lo); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Gagal insert: %v", err))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: err.Error()})
		} else {
			result.Created++
		}
	}
	return result
}

func (s *Service) importCurriculums(ctx context.Context, jobID uuid.UUID, rows []importxlsx.ImportRow) *AcademicImportResult {
	result := &AcademicImportResult{}
	for _, row := range rows {
		code := row.Cells["CODE"]
		name := row.Cells["NAME"]
		version := row.Cells["VERSION"]

		if code == "" || name == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "CODE dan NAME wajib diisi")
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: "CODE dan NAME wajib diisi"})
			continue
		}

		_, exists, _ := importxlsx.RetrieveByCode(ctx, s.repo.pool, "academic.curriculum", code)
		if exists {
			result.Skipped++
			continue
		}

		var desc *string
		if version != "" {
			desc = &version
		}

		c := &Curriculum{Code: code, Name: name, Description: desc}
		if err := s.repo.CreateCurriculum(ctx, c); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Gagal insert: %v", err))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: err.Error()})
		} else {
			result.Created++
		}
	}
	return result
}

func (s *Service) importPrograms(ctx context.Context, jobID uuid.UUID, rows []importxlsx.ImportRow) *AcademicImportResult {
	result := &AcademicImportResult{}
	for _, row := range rows {
		code := row.Cells["CODE"]
		name := row.Cells["NAME"]

		if code == "" || name == "" {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, "CODE dan NAME wajib diisi")
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: "CODE dan NAME wajib diisi"})
			continue
		}

		_, exists, _ := importxlsx.RetrieveByCode(ctx, s.repo.pool, "academic.program", code)
		if exists {
			result.Skipped++
			continue
		}

		p := &Program{Code: code, Name: name}
		if err := s.repo.CreateProgram(ctx, p); err != nil {
			importxlsx.LogError(ctx, s.repo.pool, jobID, row.RowNum, fmt.Sprintf("Gagal insert: %v", err))
			result.Failed++
			result.Errors = append(result.Errors, ImportError{Row: row.RowNum, Message: err.Error()})
		} else {
			result.Created++
		}
	}
	return result
}

func (h *Handler) ImportAcademicHandler(c *fiber.Ctx) error {
	kind := c.Query("kind")
	if kind == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Query parameter 'kind' diperlukan"))
	}

	validKinds := map[string]bool{
		KindLevel: true, KindGrade: true, KindSubject: true, KindChapter: true,
		KindTopic: true, KindLearningOutcome: true, KindCurriculum: true, KindProgram: true,
	}
	if !validKinds[kind] {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, fmt.Sprintf("Kind tidak valid: %s", kind)))
	}

	fh, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Field 'file' (multipart) diperlukan"))
	}

	if !strings.HasSuffix(strings.ToLower(fh.Filename), ".xlsx") {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Format file harus .xlsx"))
	}

	file, err := fh.Open()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Gagal membuka file"))
	}
	defer file.Close()

	result, err := h.svc.ImportAcademic(c.Context(), kind, file, fh.Filename)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, fmt.Sprintf("Import gagal: %v", err)))
	}

	return c.Status(200).JSON(shared.Success(result))
}

func (h *Handler) ImportTemplateHandler(c *fiber.Ctx) error {
	kind := c.Query("kind")
	if kind == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Query parameter 'kind' diperlukan"))
	}

	var headers []string
	var examples [][]string

	switch kind {
	case KindLevel:
		headers = []string{"CODE", "NAME", "URUTAN"}
		examples = [][]string{
			{"SD", "Sekolah Dasar", "1"},
			{"SMP", "Sekolah Menengah Pertama", "2"},
			{"SMA", "Sekolah Menengah Atas", "3"},
		}
	case KindGrade:
		headers = []string{"JENJANG", "CODE", "NAME", "URUTAN"}
		examples = [][]string{
			{"SD", "1", "Kelas 1", "1"},
			{"SD", "2", "Kelas 2", "2"},
			{"SMP", "7", "Kelas 7", "1"},
		}
	case KindSubject:
		headers = []string{"CODE", "NAME", "DESKRIPSI", "JENJANG", "KELAS"}
		examples = [][]string{
			{"MTK", "Matematika", "Matematika dasar", "SD", ""},
			{"IPA", "IPA Terpadu", "Ilmu Pengetahuan Alam", "SMP", "7"},
		}
	case KindChapter:
		headers = []string{"MAPEL", "CODE", "NAMA", "URUTAN", "DESKRIPSI"}
		examples = [][]string{
			{"Matematika", "BAB01", "Bilangan Bulat", "1", "Pengenalan bilangan bulat"},
			{"IPA", "BAB02", "Gerak Lurus", "2", "Konsep gerak lurus"},
		}
	case KindTopic:
		headers = []string{"BAB", "NAMA", "DESKRIPSI", "URUTAN"}
		examples = [][]string{
			{"Bilangan Bulat", "Penjumlahan Bilangan Bulat", "Operasi penjumlahan", "1"},
			{"Gerak Lurus", "Kecepatan", "Konsep kecepatan rata-rata", "2"},
		}
	case KindLearningOutcome:
		headers = []string{"TOPIK", "NAMA", "DESKRIPSI", "BLOOM"}
		examples = [][]string{
			{"Penjumlahan Bilangan Bulat", "Siswa dapat melakukan penjumlahan", "Kompetensi dasar penjumlahan", "UNDERSTAND"},
			{"Kecepatan", "Siswa dapat menghitung kecepatan", "Memahami konsep kecepatan", "APPLY"},
		}
	case KindCurriculum:
		headers = []string{"CODE", "NAME", "VERSION"}
		examples = [][]string{
			{"K13", "Kurikulum 2013", "Revisi 2018"},
			{"MERDEKA", "Kurikulum Merdeka", "2022"},
		}
	case KindProgram:
		headers = []string{"CODE", "NAME", "JENJANG"}
		examples = [][]string{
			{"UTBK2024", "Program UTBK 2024", "SMA"},
			{"AKSEL-SMP", "Program Akselerasi SMP", "SMP"},
		}
	default:
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, fmt.Sprintf("Kind tidak valid: %s", kind)))
	}

	f := excelize.NewFile()
	defer f.Close()

	sheet := "Data"
	f.SetSheetName("Sheet1", sheet)

	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#1E3A8A"}},
	})
	lastCol, _ := excelize.CoordinatesToCellName(len(headers), 1)
	_ = f.SetCellStyle(sheet, "A1", lastCol, headerStyle)

	for rowIdx, example := range examples {
		for colIdx, val := range example {
			cell, _ := excelize.CoordinatesToCellName(colIdx+1, rowIdx+2)
			_ = f.SetCellValue(sheet, cell, val)
		}
	}

	for i := 1; i <= len(headers); i++ {
		col, _ := excelize.ColumnNumberToName(i)
		_ = f.SetColWidth(sheet, col, col, 20)
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Gagal membuat template"))
	}

	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=template_import_%s.xlsx", kind))
	return c.SendStream(buf)
}
