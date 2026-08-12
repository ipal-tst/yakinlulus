import ExcelJS from "exceljs";
import type { AcademicImportKind } from "./academic-master-import.service";

export interface ParsedRow {
    rowNum: number;
    values: Record<string, string>;
    valid: boolean;
    warnings: string[];
    errors: string[];
}

const REQUIRED_HEADERS: Record<AcademicImportKind, string[]> = {
    level: ["Nama", "Kode"],
    grade: ["Nama Level", "Nama"],
    subject: ["Nama Level", "Nama"],
    chapter: ["Nama Mapel", "Nama"],
    topic: ["Nama Bab", "Judul"],
    learning_outcome: ["Judul Topik", "Judul"],
    curriculum: ["Nama", "Kode"],
    program: ["Nama", "Kode", "Nama Level"],
};

const OPTIONAL_HEADERS: Record<AcademicImportKind, string[]> = {
    level: ["Urutan", "Aktif"],
    grade: ["Alias", "Urutan", "Aktif"],
    subject: ["Kode", "Deskripsi", "Urutan", "Aktif"],
    chapter: ["Deskripsi", "Urutan", "Aktif"],
    topic: ["Deskripsi", "Urutan", "Aktif"],
    learning_outcome: ["Kode", "Urutan", "Bloom", "Deskripsi", "Aktif"],
    curriculum: ["Deskripsi", "Aktif"],
    program: ["Deskripsi", "Aktif"],
};

export async function parseAcademicSheet(
    file: File,
    kind: AcademicImportKind,
): Promise<ParsedRow[]> {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount < 2) {
        throw new Error("Sheet kosong atau hanya berisi header");
    }

    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value ?? "").trim();
    });

    const required = REQUIRED_HEADERS[kind];
    const optional = OPTIONAL_HEADERS[kind];

    const missingRequired = required.filter((h) => !headers.includes(h));
    if (missingRequired.length > 0) {
        throw new Error(
            `Header wajib tidak ditemukan: ${missingRequired.join(", ")}`,
        );
    }

    const rows: ParsedRow[] = [];
    for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        let allEmpty = true;
        const values: Record<string, string> = {};

        headers.forEach((header, idx) => {
            if (!header) return;
            const cell = row.getCell(idx + 1);
            const val = cell.value !== null && cell.value !== undefined
                ? String(cell.value).trim()
                : "";
            values[header] = val;
            if (val) allEmpty = false;
        });

        if (allEmpty) continue;

        const errors: string[] = [];
        const warnings: string[] = [];

        required.forEach((h) => {
            if (!values[h]) {
                errors.push(`"${h}" wajib diisi`);
            }
        });

        optional.forEach((h) => {
            if (h in values && !values[h]) {
                warnings.push(`"${h}" kosong (opsional)`);
            }
        });

        rows.push({
            rowNum: i,
            values,
            valid: errors.length === 0,
            warnings,
            errors,
        });
    }

    return rows;
}
