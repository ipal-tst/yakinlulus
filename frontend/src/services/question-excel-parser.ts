import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import JSZip from "jszip";

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
    questionImageBase64?: string;
    pembahasanImageBase64?: string;
    questionImageFile?: File;
    pembahasanImageFile?: File;
    questionImageUrl?: string;
    pembahasanImageUrl?: string;
    validationErrors: string[];
    duplicateInfo?: {
        isDuplicate: boolean;
        duplicateType?: "FILE" | "DATABASE";
        existingCode?: string;
        action?: "SKIP" | "UPDATE" | "FORCE";
    };
}

export function computeRowHash(row: ParsedQuestionRow): string {
    const norm = (str: string) => (str || "").replace(/<[^>]*>/g, "").toLowerCase().replace(/\s+/g, " ").trim();
    const b1 = norm(row.block1Isi);
    const b2 = norm(row.block2Isi);
    const b3 = norm(row.block3Isi);
    const b4 = norm(row.block4Isi);
    const textBlocks = [b1, b2, b3, b4].filter(Boolean).join(" ");
    const opts = [
        norm(row.optionA),
        norm(row.optionB),
        norm(row.optionC),
        norm(row.optionD),
        norm(row.optionE),
    ].filter(Boolean).join("|");
    return `${textBlocks}|${opts}`;
}

