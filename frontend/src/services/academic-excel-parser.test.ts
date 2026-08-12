import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { parseAcademicSheet } from "./academic-excel-parser";

async function makeExcel(
    headers: string[],
    rows: (string | number | null)[][],
): Promise<File> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    ws.addRow(headers);
    rows.forEach((r) => ws.addRow(r));
    const buf = await wb.xlsx.writeBuffer();
    return new File([buf], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
}

describe("parseAcademicSheet", () => {
    it("parses valid level rows", async () => {
        const file = await makeExcel(
            ["Nama", "Kode", "Urutan"],
            [
                ["SD", "SD", 1],
                ["SMP", "SMP", 2],
            ],
        );
        const rows = await parseAcademicSheet(file, "level");
        expect(rows).toHaveLength(2);
        expect(rows[0].valid).toBe(true);
        expect(rows[0].errors).toHaveLength(0);
        expect(rows[1].valid).toBe(true);
        expect(rows[1].values["Nama"]).toBe("SMP");
    });

    it("marks rows invalid when required field missing", async () => {
        const file = await makeExcel(
            ["Nama", "Kode"],
            [
                ["SD", "SD"],
                ["", "SMP"],
            ],
        );
        const rows = await parseAcademicSheet(file, "level");
        expect(rows).toHaveLength(2);
        expect(rows[0].valid).toBe(true);
        expect(rows[1].valid).toBe(false);
        expect(rows[1].errors.length).toBeGreaterThan(0);
        expect(rows[1].errors[0]).toContain("Nama");
    });

    it("warns on empty optional fields", async () => {
        const file = await makeExcel(
            ["Nama", "Kode", "Urutan"],
            [["SD", "SD", null]],
        );
        const rows = await parseAcademicSheet(file, "level");
        expect(rows).toHaveLength(1);
        expect(rows[0].valid).toBe(true);
        expect(rows[0].warnings.some((w) => w.includes("Urutan"))).toBe(true);
    });

    it("skips completely empty rows", async () => {
        const file = await makeExcel(
            ["Nama", "Kode"],
            [
                ["SD", "SD"],
                [null, null],
                [null, ""],
            ],
        );
        const rows = await parseAcademicSheet(file, "level");
        expect(rows).toHaveLength(1);
    });

    it("throws on missing required header", async () => {
        const file = await makeExcel(
            ["Kode"],
            [["SD"]],
        );
        await expect(parseAcademicSheet(file, "level")).rejects.toThrow(
            "Header wajib tidak ditemukan",
        );
    });

    it("parses program kind with all required fields", async () => {
        const file = await makeExcel(
            ["Nama", "Kode", "Nama Level"],
            [["Reguler", "REG", "SMA"]],
        );
        const rows = await parseAcademicSheet(file, "program");
        expect(rows).toHaveLength(1);
        expect(rows[0].valid).toBe(true);
    });

    it("marks program row invalid when required field missing", async () => {
        const file = await makeExcel(
            ["Nama", "Kode", "Nama Level"],
            [["Reguler", "", "SMA"]],
        );
        const rows = await parseAcademicSheet(file, "program");
        expect(rows).toHaveLength(1);
        expect(rows[0].valid).toBe(false);
        expect(rows[0].errors.some((e) => e.includes("Kode"))).toBe(true);
    });

    it("handles empty worksheet gracefully", async () => {
        const file = await makeExcel(["Nama", "Kode"], []);
        await expect(parseAcademicSheet(file, "level")).rejects.toThrow(
            "Sheet kosong",
        );
    });
});
