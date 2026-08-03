export function getRowValue(r: Record<string, any>, ...possibleKeys: string[]): any {
    if (!r) return undefined;
    const objKeys = Object.keys(r);

    for (const key of possibleKeys) {
        // Direct match
        if (r[key] !== undefined && r[key] !== null && r[key] !== "") {
            return r[key];
        }
        // Case & delimiter insensitive match (strip spaces and underscores)
        const targetClean = key.toLowerCase().replace(/[\s_]/g, "");
        const matchedKey = objKeys.find(k => k.toLowerCase().replace(/[\s_]/g, "") === targetClean);
        if (matchedKey && r[matchedKey] !== undefined && r[matchedKey] !== null && r[matchedKey] !== "") {
            return r[matchedKey];
        }
    }
    return undefined;
}

export function parseQuestionType(rawType: any): string {
    if (!rawType) return "SINGLE_CHOICE";
    const str = String(rawType).trim().toUpperCase();

    if (
        str.includes("TRUE_FALSE") ||
        str.includes("TRUE/FALSE") ||
        str.includes("TRUE FALSE") ||
        str.includes("BENAR") ||
        str.includes("PERNYATAAN") ||
        str === "BS" ||
        str === "B/S"
    ) {
        return "TRUE_FALSE";
    }

    if (
        str.includes("MULTIPLE_CHOICE") ||
        str.includes("MULTIPLE CHOICE") ||
        str.includes("KOMPLEKS") ||
        str.includes("PG KOMPLEKS") ||
        str === "MC"
    ) {
        return "MULTIPLE_CHOICE";
    }

    if (str.includes("ESSAY") || str.includes("URAIAN")) {
        return "ESSAY";
    }

    if (
        str.includes("SHORT_ANSWER") ||
        str.includes("SHORT ANSWER") ||
        str.includes("SINGKAT") ||
        str.includes("ISIAN")
    ) {
        return "SHORT_ANSWER";
    }

    return "SINGLE_CHOICE";
}

export function parseOptionCorrectness(
    qType: string,
    label: string,
    index: number,
    correctOptStr: string
): boolean {
    if (!correctOptStr) return false;
    const cleanCorrect = String(correctOptStr).trim().toUpperCase();

    const parts = cleanCorrect.split(/[,;\s/]+/).map(p => p.trim()).filter(Boolean);

    if (qType === "TRUE_FALSE") {
        // Case 1: Value array like "B, S, B" or "Benar, Salah, Benar" or "1, 0, 1"
        if (parts.length > 1 && index < parts.length) {
            const val = parts[index];
            if (val && ["B", "BENAR", "TRUE", "T", "1", "YA"].includes(val)) return true;
            if (val && ["S", "SALAH", "FALSE", "F", "0", "TIDAK"].includes(val)) return false;
        }
        // Case 2: Label list like "A, C" or "1, 3"
        if (parts.includes(label) || parts.includes(String(index + 1))) {
            return true;
        }
        if (cleanCorrect.includes(label) || cleanCorrect.includes(String(index + 1))) {
            return true;
        }
        return false;
    }

    // SINGLE_CHOICE / MULTIPLE_CHOICE
    if (parts.includes(label) || parts.includes(String(index + 1))) {
        return true;
    }
    return cleanCorrect.includes(label) || cleanCorrect === String(index + 1);
}

export function parseSpreadsheetRowToQuestion(
    r: Record<string, any>,
    idx: number,
    defaultSubjectId: string = ""
) {
    const rawType = getRowValue(r, "Tipe Soal", "tipe_soal", "Tipe_Soal", "TIPE_SOAL", "tipe", "question_type", "questiontype", "type");
    const questionType = parseQuestionType(rawType);

    const contentBase = getRowValue(r, "Teks Soal", "soal", "content", "Question", "Teks_Soal", "teks") || "";
    const imgQ = getRowValue(r, "Gambar Soal (URL)", "gambar_soal", "img_soal") || "";
    const content = imgQ ? `${contentBase}\n\n![gambar soal](${imgQ})` : contentBase;

    const rawDiff = (getRowValue(r, "Kesulitan", "difficulty", "kesulitan") || "MEDIUM").toString().toUpperCase();
    const difficulty = ["EASY", "MEDIUM", "HARD"].includes(rawDiff) ? rawDiff : "MEDIUM";

    const rawBloom = (getRowValue(r, "Level Kognitif", "bloom_level", "bloom", "level_kognitif") || "C3").toString().toUpperCase();
    const bloom_level = ["C1", "C2", "C3", "C4", "C5", "C6"].includes(rawBloom) ? rawBloom : "C3";

    const explanationBase = getRowValue(r, "Pembahasan", "explanation", "pembahasan") || "";
    const imgP = getRowValue(r, "Gambar Pembahasan (URL)", "gambar_pembahasan", "img_pembahasan") || "";
    const explanation = imgP ? `${explanationBase}\n\n![gambar pembahasan](${imgP})` : explanationBase;

    const subjInput = (getRowValue(r, "Mata Pelajaran ID", "subject_id", "Mata Pelajaran", "mata_pelajaran") || "").toString().trim();
    let matchedSubjId = defaultSubjectId;
    if (subjInput && subjInput.length > 20) {
        matchedSubjId = subjInput;
    }

    const correctOptStr = (getRowValue(r, "Jawaban Benar", "correct_option", "Jawaban", "jawaban", "kunci", "jawaban_benar") || "A").toString().trim();
    const score = parseFloat(getRowValue(r, "Skor", "score") || "1") || 1;
    const negScore = parseFloat(getRowValue(r, "Skor Negatif", "negative_score") || "0") || 0;
    const estTime = parseInt(getRowValue(r, "Estimasi Waktu (detik)", "estimated_time") || "60") || 60;
    const source = getRowValue(r, "Sumber", "source") || "MANUAL";

    const labels = ["A", "B", "C", "D", "E"];
    const optionsList: any[] = [];

    labels.forEach((label, i) => {
        const text = getRowValue(r, `Opsi ${label}`, `Opsi_${label}`, `Pernyataan ${i+1}`, `Pernyataan_${i+1}`, `Option ${label}`, `option_${label.toLowerCase()}`, label) || "";
        const img = getRowValue(r, `Gambar ${label} (URL)`, `Gambar_${label}`, `img_${label.toLowerCase()}`) || "";

        if (!text && !img) return;

        const optContent = img ? `${text} ![gambar](${img})` : text;
        const is_correct = parseOptionCorrectness(questionType, label, i, correctOptStr);

        optionsList.push({
            label,
            content: optContent,
            option_text: optContent,
            is_correct,
        });
    });

    const finalOptions = optionsList.length > 0
        ? optionsList
        : [
            { label: "A", content: "Opsi A", option_text: "Opsi A", is_correct: true },
            { label: "B", content: "Opsi B", option_text: "Opsi B", is_correct: false },
        ];

    return {
        rowNum: idx + 2,
        id: `q-${Date.now()}-${idx}`,
        content: String(content),
        difficulty,
        question_type: questionType,
        subject_id: matchedSubjId,
        explanation: String(explanation),
        options: finalOptions,
        score,
        negative_score: negScore,
        estimated_time: estTime,
        bloom_level,
        source: String(source),
        has_image: Boolean(imgQ),
    };
}
