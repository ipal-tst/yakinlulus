# Task 1 Report: Backend Export XLSX Endpoint

## Status: DONE

## Implementasi

### File Baru

#### `backend/internal/academic/export_xlsx.go`
- `exportWorkbook(kind string) ([]byte, error)` — helper murni, buat workbook dengan sheet "Data", header + 1 baris contoh per kind
- `Service.ExportXLSX(ctx, kind, filters) ([]byte, error)` — wrapper untuk future DB integration
- `Handler.ExportAcademicHandler(c *fiber.Ctx) error` — POST `/academic/export/xlsx` (body) + GET (query param)

#### `backend/internal/academic/export_xlsx_test.go`
- `TestExportXLSXKindColumns` — test header columns per kind (5 kinds)
- `TestExportWorkbookUnknownKind` — test error handling unknown kind

### File Diubah

#### `backend/internal/academic/academic.go`
- Tambah route: `g.Post("/export/xlsx", h.ExportAcademicHandler)` di RegisterRoutes (grup write)

## Test Results

```bash
$ go test ./internal/academic/... -run TestExport -v

=== RUN   TestExportXLSXKindColumns
=== RUN   TestExportXLSXKindColumns/level
=== RUN   TestExportXLSXKindColumns/grade
=== RUN   TestExportXLSXKindColumns/subject
=== RUN   TestExportXLSXKindColumns/curriculum
=== RUN   TestExportXLSXKindColumns/program
--- PASS: TestExportXLSXKindColumns (0.02s)
    --- PASS: TestExportXLSXKindColumns/level (0.01s)
    --- PASS: TestExportXLSXKindColumns/grade (0.00s)
    --- PASS: TestExportXLSXKindColumns/subject (0.00s)
    --- PASS: TestExportXLSXKindColumns/curriculum (0.00s)
    --- PASS: TestExportXLSXKindColumns/program (0.00s)
=== RUN   TestExportWorkbookUnknownKind
--- PASS: TestExportWorkbookUnknownKind (0.00s)
PASS
ok  	yakinlulus.id/backend/internal/academic	0.283s
```

## Verifikasi

```bash
go build ./...        # OK
go vet ./internal/academic/...  # OK
go test ./internal/academic/... # PASS (2 tests)
```

## Concern

- `exportWorkbook` saat ini murni (tanpa DB) sesuai spec — future extension bisa tambahkan filter logic di `Service.ExportXLSX`
- Route hanya POST + GET query; belum ada pagination di query params (bisa ditambahkan nanti bila DB integration ditambahkan)
- GET variant hanya `?kind=` tanpa filter; bila perlu filter later, modify handler signature

## Next Steps (Task 2)

Implementasi bulk-delete & bulk-status endpoint sesuai plan.
