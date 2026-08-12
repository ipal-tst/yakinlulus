package academic

import (
	"context"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"

	"yakinlulus.id/backend/internal/shared"
)

func exportWorkbook(kind string) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Data"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	var header []string
	var example []interface{}

	switch kind {
	case KindLevel:
		header = []string{"CODE", "NAME", "URUTAN"}
		example = []interface{}{"SD", "Sekolah Dasar", 1}
	case KindGrade:
		header = []string{"JENJANG", "CODE", "NAME"}
		example = []interface{}{"SD", "1", "Kelas 1"}
	case KindSubject:
		header = []string{"CODE", "NAME", "DESKRIPSI"}
		example = []interface{}{"MAT", "Matematika", "Mata pelajaran matematika"}
	case KindCurriculum:
		header = []string{"CODE", "NAME", "VERSION"}
		example = []interface{}{"K13", "Kurikulum 2013", "2013"}
	case KindProgram:
		header = []string{"CODE", "NAME", "JENJANG"}
		example = []interface{}{"IPA", "Program IPA", "SMA"}
	default:
		return nil, fmt.Errorf("unknown kind: %s", kind)
	}

	for i, h := range header {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	for i, v := range example {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheetName, cell, v)
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (s *Service) ExportXLSX(ctx context.Context, kind string, filters map[string]string) ([]byte, error) {
	return exportWorkbook(kind)
}

func (h *Handler) ExportAcademicHandler(c *fiber.Ctx) error {
	type ExportParams struct {
		Kind    string            `json:"kind"`
		Filters map[string]string `json:"filters,omitempty"`
	}

	var params ExportParams
	if c.Method() == "POST" {
		if err := c.BodyParser(&params); err != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
		}
	} else {
		params.Kind = c.Query("kind")
		if params.Kind == "" {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "kind parameter required"))
		}
	}

	if params.Kind == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "kind is required"))
	}

	b, err := h.svc.ExportXLSX(c.Context(), params.Kind, params.Filters)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}

	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=export-%s.xlsx", params.Kind))
	return c.Send(b)
}
