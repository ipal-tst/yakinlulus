import * as XLSX from "xlsx";

export interface ParsedQuestionRow {
    id: string; // unique client id
    no: string;
    kode: string;
    mapel: string;
    kelas: string;
    bab: string;
    tipeSoal: string;
    kesulitan: string;
    block1Type: string;
    block1Isi: string;
    block2Type: string;
    block2Isi: string;
    block3Type: string;
    block3Isi: string;
    block4Type: string;
    block4Isi: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    optionE: string;
    optionF: string;
    optionG: string;
    optionH: string;
    kunciJawaban: string;
    skor: string;
    skorNegatif: string;
    pembahasan: string;
    bloomLevel: string;
    bahasa: string;
    validationErrors: string[];
}

export function parseTrueFalseKeyMap(kunciJawaban: string): Record<string, "BENAR" | "SALAH"> {
    const map: Record<string, "BENAR" | "SALAH"> = {};
    if (!kunciJawaban) return map;

    const raw = kunciJawaban.trim().toUpperCase();

    // Case 1: Key is formatted as "A:B, B:S" or "A:BENAR, B:SALAH"
    if (raw.includes(":")) {
        const parts = raw.split(/[,;\s]+/);
        parts.forEach((p) => {
            const [opt, val] = p.split(":");
            if (opt && val) {
                const cleanOpt = opt.trim();
                const cleanVal = val.trim();
                map[cleanOpt] = (cleanVal.startsWith("B") || cleanVal.startsWith("T") || cleanVal === "1") ? "BENAR" : "SALAH";
            }
        });
        return map;
    }

    // Case 2: Comma or space separated values like "B,S,B" or "BENAR, SALAH, BENAR"
    const tokens = raw.split(/[,;\s]+/).filter(Boolean);
    if (tokens.length > 1) {
        tokens.forEach((tok, idx) => {
            const label = String.fromCharCode(65 + idx); // A, B, C, D...
            map[label] = (tok.startsWith("B") || tok.startsWith("T") || tok === "1") ? "BENAR" : "SALAH";
        });
        return map;
    }

    // Case 3: Single token like "B" or "SALAH" (applies to option A by default)
    if (raw.startsWith("B") || raw.startsWith("T") || raw === "1") {
        map["A"] = "BENAR";
    } else if (raw.startsWith("S") || raw.startsWith("F") || raw === "0") {
        map["A"] = "SALAH";
    }

    return map;
}

export function validateQuestionRow(row: ParsedQuestionRow): string[] {
    const errors: string[] = [];
    if (!row.mapel || !row.mapel.trim()) {
        errors.push("Nama Mapel wajib diisi");
    }
    if (!row.block1Isi || !row.block1Isi.trim()) {
        errors.push("Konten Soal (Blok 1 Isi) kosong");
    }
    if (!row.kunciJawaban || !row.kunciJawaban.trim()) {
        errors.push("Kunci Jawaban belum diisi (misal: A, B, C atau B,S,B)");
    }
    if (row.tipeSoal !== "TRUE_FALSE" && row.tipeSoal !== "ESSAY" && row.tipeSoal !== "SHORT_ANSWER") {
        if (!row.optionA && !row.optionB) {
            errors.push("Opsi A dan B minimal terisi untuk pilihan ganda");
        }
    }
    return errors;
}

