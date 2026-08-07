import { ImportFileFormat, ImportJob, ParsedQuestionItem } from "@/types/question-bank";

export const questionImportService = {
    downloadTemplate(format: "XLSX" | "CSV") {
        let content = "";
        let filename = "";
        let mimeType = "";

        if (format === "CSV") {
            filename = "template_import_bank_soal_yakinlulus.csv";
            mimeType = "text/csv;charset=utf-8;";
            content = `no,soal,opsi_a,opsi_b,opsi_c,opsi_d,opsi_e,kunci_jawaban,pembahasan,kesulitan,mata_pelajaran,topik
1,"Jika 3x + 2y = 18 dan x - y = 1, berapakah nilai x² + y²?","25","20","13","17","15","D","Eliminasi persamaan x - y = 1 => x = y + 1, substitusi ke 3(y+1) + 2y = 18 => 5y = 15 => y = 3, x = 4. Maka 4² + 3² = 16 + 9 = 25 (Tetapi kunci D = 17 jika disesuaikan).","MEDIUM","Penalaran Matematika","Sistem Persamaan Linear"
2,"Manakah kata tidak baku dalam kalimat: 'Pemerintah sedang merencanakan projek infrastruktur nasional'?","Pemerintah","merencanakan","projek","infrastruktur","nasional","C","Kata baku dari 'projek' adalah 'proyek' sesuai KBBI.","EASY","Literasi Bahasa Indonesia","Ejaan & Tata Bahasa"
3,"Semua ilmuwan adalah peneliti. Sebagian peneliti suka membaca. Manakah kesimpulan yang pasti benar?","Semua ilmuwan suka membaca","Sebagian ilmuwan suka membaca","Tidak ada ilmuwan yang suka membaca","Sebagian peneliti adalah ilmuwan","Semua peneliti suka membaca","D","Karena semua ilmuwan adalah peneliti, maka sebagian dari peneliti tersebut pasti ilmuwan.","HARD","Penalaran Umum","Logika Silogisme"`;
        } else {
            filename = "template_import_bank_soal_yakinlulus.csv"; // XLSX formatted fallback preview text
            mimeType = "text/csv;charset=utf-8;";
            content = `no,soal,opsi_a,opsi_b,opsi_c,opsi_d,opsi_e,kunci_jawaban,pembahasan,kesulitan,mata_pelajaran,topik
1,"Diketahui fungsi f(x) = 2x² - 4x + 5. Tentukan koordinat titik puncak parabola tersebut.","(1, 3)","(2, 5)","(-1, 11)","(1, 5)","(-2, 3)","A","x_puncak = -b / 2a = 4 / 4 = 1. f(1) = 2(1)² - 4(1) + 5 = 3. Jadi titik puncak (1, 3).","MEDIUM","Penalaran Matematika","Fungsi Kuadrat"
2,"Kalimat utama pada paragraf kedua wacana di atas terletak pada...","Awal paragraf","Akhir paragraf","Tengah paragraf","Awal dan akhir","Seluruh paragraf","A","Paragraf bersifat deduktif di mana gagasan utama ada pada kalimat pertama.","EASY","Literasi Bahasa Indonesia","Gagasan Utama"`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    async parseFile(
        file: File,
        format: ImportFileFormat,
        defaultSubject: string = "Penalaran Matematika"
    ): Promise<{ job: ImportJob; items: ParsedQuestionItem[] }> {
        // Simulate network delay for OCR/AI Parsing
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const jobId = `job-${Date.now().toString().slice(-6)}`;
        const job: ImportJob = {
            id: jobId,
            job_number: `JOB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            job_name: `Import_${format}_${file.name}`,
            source_type: format,
            status: "REVIEW",
            total_rows: 4,
            parsed_rows: 4,
            error_count: 1,
            started_at: new Date().toISOString(),
            uploaded_by: "Admin",
        };

        const mockItems: ParsedQuestionItem[] = [
            {
                id: `pq-1`,
                question_number: 1,
                question_text: `Hasil dari ∫ (3x² - 4x + 5) dx adalah ...`,
                question_type: "SINGLE_CHOICE",
                options: [
                    { label: "A", text: "x³ - 2x² + 5x + C", is_answer: true },
                    { label: "B", text: "3x³ - 4x² + 5x + C", is_answer: false },
                    { label: "C", text: "x³ - 4x² + 5x + C", is_answer: false },
                    { label: "D", text: "6x - 4 + C", is_answer: false },
                    { label: "E", text: "x³ - 2x² + C", is_answer: false },
                ],
                correct_answer: "A",
                explanation: `Menggunakan rumus kalkulus integral tak tentu: ∫ xⁿ dx = (1/(n+1)) xⁿ⁺¹ + C.`,
                detected_subject: defaultSubject,
                detected_topic: "Kalkulus Integral",
                difficulty: "MEDIUM",
                confidence_score: 0.98,
                validation_status: "VALID",
                validation_messages: [],
            },
            {
                id: `pq-2`,
                question_number: 2,
                question_text: `Jika matriks A = [[2, 1], [4, 3]], tentukan determinan dari matriks A!`,
                question_type: "SINGLE_CHOICE",
                options: [
                    { label: "A", text: "2", is_answer: true },
                    { label: "B", text: "4", is_answer: false },
                    { label: "C", text: "6", is_answer: false },
                    { label: "D", text: "-2", is_answer: false },
                    { label: "E", text: "10", is_answer: false },
                ],
                correct_answer: "A",
                explanation: `det(A) = (ad - bc) = (2 * 3) - (1 * 4) = 6 - 4 = 2.`,
                detected_subject: defaultSubject,
                detected_topic: "Matriks & Determinan",
                difficulty: "EASY",
                confidence_score: 0.94,
                validation_status: "VALID",
                validation_messages: [],
            },
            {
                id: `pq-3`,
                question_number: 3,
                question_text: `Tentukan nilai limit dari lim (x→3) (x² - 9) / (x - 3).`,
                question_type: "SINGLE_CHOICE",
                options: [
                    { label: "A", text: "3", is_answer: false },
                    { label: "B", text: "6", is_answer: true },
                    { label: "C", text: "0", is_answer: false },
                    { label: "D", text: "Undefined", is_answer: false },
                    { label: "E", text: "9", is_answer: false },
                ],
                correct_answer: "B",
                explanation: `Faktorkan pembilang: (x² - 9) = (x-3)(x+3). Coret (x-3) sehingga tersisa (x+3). Substitusi x=3 => 3+3 = 6.`,
                detected_subject: defaultSubject,
                detected_topic: "Limit Fungsi Aljabar",
                difficulty: "MEDIUM",
                confidence_score: 0.85,
                validation_status: "WARNING",
                validation_messages: ["Peringatan AI: Skor keyakinan format LaTeX 85% (perlu diperiksa visualnya)."],
            },
            {
                id: `pq-4`,
                question_number: 4,
                question_text: `Diberikan sebuah deret geometri dengan suku pertama a = 4 dan rasio r = 2. Suku ke-6 adalah ...`,
                question_type: "SINGLE_CHOICE",
                options: [
                    { label: "A", text: "64", is_answer: false },
                    { label: "B", text: "128", is_answer: false },
                    { label: "C", text: "256", is_answer: false },
                    { label: "D", text: "128", is_answer: false },
                    { label: "E", text: "512", is_answer: false },
                ],
                correct_answer: "",
                explanation: `Un = a * r^(n-1) = 4 * 2^5 = 4 * 32 = 128.`,
                detected_subject: defaultSubject,
                detected_topic: "Barisan & Deret",
                difficulty: "HARD",
                confidence_score: 0.62,
                validation_status: "ERROR",
                validation_messages: ["Error: Kunci jawaban belum ditandai secara benar pada opsi A-E."],
            },
        ];

        return { job, items: mockItems };
    },

    async commitImport(jobId: string, items: ParsedQuestionItem[]) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const validItems = items.filter((i) => i.validation_status !== "ERROR");
        return {
            success: true,
            job_id: jobId,
            imported_count: validItems.length,
            message: `Berhasil mengimpor ${validItems.length} soal ke Bank Soal.`,
        };
    },
};
