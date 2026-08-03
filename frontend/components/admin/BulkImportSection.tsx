"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StagingQuestionCard, type StagingRow } from "@/components/admin/StagingQuestionCard";
import { apiFetch } from "@/lib/api";
import { CheckCircle2, Download, FileSpreadsheet, Loader2 } from "lucide-react";

interface BulkImportSectionProps {
    subjectsList: any[];
    onSuccessImport: () => void;
}

export function BulkImportSection({ subjectsList, onSuccessImport }: BulkImportSectionProps) {
    const [parsedImportRows, setParsedImportRows] = React.useState<StagingRow[]>([]);
    const [importing, setImporting] = React.useState(false);
    const [importResult, setImportResult] = React.useState<{ created: number; failed: number; errors: string[] } | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportResult(null);

        const XLSX = await import("xlsx");
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                if (!wsname) return;
                const ws = wb.Sheets[wsname];
                if (!ws) return;
                const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

                if (rawRows.length === 0) {
                    alert("File spreadsheet kosong!");
                    return;
                }

                const defaultSubjectId = subjectsList.length > 0 ? subjectsList[0]?.id || "" : "";

                const mapped: StagingRow[] = rawRows.map((r: any, idx: number) => {
                    const contentBase = r["Teks Soal"] || r["soal"] || r["content"] || r["Question"] || "";
                    const imgQ = r["Gambar Soal (URL)"] || "";
                    const content = imgQ ? `${contentBase}\n\n![gambar soal](${imgQ})` : contentBase;
                    const difficulty = (r["Kesulitan"] || r["difficulty"] || "MEDIUM").toString().toUpperCase();
                    const questionType = (r["Tipe Soal"] || r["question_type"] || "SINGLE_CHOICE").toString().toUpperCase();
                    const explanationBase = r["Pembahasan"] || r["explanation"] || "";
                    const imgP = r["Gambar Pembahasan (URL)"] || "";
                    const explanation = imgP ? `${explanationBase}\n\n![gambar pembahasan](${imgP})` : explanationBase;

                    const subjInput = (r["Mata Pelajaran ID"] || r["subject_id"] || r["Mata Pelajaran"] || "").toString().trim();
                    let matchedSubjId = defaultSubjectId;
                    if (subjInput) {
                        const matchByName = subjectsList.find(
                            (s) => s.id.toLowerCase() === subjInput.toLowerCase() || s.name.toLowerCase() === subjInput.toLowerCase()
                        );
                        if (matchByName) matchedSubjId = matchByName.id;
                        else if (subjInput.length > 20) matchedSubjId = subjInput;
                    }

                    const correctOptStr = (r["Jawaban Benar"] || r["correct_option"] || r["Jawaban"] || "A").toString().toUpperCase().trim();
                    const labels = ["A", "B", "C", "D", "E"];
                    const optText = [r["Opsi A"], r["Opsi B"], r["Opsi C"], r["Opsi D"], r["Opsi E"]];
                    const optImg = [r["Gambar A (URL)"], r["Gambar B (URL)"], r["Gambar C (URL)"], r["Gambar D (URL)"], r["Gambar E (URL)"]];

                    const optionsList: any[] = [];
                    labels.forEach((label, i) => {
                        const text = optText[i] || "";
                        const img = optImg[i] || "";
                        if (!text && !img) return;
                        const content = img ? `${text} ![gambar](${img})` : text;
                        optionsList.push({ label, content, is_correct: correctOptStr.includes(label) || correctOptStr === String(i + 1) });
                    });

                    const score = parseFloat(r["Skor"]) || 1;
                    const negScore = parseFloat(r["Skor Negatif"]) || 0;
                    const estTime = parseInt(r["Estimasi Waktu (detik)"]) || 60;
                    const bloom = r["Level Kognitif"] || "";
                    const source = r["Sumber"] || "MANUAL";

                    return {
                        rowNum: idx + 2,
                        content: String(content),
                        difficulty: ["EASY", "MEDIUM", "HARD"].includes(difficulty) ? difficulty : "MEDIUM",
                        question_type: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "ESSAY", "SHORT_ANSWER"].includes(questionType) ? questionType : "SINGLE_CHOICE",
                        subject_id: matchedSubjId,
                        explanation: String(explanation),
                        options: optionsList.length > 0
                            ? optionsList
                            : [{ label: "A", content: "Opsi A", is_correct: true }, { label: "B", content: "Opsi B", is_correct: false }],
                        score,
                        negative_score: negScore,
                        estimated_time: estTime,
                        bloom_level: bloom || undefined,
                        source: source || undefined,
                    };
                });

                setParsedImportRows(mapped);
            } catch (err) {
                console.error("Failed to parse file:", err);
                alert("Format file tidak valid. Harap unggah file .xlsx, .xls, atau .csv");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleUpdateImportRow = (idx: number, updated: StagingRow) => {
        setParsedImportRows(prev => prev.map((r, i) => (i === idx ? updated : r)));
    };

    const handleRemoveImportRow = (idx: number) => {
        setParsedImportRows(prev => prev.filter((_, i) => i !== idx));
    };

    const handleExecuteBulkImport = async () => {
        if (parsedImportRows.length === 0) return;
        setImporting(true);
        setImportResult(null);

        try {
            const res: any = await apiFetch("/questions/import", {
                method: "POST",
                body: JSON.stringify(parsedImportRows),
            });

            setImportResult(res);
            onSuccessImport();
        } catch (err: any) {
            alert("Gagal melakukan import: " + (err.message || err));
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        const XLSX = await import("xlsx");
        const sampleSubj = subjectsList.length > 0 ? subjectsList[0]?.name || "Penalaran Umum" : "Penalaran Umum";
        const sampleSubjId = subjectsList.length > 0 ? subjectsList[0]?.id || "UUID-SUBJECT-ID" : "UUID-SUBJECT-ID";

        const sampleData = [
            {
                "Tipe Soal": "SINGLE_CHOICE",
                "Teks Soal": "Berapakah hasil dari 2^3 + 4^2?",
                "Gambar Soal (URL)": "",
                "Mata Pelajaran": sampleSubj,
                "Mata Pelajaran ID": sampleSubjId,
                "Bab ID": "",
                "Topik ID": "",
                "Kesulitan": "MEDIUM",
                "Level Kognitif": "C3",
                "Skor": 1,
                "Skor Negatif": 0,
                "Estimasi Waktu (detik)": 60,
                "Sumber": "MANUAL",
                "Opsi A": "20",
                "Gambar A (URL)": "",
                "Opsi B": "24",
                "Gambar B (URL)": "",
                "Opsi C": "28",
                "Gambar C (URL)": "",
                "Opsi D": "32",
                "Gambar D (URL)": "",
                "Opsi E": "36",
                "Gambar E (URL)": "",
                "Jawaban Benar": "B",
                "Pembahasan": "2^3 = 8 dan 4^2 = 16. Maka 8 + 16 = 24.",
                "Gambar Pembahasan (URL)": "",
            },
            {
                "Tipe Soal": "MULTIPLE_CHOICE",
                "Teks Soal": "Manakah dari berikut ini yang termasuk bilangan prima?",
                "Gambar Soal (URL)": "",
                "Mata Pelajaran": sampleSubj,
                "Mata Pelajaran ID": sampleSubjId,
                "Bab ID": "",
                "Topik ID": "",
                "Kesulitan": "EASY",
                "Level Kognitif": "C1",
                "Skor": 1,
                "Skor Negatif": 0,
                "Estimasi Waktu (detik)": 45,
                "Sumber": "MANUAL",
                "Opsi A": "2",
                "Gambar A (URL)": "",
                "Opsi B": "4",
                "Gambar B (URL)": "",
                "Opsi C": "7",
                "Gambar C (URL)": "",
                "Opsi D": "9",
                "Gambar D (URL)": "",
                "Opsi E": "11",
                "Gambar E (URL)": "",
                "Jawaban Benar": "A,C,E",
                "Pembahasan": "Bilangan prima: 2, 3, 5, 7, 11, 13, ...",
                "Gambar Pembahasan (URL)": "",
            },
            {
                "Tipe Soal": "TRUE_FALSE",
                "Teks Soal": "Bumi berbentuk bulat sempurna.",
                "Gambar Soal (URL)": "https://cdn.example.com/globe.png",
                "Mata Pelajaran": sampleSubj,
                "Mata Pelajaran ID": sampleSubjId,
                "Bab ID": "",
                "Topik ID": "",
                "Kesulitan": "EASY",
                "Level Kognitif": "C1",
                "Skor": 1,
                "Skor Negatif": 0,
                "Estimasi Waktu (detik)": 30,
                "Sumber": "MANUAL",
                "Opsi A": "Benar",
                "Gambar A (URL)": "",
                "Opsi B": "Salah",
                "Gambar B (URL)": "",
                "Opsi C": "",
                "Gambar C (URL)": "",
                "Opsi D": "",
                "Gambar D (URL)": "",
                "Opsi E": "",
                "Gambar E (URL)": "",
                "Jawaban Benar": "B",
                "Pembahasan": "Bumi berbentuk ellipsoid (geoid), tidak bulat sempurna karena pipih di kutub.",
                "Gambar Pembahasan (URL)": "",
            },
            {
                "Tipe Soal": "ESSAY",
                "Teks Soal": "Jelaskan proses fotosintesis pada tumbuhan!",
                "Gambar Soal (URL)": "",
                "Mata Pelajaran": sampleSubj,
                "Mata Pelajaran ID": sampleSubjId,
                "Bab ID": "",
                "Topik ID": "",
                "Kesulitan": "HARD",
                "Level Kognitif": "C4",
                "Skor": 5,
                "Skor Negatif": 0,
                "Estimasi Waktu (detik)": 300,
                "Sumber": "MANUAL",
                "Opsi A": "",
                "Gambar A (URL)": "",
                "Opsi B": "",
                "Gambar B (URL)": "",
                "Opsi C": "",
                "Gambar C (URL)": "",
                "Opsi D": "",
                "Gambar D (URL)": "",
                "Opsi E": "",
                "Gambar E (URL)": "",
                "Jawaban Benar": "",
                "Pembahasan": "Fotosintesis: 6CO2 + 6H2O → C6H12O6 + 6O2",
                "Gambar Pembahasan (URL)": "",
            },
        ];

        const ws = XLSX.utils.json_to_sheet(sampleData);
        ws["!cols"] = [
            { wch: 18 }, { wch: 50 }, { wch: 40 }, { wch: 20 }, { wch: 20 },
            { wch: 48 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 8 },
            { wch: 10 }, { wch: 12 }, { wch: 40 }, { wch: 40 }, { wch: 40 },
            { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 },
            { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 },
        ];

        const instructionsData = [
            { "Petunjuk": "TEMPLATE IMPORT BANK SOAL YAKINLULUS.ID" },
            { "Petunjuk": "" },
            { "Petunjuk": "TIPE SOAL:" },
            { "Petunjuk": "  SINGLE_CHOICE   → satu jawaban benar. Isi Jawaban Benar dengan huruf opsi (A/B/C/D/E)" },
            { "Petunjuk": "  MULTIPLE_CHOICE → lebih dari satu jawaban benar. Isi Jawaban Benar dengan huruf dipisah koma (A,C,E)" },
            { "Petunjuk": "  TRUE_FALSE      → pernyataan benar/salah. Opsi A = Benar, Opsi B = Salah. Jawaban Benar = A atau B" },
            { "Petunjuk": "  ESSAY           → jawaban uraian. Opsional: isi Opsi A dengan kata kunci. Jawaban Benar dikosongkan" },
            { "Petunjuk": "  SHORT_ANSWER    → jawaban singkat. Opsi A = kata kunci. Jawaban Benar dikosongkan" },
            { "Petunjuk": "" },
            { "Petunjuk": "KOLOM LAINNYA:" },
            { "Petunjuk": "  Kesulitan: EASY | MEDIUM | HARD" },
            { "Petunjuk": "  Level Kognitif (Bloom): C1 | C2 | C3 | C4 | C5 | C6" },
            { "Petunjuk": "  Sumber: MANUAL | AI_GENERATED | IMPORTED" },
            { "Petunjuk": "  Skor: bobot nilai soal (default 1)" },
            { "Petunjuk": "  Skor Negatif: pengurangan nilai jika salah (default 0)" },
            { "Petunjuk": "" },
            { "Petunjuk": "CARA INPUT GAMBAR (Supabase Storage):" },
            { "Petunjuk": "  1. Buka menu Media Manager di form soal → Upload gambar → otomatis tersimpan di Supabase Storage bucket 'media'." },
            { "Petunjuk": "  2. Klik gambar → disisipkan sebagai markdown: ![nama](https://.../object/public/media/uploads/xxx.png)" },
            { "Petunjuk": "  3. ATAU upload manual ke Supabase → Storage → bucket 'media' → copy public URL." },
            { "Petunjuk": "  4. Tempel URL ke kolom 'Gambar Soal (URL)' / 'Gambar A (URL)' / 'Gambar Pembahasan (URL)'." },
            { "Petunjuk": "  5. Gambar juga bisa ditulis LANGSUNG di 'Teks Soal' / 'Pembahasan' / teks opsi dalam format markdown:" },
            { "Petunjuk": "     ![deskripsi](https://...supabase.co/storage/v1/object/public/media/uploads/soal1.png)" },
            { "Petunjuk": "     Format ini menampilkan gambar DI TENGAH teks pada posisi yang diinginkan." },
            { "Petunjuk": "" },
            { "Petunjuk": "FORMAT MARKDOWN & RUMUS (didukung di Teks Soal, Pembahasan, dan teks opsi):" },
            { "Petunjuk": "  Rumus inline:  $x^2 + 5x - 6 = 0$  → dirender rapi oleh KaTeX" },
            { "Petunjuk": "  Rumus blok:    $$E = mc^2$$" },
            { "Petunjuk": "  Gambar tengah:  teks...  ![grafik](URL)  ...teks" },
            { "Petunjuk": "  Tabel / list / bold: gunakan sintaks markdown standar" },
            { "Petunjuk": "" },
            { "Petunjuk": "CATATAN: Kolom 'Gambar X (URL)' hanya mendukung SATU gambar per kolom." },
            { "Petunjuk": "Jika butuh banyak gambar di posisi berbeda, tulis markdown langsung di kolom teks." },
        ];
        const ws2 = XLSX.utils.json_to_sheet(instructionsData);
        ws2["!cols"] = [{ wch: 120 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Bank Soal");
        XLSX.utils.book_append_sheet(wb, ws2, "Petunjuk");

        const headerRange = XLSX.utils.decode_range(ws["!ref"] || "A1:Y1");
        for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r: 0, c });
            if (ws[addr]) ws[addr].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1565C0" } } };
        }

        XLSX.writeFile(wb, "Template_Import_Bank_Soal_YakinLulus.xlsx");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-emerald-50/60 border-emerald-200">
                <div>
                    <span className="text-xs font-bold text-emerald-900 block">Belum punya format file?</span>
                    <span className="text-[11px] text-emerald-700">Unduh sampel template Excel resmi YakinLulus.id.</span>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="text-xs font-bold text-emerald-800 border-emerald-300 bg-white hover:bg-emerald-100"
                >
                    <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Download Template
                </Button>
            </div>

            <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <div>
                        <h3 className="text-sm font-extrabold">Import Massal Excel / CSV</h3>
                        <p className="text-[11px] text-muted-foreground">
                            Unggah file spreadsheet (.xlsx, .xls, .csv) — pratinjau bisa diedit sebelum import.
                        </p>
                    </div>
                </div>

                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-background cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
            </Card>

            {importResult && (
                <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${importResult.failed === 0
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                        }`}
                >
                    <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Import Selesai: {importResult.created} berhasil dibuat, {importResult.failed} gagal.
                    </p>
                    {importResult.errors && importResult.errors.length > 0 && (
                        <ul className="list-disc pl-5 text-[11px] space-y-0.5 mt-1 text-rose-700">
                            {importResult.errors.map((errStr, idx) => (
                                <li key={idx}>{errStr}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {parsedImportRows.length > 0 && (
                <div className="space-y-3">
                    <span className="text-xs font-bold text-foreground block">
                        Pratinjau & Edit Data ({parsedImportRows.length} soal terdeteksi)
                    </span>
                    <div className="space-y-2">
                        {parsedImportRows.map((row, idx) => (
                            <StagingQuestionCard
                                key={row.rowNum}
                                row={row}
                                index={idx}
                                onChange={(updated) => handleUpdateImportRow(idx, updated)}
                                onDelete={() => handleRemoveImportRow(idx)}
                            />
                        ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                        Klik soal untuk edit. Tandai kunci jawaban lewat radio, tambah/hapus opsi, sisipkan gambar, lalu Import.
                    </p>
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            disabled={importing || parsedImportRows.length === 0}
                            onClick={handleExecuteBulkImport}
                            className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                        >
                            {importing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses Import...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" /> Import {parsedImportRows.length} Soal ke Database
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {parsedImportRows.length === 0 && !importResult && (
                <Card className="p-8 border-dashed text-center space-y-2">
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Belum ada data</Badge>
                    <p className="text-xs text-muted-foreground">
                        Unggah file Excel/CSV di atas untuk melihat pratinjau soal yang dapat diedit sebelum disimpan ke database.
                    </p>
                </Card>
            )}
        </div>
    );
}
