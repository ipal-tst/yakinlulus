package school

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"

	"yakinlulus.id/backend/internal/shared"
)

var schoolExportHeader = []string{"NAMA", "NPSN", "BENTUK", "JENJANG", "STATUS", "YAYASAN", "PROVINSI", "KOTA", "KECAMATAN", "DESA", "ALAMAT", "KODEPOS", "TELP", "EMAIL", "WEBSITE", "KURIKULUM"}

func schoolTemplateWorkbook() ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Sekolah"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	for i, h := range schoolExportHeader {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	example := []interface{}{"SMA NEGERI 1", "20100001", "SEKOLAH", "SMA", "NEGERI", "", "JAWA TIMUR", "SURABAYA", "TEGALSARI", "KEDUNGDORO", "JALAN MERDEKA NO. 1", "60272", "031-5550000", "info@sman1.sch.id", "https://sman1.sch.id", "KURMER"}
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

func (s *Service) SchoolImportTemplate(ctx context.Context) ([]byte, error) {
	return schoolTemplateWorkbook()
}

func (s *Service) ExportXLSX(ctx context.Context, ids []uuid.UUID, f ListFilter) ([]byte, error) {
	var data []School
	if len(ids) > 0 {
		rows, err := s.repo.ListByIDs(ctx, ids)
		if err != nil {
			return nil, err
		}
		data = rows
	} else {
		rows, _, err := s.repo.List(ctx, f)
		if err != nil {
			return nil, err
		}
		data = rows
	}

	file := excelize.NewFile()
	defer file.Close()

	sheetName := "Sekolah"
	index, err := file.NewSheet(sheetName)
	if err != nil {
		return nil, err
	}
	file.SetActiveSheet(index)
	file.DeleteSheet("Sheet1")

	for i, h := range schoolExportHeader {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		file.SetCellValue(sheetName, cell, h)
	}

	rowIdx := 2
	for _, sc := range data {
		vals := []interface{}{
			sc.SchoolName, derefStrOrNil(sc.NPSN), sc.InstitutionType, sc.EducationLevel,
			sc.SchoolStatus, derefStrOrNil(sc.YayasanName), derefStrOrNil(sc.Province),
			derefStrOrNil(sc.City), derefStrOrNil(sc.District), derefStrOrNil(sc.Village),
			derefStrOrNil(sc.Address), derefStrOrNil(sc.PostalCode), derefStrOrNil(sc.Phone),
			derefStrOrNil(sc.Email), derefStrOrNil(sc.Website), derefStrOrNil(sc.CurriculumCode),
		}
		for i, v := range vals {
			cell, _ := excelize.CoordinatesToCellName(i+1, rowIdx)
			file.SetCellValue(sheetName, cell, v)
		}
		rowIdx++
	}

	buf, err := file.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func derefStrOrNil(p *string) interface{} {
	if p == nil {
		return ""
	}
	return *p
}

func (h *Handler) ExportSchoolsXlsx(c *fiber.Ctx) error {
	f := ListFilter{
		Page:     1,
		Limit:    10000,
		Search:   c.Query("q", ""),
		Type:     c.Query("type", ""),
		Level:    c.Query("level", ""),
		Province: c.Query("province", ""),
	}
	var req struct {
		IDs []uuid.UUID `json:"ids"`
	}
	if c.Method() == "POST" {
		_ = c.BodyParser(&req)
	}

	b, err := h.svc.ExportXLSX(c.Context(), req.IDs, f)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to export schools"))
	}

	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="sekolah-%s.xlsx"`, time.Now().Format("2006-01-02")))
	return c.Send(b)
}