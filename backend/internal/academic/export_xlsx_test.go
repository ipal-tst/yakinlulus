package academic

import (
	"bytes"
	"io"
	"testing"

	"github.com/xuri/excelize/v2"
)

func bytesToReadCloser(b []byte) io.ReadCloser {
	return io.NopCloser(bytes.NewReader(b))
}

func TestExportXLSXKindColumns(t *testing.T) {
	tests := map[string][]string{
		KindLevel:      {"CODE", "NAME", "URUTAN"},
		KindGrade:      {"JENJANG", "CODE", "NAME"},
		KindSubject:    {"CODE", "NAME", "DESKRIPSI"},
		KindCurriculum: {"CODE", "NAME", "VERSION"},
		KindProgram:    {"CODE", "NAME", "JENJANG"},
	}

	for kind, want := range tests {
		t.Run(kind, func(t *testing.T) {
			b, err := exportWorkbook(kind)
			if err != nil {
				t.Fatalf("exportWorkbook(%s): %v", kind, err)
			}

			f, err := excelize.OpenReader(bytesToReadCloser(b))
			if err != nil {
				t.Fatalf("open workbook: %v", err)
			}
			defer f.Close()

			rows, err := f.GetRows("Data")
			if err != nil {
				t.Fatalf("get rows: %v", err)
			}
			if len(rows) < 2 {
				t.Fatalf("need header + example row, got %d rows", len(rows))
			}

			header := rows[0]
			if len(header) != len(want) {
				t.Fatalf("header columns = %d, want %d", len(header), len(want))
			}
			for i, col := range want {
				if header[i] != col {
					t.Errorf("col %d = %q, want %q", i, header[i], col)
				}
			}
		})
	}
}

func TestExportWorkbookUnknownKind(t *testing.T) {
	_, err := exportWorkbook("unknown")
	if err == nil {
		t.Fatal("expected error for unknown kind")
	}
}
