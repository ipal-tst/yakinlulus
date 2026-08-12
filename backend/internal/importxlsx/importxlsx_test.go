package importxlsx

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/xuri/excelize/v2"
)

func TestParse(t *testing.T) {
	t.Run("basic parsing", func(t *testing.T) {
		xlsxBytes := createTestXLSX(t, "Sheet1", []string{"CODE", "NAME", "EMAIL"}, []string{
			"A001", "John Doe", "john@example.com",
		})

		rows, err := Parse(bytes.NewReader(xlsxBytes), "Sheet1")
		assert.NoError(t, err)
		assert.Len(t, rows, 1)

		assert.Equal(t, 2, rows[0].RowNum)
		assert.Equal(t, "A001", rows[0].Cells["CODE"])
		assert.Equal(t, "John Doe", rows[0].Cells["NAME"])
		assert.Equal(t, "john@example.com", rows[0].Cells["EMAIL"])
	})

	t.Run("multiple rows", func(t *testing.T) {
		xlsxBytes := createTestXLSX(t, "Sheet1", []string{"CODE", "NAME"}, []string{
			"A001", "John",
			"A002", "Jane",
			"A003", "Bob",
		})

		rows, err := Parse(bytes.NewReader(xlsxBytes), "Sheet1")
		assert.NoError(t, err)
		assert.Len(t, rows, 3)

		assert.Equal(t, "A001", rows[0].Cells["CODE"])
		assert.Equal(t, "A002", rows[1].Cells["CODE"])
		assert.Equal(t, "A003", rows[2].Cells["CODE"])
	})

	t.Run("extra columns ignored", func(t *testing.T) {
		xlsxBytes := createTestXLSX(t, "Sheet1", []string{"CODE", "NAME", "EXTRA"}, []string{
			"A001", "John", "ExtraValue",
		})

		rows, err := Parse(bytes.NewReader(xlsxBytes), "Sheet1")
		assert.NoError(t, err)
		assert.Equal(t, "ExtraValue", rows[0].Cells["EXTRA"])
	})

	t.Run("empty file fails", func(t *testing.T) {
		xlsxBytes := createEmptyXLSX(t, "Sheet1")

		_, err := Parse(bytes.NewReader(xlsxBytes), "Sheet1")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "insufficient rows")
	})
}

func createTestXLSX(t *testing.T, sheetName string, headers []string, data []string) []byte {
	f := excelize.NewFile()

	if sheetName != "" {
		f.SetSheetName("Sheet1", sheetName)
	}

	for i, h := range headers {
		if err := f.SetCellValue(sheetName, string(rune('A'+i))+"1", h); err != nil {
			t.Fatal(err)
		}
	}

	startRow := 2
	for i := 0; i < len(data); i += len(headers) {
		for j := 0; j < len(headers) && i+j < len(data); j++ {
			if err := f.SetCellValue(sheetName, string(rune('A'+j))+string(rune('0'+startRow)), data[i+j]); err != nil {
				t.Fatal(err)
			}
		}
		startRow++
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		t.Fatal(err)
	}

	return buf.Bytes()
}

func createEmptyXLSX(t *testing.T, sheetName string) []byte {
	f := excelize.NewFile()
	if sheetName != "" {
		f.SetSheetName("Sheet1", sheetName)
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		t.Fatal(err)
	}

	return buf.Bytes()
}

func TestFirstSheet(t *testing.T) {
	t.Run("returns first sheet name", func(t *testing.T) {
		xlsxBytes := createTestXLSX(t, "Sheet1", []string{"CODE"}, []string{"A001"})

		sheet, err := FirstSheet(bytes.NewReader(xlsxBytes))
		assert.NoError(t, err)
		assert.Equal(t, "Sheet1", sheet)
	})

	t.Run("multiple sheets returns first", func(t *testing.T) {
		f := excelize.NewFile()
		f.NewSheet("Sheet2")
		f.NewSheet("Sheet3")

		f.SetCellValue("Sheet1", "A1", "CODE")
		f.SetCellValue("Sheet2", "A1", "NAME")
		f.SetCellValue("Sheet3", "A1", "EMAIL")

		var buf bytes.Buffer
		if err := f.Write(&buf); err != nil {
			t.Fatal(err)
		}

		sheet, err := FirstSheet(bytes.NewReader(buf.Bytes()))
		assert.NoError(t, err)
		assert.Equal(t, "Sheet1", sheet)
	})

	t.Run("empty sheet (header only) fails", func(t *testing.T) {
		f := excelize.NewFile()
		f.SetCellValue("Sheet1", "A1", "CODE")

		var buf bytes.Buffer
		if err := f.Write(&buf); err != nil {
			t.Fatal(err)
		}

		_, err := FirstSheet(bytes.NewReader(buf.Bytes()))
		assert.NoError(t, err)
	})
}