export async function parseExcelQuestionFile(file: File): Promise<ParsedQuestionRow[]> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });

    let sheetName = "Soal";
    if (!workbook.SheetNames.includes(sheetName)) {
        if (workbook.SheetNames.includes("Soal (Isi)")) {
            sheetName = "Soal (Isi)";
        } else if (workbook.SheetNames.length > 0) {
            sheetName = workbook.SheetNames[0];
        }
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        throw new Error("Sheet 'Soal' tidak ditemukan dalam file Excel");
    }

    const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    if (!rawRows || rawRows.length <= 1) {
        throw new Error("Sheet Excel kosong atau hanya berisi header");
    }

    const parsed: ParsedQuestionRow[] = [];

    for (let i = 1; i < rawRows.length; i++) {
        const r = rawRows[i] || [];
        const getVal = (idx: number) => (r[idx] !== undefined && r[idx] !== null ? String(r[idx]).trim() : "");

        const mapel = getVal(2); // Col C
        const block1Isi = getVal(8); // Col I (Blok 1 Isi)

        // Skip completely empty lines
        if (!mapel && !block1Isi && !getVal(0) && !getVal(15)) {
            continue;
        }

        const rowObj: ParsedQuestionRow = {
            id: `row-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            no: getVal(0) || String(i),
            kode: getVal(1),
            mapel: mapel,
            kelas: getVal(3),
            bab: getVal(4),
            tipeSoal: (getVal(5) || "SINGLE_CHOICE").toUpperCase(),
            kesulitan: (getVal(6) || "MEDIUM").toUpperCase(),
            block1Type: getVal(7) || "PARAGRAPH",
            block1Isi: block1Isi,
            block2Type: getVal(9) || "PARAGRAPH",
            block2Isi: getVal(10),
            block3Type: getVal(11) || "PARAGRAPH",
            block3Isi: getVal(12),
            block4Type: getVal(13) || "PARAGRAPH",
            block4Isi: getVal(14),
            optionA: getVal(15),
            optionB: getVal(16),
            optionC: getVal(17),
            optionD: getVal(18),
            optionE: getVal(19),
            optionF: getVal(20),
            optionG: getVal(21),
            optionH: getVal(22),
            kunciJawaban: getVal(23).toUpperCase(),
            skor: getVal(24) || "5",
            skorNegatif: getVal(25) || "0",
            pembahasan: getVal(26),
            bloomLevel: getVal(27) || "C3",
            bahasa: getVal(28) || "id",
            validationErrors: [],
        };

        rowObj.validationErrors = validateQuestionRow(rowObj);
        parsed.push(rowObj);
    }

    return parsed;
}

export function generateExcelFromRows(rows: ParsedQuestionRow[]): File {
    const headers = [
        "No", "Kode", "Mapel", "Kelas", "Bab (ID)", "Tipe Soal", "Kesulitan",
        "Blok 1 - Tipe", "Blok 1 - Isi",
        "Blok 2 - Tipe", "Blok 2 - Isi",
        "Blok 3 - Tipe", "Blok 3 - Isi",
        "Blok 4 - Tipe", "Blok 4 - Isi",
        "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Opsi E", "Opsi F", "Opsi G", "Opsi H",
        "Kunci Jawaban", "Skor", "Skor Negatif", "Pembahasan", "Bloom Level", "Bahasa"
    ];

    const dataMatrix: any[][] = [headers];

    rows.forEach((r, idx) => {
        dataMatrix.push([
            r.no || String(idx + 1),
            r.kode || "",
            r.mapel || "",
            r.kelas || "",
            r.bab || "",
            r.tipeSoal || "SINGLE_CHOICE",
            r.kesulitan || "MEDIUM",
            r.block1Type || "PARAGRAPH",
            r.block1Isi || "",
            r.block2Type || "PARAGRAPH",
            r.block2Isi || "",
            r.block3Type || "PARAGRAPH",
            r.block3Isi || "",
            r.block4Type || "PARAGRAPH",
            r.block4Isi || "",
            r.optionA || "",
            r.optionB || "",
            r.optionC || "",
            r.optionD || "",
            r.optionE || "",
            r.optionF || "",
            r.optionG || "",
            r.optionH || "",
            r.kunciJawaban || "",
            r.skor || "5",
            r.skorNegatif || "0",
            r.pembahasan || "",
            r.bloomLevel || "C3",
            r.bahasa || "id"
        ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(dataMatrix);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Soal");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    return new File([blob], "import_soal_edited.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