export function detectInternalDuplicates(rows: ParsedQuestionRow[]): ParsedQuestionRow[] {
    const hashMap: Record<string, string> = {};
    return rows.map((row) => {
        const hash = computeRowHash(row);
        if (!hash || hash.length < 5) return row;

        if (hashMap[hash]) {
            return {
                ...row,
                duplicateInfo: {
                    isDuplicate: true,
                    duplicateType: "FILE",
                    existingCode: `Baris #${hashMap[hash]}`,
                    action: "SKIP",
                },
            };
        } else {
            hashMap[hash] = row.no;
            return row;
        }
    });
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
    const arrayBuffer = await file.arrayBuffer();

    // 1. Try extracting embedded images using ExcelJS (Drawing Anchors)
    let rowImagesMap: Record<number, { questionImg?: { base64: string; file: File }; pembahasanImg?: { base64: string; file: File } }> = {};

    try {
        const exceljsWorkbook = new ExcelJS.Workbook();
        await exceljsWorkbook.xlsx.load(arrayBuffer);

        let ws = exceljsWorkbook.getWorksheet("Soal");
        if (!ws) {
            ws = exceljsWorkbook.getWorksheet("Soal (Isi)") || exceljsWorkbook.worksheets[0];
        }

        if (ws) {
            const images = ws.getImages();
            images.forEach((img) => {
                const imgData = exceljsWorkbook.getImage(Number(img.imageId));
                if (imgData && imgData.buffer) {
                    const rowIdx = Math.floor(img.range.tl.row);
                    const colIdx = Math.floor(img.range.tl.col);

                    const extension = (imgData.extension || "png").toLowerCase();
                    const mimeType = extension === "jpeg" || extension === "jpg" ? "image/jpeg" : extension === "gif" ? "image/gif" : "image/png";
                    const buffer = Buffer.from(imgData.buffer as ArrayBuffer);
                    const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
                    const fileObj = new File([buffer], `embedded_${Date.now()}_r${rowIdx}_c${colIdx}.${extension}`, { type: mimeType });

                    [rowIdx, rowIdx + 1].forEach((rKey) => {
                        if (!rowImagesMap[rKey]) {
                            rowImagesMap[rKey] = {};
                        }
                        if (colIdx < 26) {
                            if (!rowImagesMap[rKey].questionImg) {
                                rowImagesMap[rKey].questionImg = { base64, file: fileObj };
                            }
                        } else {
                            if (!rowImagesMap[rKey].pembahasanImg) {
                                rowImagesMap[rKey].pembahasanImg = { base64, file: fileObj };
                            }
                        }
                    });
                }
            });
        }
    } catch (err) {
        console.warn("ExcelJS image extraction warning:", err);
    }

    // 1b. Fallback for Microsoft 365 In-Cell Pictures using JSZip (xl/media/)
    const zipMediaFiles: { base64: string; file: File }[] = [];
    try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const mediaFolder = zip.folder("xl/media");
        if (mediaFolder) {
            const fileKeys: string[] = [];
            mediaFolder.forEach((relativePath) => {
                fileKeys.push(relativePath);
            });
            // Sort media files naturally (image1.png, image2.png, image3.png...)
            fileKeys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

            for (const relPath of fileKeys) {
                const zFile = mediaFolder.file(relPath);
                if (zFile) {
                    const ext = relPath.split(".").pop()?.toLowerCase() || "png";
                    const mimeType = ext === "jpeg" || ext === "jpg" ? "image/jpeg" : ext === "gif" ? "image/gif" : "image/png";
                    const base64Str = await zFile.async("base64");
                    const dataUri = `data:${mimeType};base64,${base64Str}`;
                    const binaryStr = atob(base64Str);
                    const len = binaryStr.length;
                    const bytes = new Uint8Array(len);
                    for (let k = 0; k < len; k++) {
                        bytes[k] = binaryStr.charCodeAt(k);
                    }
                    const fileObj = new File([bytes.buffer], `incell_${relPath}`, { type: mimeType });
                    zipMediaFiles.push({ base64: dataUri, file: fileObj });
                }
            }
        }
    } catch (zipErr) {
        console.warn("JSZip xl/media extraction warning:", zipErr);
    }

    // 2. Parse text cells using SheetJS (XLSX)
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

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
    let zipMediaPointer = 0;

    for (let i = 1; i < rawRows.length; i++) {
        const r = rawRows[i] || [];
        const getVal = (idx: number) => (r[idx] !== undefined && r[idx] !== null ? String(r[idx]).trim() : "");

        const mapel = getVal(2); // Col C
        const rawB1Isi = getVal(8); // Col I (Blok 1 Isi)
        const rawB1Type = getVal(7);
        const rawB2Type = getVal(9);
        const rawB2Isi = getVal(10);
        const rawB3Type = getVal(11);
        const rawB3Isi = getVal(12);
        const rawB4Type = getVal(13);
        const rawB4Isi = getVal(14);
        const pembahasanText = getVal(26); // Col AA (Pembahasan)

        // Skip completely empty lines
        if (!mapel && !rawB1Isi && !rawB2Isi && !rawB3Isi && !getVal(0) && !getVal(15)) {
            continue;
        }

        // Clean formula error artifacts like #VALUE! or #REF!
        const cleanBlock = (val: string) => {
            if (!val || val.includes("#VALUE!") || val.includes("#REF!")) return "";
            return val.trim();
        };

        const b1IsiClean = cleanBlock(rawB1Isi);
        const b2IsiClean = cleanBlock(rawB2Isi);
        const b3IsiClean = cleanBlock(rawB3Isi);
        const b4IsiClean = cleanBlock(rawB4Isi);

        // Combine all valid non-empty block text into a single seamless question content string
        const textBlocks = [b1IsiClean, b2IsiClean, b3IsiClean, b4IsiClean].filter(Boolean);
        const combinedQuestionText = textBlocks.join("\n\n");

        const imgs = rowImagesMap[i] || {};

        let questionImageBase64 = imgs.questionImg?.base64;
        let questionImageFile = imgs.questionImg?.file;
        let questionImageUrl: string | undefined = undefined;

        // Check if any block indicates an image or has a formula error placeholder
        const rowRequiresImage = [rawB1Type, rawB2Type, rawB3Type, rawB4Type].some(t => t.toUpperCase() === "IMAGE") ||
            [rawB1Isi, rawB2Isi, rawB3Isi, rawB4Isi].some(v => v.includes("#VALUE!"));

        // Fallback to JSZip in-cell pictures if no Drawing anchor image was captured for this row
        if (!questionImageBase64 && rowRequiresImage && zipMediaPointer < zipMediaFiles.length) {
            questionImageBase64 = zipMediaFiles[zipMediaPointer].base64;
            questionImageFile = zipMediaFiles[zipMediaPointer].file;
            zipMediaPointer++;
        }

        // Fallback: Check if text contains DataURI or URL
        if (!questionImageBase64 && b1IsiClean) {
            if (b1IsiClean.startsWith("data:image/")) {
                questionImageBase64 = b1IsiClean;
            } else if (b1IsiClean.startsWith("http://") || b1IsiClean.startsWith("https://") || b1IsiClean.startsWith("/storage/")) {
                questionImageUrl = b1IsiClean;
            }
        }

        let pembahasanImageBase64 = imgs.pembahasanImg?.base64;
        let pembahasanImageFile = imgs.pembahasanImg?.file;
        let pembahasanImageUrl: string | undefined = undefined;

        if (!pembahasanImageBase64 && pembahasanText) {
            if (pembahasanText.startsWith("data:image/")) {
                pembahasanImageBase64 = pembahasanText;
            } else if (pembahasanText.startsWith("http://") || pembahasanText.startsWith("https://") || pembahasanText.startsWith("/storage/")) {
                pembahasanImageUrl = pembahasanText;
            }
        }

        // Determine which block contains the image (if any)
        let imgBlockIdx = 0;
        if (rawB1Type.toUpperCase() === "IMAGE" || rawB1Isi.includes("#VALUE!")) imgBlockIdx = 1;
        else if (rawB2Type.toUpperCase() === "IMAGE" || rawB2Isi.includes("#VALUE!")) imgBlockIdx = 2;
        else if (rawB3Type.toUpperCase() === "IMAGE" || rawB3Isi.includes("#VALUE!")) imgBlockIdx = 3;
        else if (rawB4Type.toUpperCase() === "IMAGE" || rawB4Isi.includes("#VALUE!")) imgBlockIdx = 4;
        else if (questionImageBase64 || questionImageUrl) {
            imgBlockIdx = (!b2IsiClean && b1IsiClean) ? 2 : (!b1IsiClean ? 1 : 2);
        }

        const block1Type = imgBlockIdx === 1 ? "IMAGE" : (rawB1Type.toUpperCase() || "PARAGRAPH");
        const block2Type = imgBlockIdx === 2 ? "IMAGE" : (rawB2Type.toUpperCase() || "PARAGRAPH");
        const block3Type = imgBlockIdx === 3 ? "IMAGE" : (rawB3Type.toUpperCase() || "PARAGRAPH");
        const block4Type = imgBlockIdx === 4 ? "IMAGE" : (rawB4Type.toUpperCase() || "PARAGRAPH");

        const rowObj: ParsedQuestionRow = {
            id: `row-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            no: getVal(0) || String(i),
            kode: getVal(1),
            mapel: mapel,
            kelas: getVal(3),
            bab: getVal(4),
            tipeSoal: (getVal(5) || "SINGLE_CHOICE").toUpperCase(),
            kesulitan: (getVal(6) || "MEDIUM").toUpperCase(),
            block1Type,
            block1Isi: b1IsiClean || (imgBlockIdx === 1 ? (questionImageUrl || "Gambar Soal") : ""),
            block2Type,
            block2Isi: b2IsiClean || (imgBlockIdx === 2 ? (questionImageUrl || "Gambar Soal") : ""),
            block3Type,
            block3Isi: b3IsiClean,
            block4Type,
            block4Isi: b4IsiClean,
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
            pembahasan: pembahasanText,
            bloomLevel: getVal(27) || "C3",
            bahasa: getVal(28) || "id",
            questionImageBase64,
            questionImageFile,
            questionImageUrl,
            pembahasanImageBase64,
            pembahasanImageFile,
            pembahasanImageUrl,
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
