"use me";
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { AIPDFImportModal } from "@/components/admin/AIPDFImportModal";
import MediaPicker from "@/components/media-picker";
import {
    useQuestions,
    useCreateQuestion,
    useUpdateQuestion,
    useDeleteQuestion,
    useSubjects,
    useChapters,
    useGrades,
    useLevels,
    apiFetch,
} from "@/lib/api";
import {
    Plus,
    Search,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    Calculator,
    FileSpreadsheet,
    Download,
    Trash2,
    Edit3,
    Eye,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Check,
} from "lucide-react";


export default function QuestionBankAdminPage() {
    // Search & Filters
    const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
    const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>("ALL");
    const [selectedSubjectFilter, setSelectedSubjectFilter] = React.useState<string>("ALL");
    const [selectedGradeFilter, setSelectedGradeFilter] = React.useState<string>("ALL");
    const [search, setSearch] = React.useState("");
    const [expandedQuestionId, setExpandedQuestionId] = React.useState<string | null>(null);

    // Academic data
    const { data: levels = [] } = useLevels() as any;
    const levelsList: any[] = Array.isArray(levels) ? levels : levels?.data || [];
    const { data: grades = [] } = useGrades() as any;
    const gradesList: any[] = Array.isArray(grades) ? grades : grades?.data || [];

    // Queries
    const { data: rawQuestions = [], isLoading: loading, refetch } = useQuestions(
        (() => {
            const params: Record<string, string> = {};
            if (selectedSubjectFilter !== "ALL") params.subject_id = selectedSubjectFilter;
            if (selectedGradeFilter !== "ALL") params.grade_id = selectedGradeFilter;
            return Object.keys(params).length > 0 ? params : undefined;
        })()
    ) as any;

    const questions: any[] = Array.isArray(rawQuestions)
        ? rawQuestions
        : rawQuestions?.questions || rawQuestions?.data || [];

    const { data: subjects = [] } = useSubjects() as any;
    const subjectsList: any[] = Array.isArray(subjects) ? subjects : subjects?.data || [];

    // Mutations
    const createQuestionMutation = useCreateQuestion();
    const updateQuestionMutation = useUpdateQuestion();
    const deleteQuestionMutation = useDeleteQuestion();

    // --- Modals State ---
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = React.useState(false);
    const [isAiImportModalOpen, setIsAiImportModalOpen] = React.useState(false);
    const [isFsmModalOpen, setIsFsmModalOpen] = React.useState(false);
    const [isKatexModalOpen, setIsKatexModalOpen] = React.useState(false);

    const [activeQuestion, setActiveQuestion] = React.useState<any | null>(null);
    const [fsmSuccess, setFsmSuccess] = React.useState(false);
    const [newTargetStatus, setNewTargetStatus] = React.useState<string>("APPROVED");

    // Form State (Create & Edit)
    const [formData, setFormData] = React.useState({
        level_id: "",
        grade_id: "",
        subject_id: "",
        chapter_id: "",
        difficulty: "MEDIUM",
        question_type: "SINGLE_CHOICE",
        content: "",
        explanation: "",
        score: 1.0,
        negative_score: 0.0,
        options: [
            { label: "A", content: "", correct: true },
            { label: "B", content: "", correct: false },
            { label: "C", content: "", correct: false },
            { label: "D", content: "", correct: false },
            { label: "E", content: "", correct: false },
        ],
    });

    const insertMedia = (field: "content" | "explanation") => (html: string) => {
        setFormData(prev => ({ ...prev, [field]: prev[field] + "\n" + html + "\n" }));
    };

    // Form Chapter options query
    const { data: chapters = [] } = useChapters(formData.subject_id || undefined) as any;
    const chaptersList: any[] = Array.isArray(chapters) ? chapters : chapters?.data || [];

    // Bulk Import State
    const [importFile, setImportFile] = React.useState<File | null>(null);
    const [parsedImportRows, setParsedImportRows] = React.useState<any[]>([]);
    const [importing, setImporting] = React.useState(false);
    const [importResult, setImportResult] = React.useState<{ created: number; failed: number; errors: string[] } | null>(null);

    // Default subject selection
    React.useEffect(() => {
        if (subjectsList.length > 0 && !formData.subject_id) {
            setFormData((prev) => ({ ...prev, subject_id: subjectsList[0].id }));
        }
    }, [subjectsList]);

    // Handle Open Create Modal
    const handleOpenCreate = () => {
        const defaultSubj = subjectsList.length > 0 ? subjectsList[0].id : "";
        setFormData({
            level_id: "",
            grade_id: "",
            subject_id: defaultSubj,
            chapter_id: "",
            difficulty: "MEDIUM",
            question_type: "SINGLE_CHOICE",
            content: "",
            explanation: "",
            score: 1.0,
            negative_score: 0.0,
            options: [
                { label: "A", content: "", correct: true },
                { label: "B", content: "", correct: false },
                { label: "C", content: "", correct: false },
                { label: "D", content: "", correct: false },
                { label: "E", content: "", correct: false },
            ],
        });
        setIsCreateModalOpen(true);
    };

    // Handle Open Edit Modal
    const handleOpenEdit = (q: any) => {
        setActiveQuestion(q);
        const opts = q.options && q.options.length > 0
            ? q.options.map((o: any) => ({
                label: o.label || "A",
                content: o.content || "",
                correct: Boolean(o.is_correct || o.correct),
            }))
            : [
                { label: "A", content: "", correct: true },
                { label: "B", content: "", correct: false },
                { label: "C", content: "", correct: false },
                { label: "D", content: "", correct: false },
                { label: "E", content: "", correct: false },
            ];

        // Find grade and level from question data
        const grade = gradesList.find((g: any) => g.id === q.grade_id);
        const levelId = grade?.education_level_id || "";

        setFormData({
            level_id: levelId,
            grade_id: q.grade_id || "",
            subject_id: q.subject_id || "",
            chapter_id: q.chapter_id || "",
            difficulty: q.difficulty || "MEDIUM",
            question_type: q.question_type || "SINGLE_CHOICE",
            content: q.content || "",
            explanation: q.explanation || "",
            score: q.score || 1.0,
            negative_score: q.negative_score || 0.0,
            options: opts,
        });
        setIsEditModalOpen(true);
    };

    // Submit Create Question
    const handleCreateSubmit = async () => {
        if (!formData.subject_id) {
            alert("Silakan pilih Mata Pelajaran");
            return;
        }
        if (!formData.content.trim()) {
            alert("Teks Soal tidak boleh kosong");
            return;
        }

        try {
            const payload = {
                subject_id: formData.subject_id,
                chapter_id: formData.chapter_id || undefined,
                difficulty: formData.difficulty,
                question_type: formData.question_type,
                content: formData.content,
                explanation: formData.explanation,
                score: Number(formData.score),
                negative_score: Number(formData.negative_score),
                options: formData.options.filter((o) => o.content.trim() !== ""),
            };

            await createQuestionMutation.mutateAsync(payload);
            setIsCreateModalOpen(false);
            refetch();
        } catch (err: any) {
            alert("Gagal membuat soal: " + (err.message || err));
        }
    };

    // Submit Edit Question
    const handleEditSubmit = async () => {
        if (!activeQuestion) return;
        if (!formData.subject_id) {
            alert("Silakan pilih Mata Pelajaran");
            return;
        }
        if (!formData.content.trim()) {
            alert("Teks Soal tidak boleh kosong");
            return;
        }

        try {
            const payload = {
                subject_id: formData.subject_id,
                chapter_id: formData.chapter_id || undefined,
                difficulty: formData.difficulty,
                question_type: formData.question_type,
                content: formData.content,
                explanation: formData.explanation,
                score: Number(formData.score),
                negative_score: Number(formData.negative_score),
                options: formData.options.filter((o) => o.content.trim() !== ""),
            };

            await updateQuestionMutation.mutateAsync({ id: activeQuestion.id, data: payload });
            setIsEditModalOpen(false);
            setActiveQuestion(null);
            refetch();
        } catch (err: any) {
            alert("Gagal memperbarui soal: " + (err.message || err));
        }
    };

    // Submit Delete Question
    const handleDeleteSubmit = async () => {
        if (!activeQuestion) return;
        try {
            await deleteQuestionMutation.mutateAsync(activeQuestion.id);
            setIsDeleteModalOpen(false);
            setActiveQuestion(null);
            refetch();
        } catch (err: any) {
            alert("Gagal menghapus soal: " + (err.message || err));
        }
    };

    // FSM State Transition
    const handleFsmTransition = async () => {
        if (!activeQuestion) return;

        try {
            if (newTargetStatus === "APPROVED" || newTargetStatus === "PUBLISHED") {
                await apiFetch(`/questions/${activeQuestion.id}/publish`, { method: "POST" });
            } else if (newTargetStatus === "DRAFT") {
                await apiFetch(`/questions/${activeQuestion.id}/unpublish`, { method: "POST" });
            } else if (newTargetStatus === "REJECTED" || newTargetStatus === "ARCHIVED") {
                await apiFetch(`/questions/${activeQuestion.id}/archive`, { method: "POST" });
            }

            setFsmSuccess(true);
            setTimeout(() => {
                setFsmSuccess(false);
                setIsFsmModalOpen(false);
                setActiveQuestion(null);
                refetch();
            }, 1000);
        } catch (err) {
            console.error("FSM Transition failed:", err);
            alert("Gagal memperbarui status FSM");
        }
    };

    // Options Handlers for Create/Edit Form
    const handleOptionChange = (index: number, field: "content" | "correct" | "label", value: any) => {
        const newOpts = [...formData.options];
        if (!newOpts[index]) return;
        if (field === "correct") {
            if (formData.question_type === "SINGLE_CHOICE") {
                newOpts.forEach((o, i) => (o.correct = i === index));
            } else {
                newOpts[index].correct = Boolean(value);
            }
        } else if (field === "content") {
            newOpts[index].content = String(value);
        } else if (field === "label") {
            newOpts[index].label = String(value);
        }
        setFormData({ ...formData, options: newOpts });
    };

    const addOptionRow = () => {
        const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
        const nextLabel = labels[formData.options.length] || `Opsi ${formData.options.length + 1}`;
        setFormData({
            ...formData,
            options: [...formData.options, { label: nextLabel, content: "", correct: false }],
        });
    };

    const removeOptionRow = (index: number) => {
        if (formData.options.length <= 2) {
            alert("Minimal 2 pilihan jawaban");
            return;
        }
        const newOpts = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOpts });
    };

    // --- Bulk Import Parsing & Submission ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFile(file);
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

                // Map spreadsheet columns into API ImportRow format
                const defaultSubjectId = subjectsList.length > 0 ? subjectsList[0].id : "";

                const mapped = rawRows.map((r: any, idx: number) => {
                    const content = r["Teks Soal"] || r["soal"] || r["content"] || r["Question"] || "";
                    const difficulty = (r["Kesulitan"] || r["difficulty"] || "MEDIUM").toString().toUpperCase();
                    const questionType = (r["Tipe Soal"] || r["question_type"] || "SINGLE_CHOICE").toString().toUpperCase();
                    const explanation = r["Pembahasan"] || r["explanation"] || "";

                    // Find subject ID by matching name or fallback to default
                    const subjInput = (r["Mata Pelajaran ID"] || r["subject_id"] || r["Mata Pelajaran"] || "").toString().trim();
                    let matchedSubjId = defaultSubjectId;
                    if (subjInput) {
                        const matchByName = subjectsList.find(
                            (s) => s.id.toLowerCase() === subjInput.toLowerCase() || s.name.toLowerCase() === subjInput.toLowerCase()
                        );
                        if (matchByName) matchedSubjId = matchByName.id;
                        else if (subjInput.length > 20) matchedSubjId = subjInput; // assuming UUID
                    }

                    // Options parsing
                    const correctOptStr = (r["Jawaban Benar"] || r["correct_option"] || r["Jawaban"] || "A").toString().toUpperCase().trim();
                    const optA = r["Opsi A"] || r["option_a"] || r["A"] || "";
                    const optB = r["Opsi B"] || r["option_b"] || r["B"] || "";
                    const optC = r["Opsi C"] || r["option_c"] || r["C"] || "";
                    const optD = r["Opsi D"] || r["option_d"] || r["D"] || "";
                    const optE = r["Opsi E"] || r["option_e"] || r["E"] || "";

                    const optionsList = [];
                    if (optA) optionsList.push({ label: "A", content: String(optA), is_correct: correctOptStr.includes("A") || correctOptStr === "1" });
                    if (optB) optionsList.push({ label: "B", content: String(optB), is_correct: correctOptStr.includes("B") || correctOptStr === "2" });
                    if (optC) optionsList.push({ label: "C", content: String(optC), is_correct: correctOptStr.includes("C") || correctOptStr === "3" });
                    if (optD) optionsList.push({ label: "D", content: String(optD), is_correct: correctOptStr.includes("D") || correctOptStr === "4" });
                    if (optE) optionsList.push({ label: "E", content: String(optE), is_correct: correctOptStr.includes("E") || correctOptStr === "5" });

                    return {
                        rowNum: idx + 2,
                        content: String(content),
                        difficulty: ["EASY", "MEDIUM", "HARD"].includes(difficulty) ? difficulty : "MEDIUM",
                        question_type: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(questionType) ? questionType : "SINGLE_CHOICE",
                        subject_id: matchedSubjId,
                        explanation: String(explanation),
                        options: optionsList,
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
            refetch();
        } catch (err: any) {
            alert("Gagal melakukan import: " + (err.message || err));
        } finally {
            setImporting(false);
        }
    };

    // Download Sample Excel Template
    const handleDownloadTemplate = async () => {
        const XLSX = await import("xlsx");
        const sampleSubj = subjectsList.length > 0 ? subjectsList[0].name : "Penalaran Umum";
        const sampleSubjId = subjectsList.length > 0 ? subjectsList[0].id : "UUID-SUBJECT-ID";

        const sampleData = [
            {
                "Teks Soal": "Berapakah hasil dari 2^3 + 4^2?",
                "Mata Pelajaran": sampleSubj,
                "Mata Pelajaran ID": sampleSubjId,
                "Kesulitan": "MEDIUM",
                "Tipe Soal": "SINGLE_CHOICE",
                "Opsi A": "20",
                "Opsi B": "24",
                "Opsi C": "28",
                "Opsi D": "32",
                "Opsi E": "36",
                "Jawaban Benar": "B",
                "Pembahasan": "2^3 = 8 dan 4^2 = 16. Maka 8 + 16 = 24.",
            },
            {
                "Teks Soal": "Manakah senyawa di bawah ini yang merupakan asam kuat?",
                "Mata Pelajaran": sampleSubj,
                "Mata Pelajaran ID": sampleSubjId,
                "Kesulitan": "EASY",
                "Tipe Soal": "SINGLE_CHOICE",
                "Opsi A": "CH3COOH",
                "Opsi B": "HCl",
                "Opsi C": "NH3",
                "Opsi D": "H2CO3",
                "Opsi E": "H2O",
                "Jawaban Benar": "B",
                "Pembahasan": "HCl (Asam Klorida) terionisasi sempurna dalam air sehingga termasuk asam kuat.",
            },
        ];

        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Bank Soal");
        XLSX.writeFile(wb, "Template_Import_Bank_Soal_YakinLulus.xlsx");
    };

    // Filter questions in list
    const filteredQuestions = questions.filter((q: any) => {
        const text = q.content || q.questionText || "";
        const code = q.code || q.id || "";
        const matchesSearch = text.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = selectedStatus === "ALL" || q.status === selectedStatus;
        const matchesDifficulty = selectedDifficulty === "ALL" || q.difficulty === selectedDifficulty;
        return matchesSearch && matchesStatus && matchesDifficulty;
    });

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">FSM & CRUD ENGINE</Badge>
                        <span className="text-xs text-muted-foreground">Go Fiber API & Supabase PostgreSQL</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Bank Soal & FSM Workflow CMS</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola siklus hidup soal (Draft → Review → Approved), preview KaTeX, serta Import Soal Massal dari Excel / CSV.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsAiImportModalOpen(true)}
                        className="text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md"
                    >
                        <Sparkles className="mr-2 h-4 w-4" /> ✨ Import AI PDF / Gambar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setImportFile(null);
                            setParsedImportRows([]);
                            setImportResult(null);
                            setIsBulkModalOpen(true);
                        }}
                        className="text-xs font-semibold border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Excel / CSV
                    </Button>
                    <Button size="sm" onClick={handleOpenCreate} className="text-xs font-bold shadow-md shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Buat Soal Baru
                    </Button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <Card className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan kode atau teks soal..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        <select
                            value={selectedGradeFilter}
                            onChange={(e) => {
                                setSelectedGradeFilter(e.target.value);
                                setSelectedSubjectFilter("ALL");
                            }}
                            className="px-3 py-1.5 text-xs rounded-xl border bg-background font-semibold shrink-0"
                        >
                            <option value="ALL">Semua Kelas</option>
                            {gradesList.map((g: any) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedSubjectFilter}
                            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs rounded-xl border bg-background font-semibold shrink-0"
                        >
                            <option value="ALL">Semua Mata Pelajaran</option>
                            {subjectsList.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="px-3 py-1.5 text-xs rounded-xl border bg-background font-semibold shrink-0"
                        >
                            <option value="ALL">Semua Kesulitan</option>
                            <option value="EASY">EASY (Mudah)</option>
                            <option value="MEDIUM">MEDIUM (Sedang)</option>
                            <option value="HARD">HARD (Sulit)</option>
                        </select>

                        <div className="flex items-center gap-1 shrink-0">
                            {["ALL", "DRAFT", "APPROVED", "PUBLISHED", "ARCHIVED"].map((st) => (
                                <Button
                                    key={st}
                                    variant={selectedStatus === st ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedStatus(st)}
                                    className="text-[11px] font-semibold h-8"
                                >
                                    {st}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Questions Grid */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center text-xs text-muted-foreground">
                        Memuat data Bank Soal dari PostgreSQL Database...
                    </div>
                ) : filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q: any) => {
                        const isExpanded = expandedQuestionId === q.id;
                        return (
                            <Card key={q.id} className="p-5 space-y-4 hover:border-primary/40 transition-all">
                                <div className="flex items-start justify-between gap-4 border-b pb-3">
                                    <div className="flex items-center flex-wrap gap-2">
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {`Q-${q.id.substring(0, 8)}`}
                                        </Badge>
                                        <Badge variant="default" className="text-[10px] font-bold">
                                            {q.subject_name || "Mata Pelajaran"}
                                        </Badge>
                                        {q.grade_name && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                {q.grade_name}
                                            </Badge>
                                        )}
                                        {q.level_name && !q.grade_name && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                {q.level_name}
                                            </Badge>
                                        )}
                                        {q.chapter_name && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                {q.chapter_name}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-[10px]">
                                            {q.difficulty || "MEDIUM"}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] bg-muted/50">
                                            {q.question_type || "SINGLE_CHOICE"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="default"
                                            className={`text-[10px] font-bold ${q.status === "PUBLISHED"
                                                ? "bg-emerald-600"
                                                : q.status === "APPROVED"
                                                    ? "bg-blue-600"
                                                    : q.status === "DRAFT"
                                                        ? "bg-amber-600"
                                                        : "bg-gray-500"
                                                }`}
                                        >
                                            {q.status || "APPROVED"}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="text-xs text-foreground font-medium bg-muted/20 p-3.5 rounded-xl border whitespace-pre-wrap">
                                    {q.content || "Teks pertanyaan..."}
                                </div>

                                {/* Options & Details Accordion */}
                                {isExpanded && (
                                    <div className="space-y-3 pt-2 border-t mt-3">
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                                Pilihan Jawaban
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {q.options && q.options.length > 0 ? (
                                                    q.options.map((opt: any, i: number) => {
                                                        const isCorrect = opt.is_correct || opt.correct;
                                                        return (
                                                            <div
                                                                key={opt.id || i}
                                                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${isCorrect
                                                                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                                                    : "bg-background"
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold font-mono px-2 py-0.5 rounded bg-muted text-[11px]">
                                                                        {opt.label || String.fromCharCode(65 + i)}
                                                                    </span>
                                                                    <span>{opt.content}</span>
                                                                </div>
                                                                {isCorrect && (
                                                                    <Badge className="bg-emerald-600 text-[10px] shrink-0">
                                                                        <Check className="h-3 w-3 mr-1" /> Jawaban Benar
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Belum ada opsi jawaban tersimpan.
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {q.explanation && (
                                            <div className="p-3 rounded-xl border bg-amber-50/60 border-amber-200 text-xs">
                                                <span className="font-bold text-amber-800 block mb-1">Pembahasan:</span>
                                                <p className="text-amber-900 leading-relaxed">{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between text-xs pt-1 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                        className="text-[11px] text-muted-foreground h-8"
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp className="mr-1 h-3.5 w-3.5" /> Sembunyikan Opsi
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="mr-1 h-3.5 w-3.5" /> Lihat Opsi ({q.options?.length || 0}) & Pembahasan
                                            </>
                                        )}
                                    </Button>

                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setActiveQuestion(q);
                                                setIsKatexModalOpen(true);
                                            }}
                                            className="text-[11px] h-8 font-medium"
                                        >
                                            <Calculator className="mr-1 h-3.5 w-3.5 text-primary" /> KaTeX
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setActiveQuestion(q);
                                                setNewTargetStatus(q.status || "APPROVED");
                                                setIsFsmModalOpen(true);
                                            }}
                                            className="text-[11px] h-8 font-medium"
                                        >
                                            FSM <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenEdit(q)}
                                            className="text-[11px] h-8 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
                                        >
                                            <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setActiveQuestion(q);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="text-[11px] h-8 font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                ) : (
                    <Card className="p-12 text-center text-xs text-muted-foreground">
                        Belum ada soal terdaftar yang sesuai filter.
                    </Card>
                )}
            </div>

            {/* --- CREATE QUESTION MODAL --- */}
            <AdminActionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Buat Soal Baru"
                description="Tambahkan soal baru ke dalam Bank Soal dan database PostgreSQL."
                onSubmit={handleCreateSubmit}
                submitLabel="Simpan Soal Baru"
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Jenjang</label>
                            <select
                                value={formData.level_id || ""}
                                onChange={(e) => {
                                    const levelId = e.target.value;
                                    setFormData({ ...formData, level_id: levelId, grade_id: "", subject_id: "", chapter_id: "" });
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Semua Jenjang --</option>
                                {levelsList.map((l: any) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Kelas</label>
                            <select
                                value={formData.grade_id || ""}
                                onChange={(e) => {
                                    setFormData({ ...formData, grade_id: e.target.value, subject_id: "", chapter_id: "" });
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Semua Kelas --</option>
                                {gradesList
                                    .filter((g: any) => !formData.level_id || g.education_level_id === formData.level_id)
                                    .map((g: any) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Mata Pelajaran *</label>
                            <select
                                value={formData.subject_id}
                                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value, chapter_id: "" })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Pilih Mata Pelajaran --</option>
                                {subjectsList
                                    .filter((s: any) => !formData.grade_id || s.grade_id === formData.grade_id)
                                    .map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Bab / Chapter (Opsional)</label>
                            <select
                                value={formData.chapter_id}
                                onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Tanpa Bab --</option>
                                {chaptersList.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Tipe Soal</label>
                            <select
                                value={formData.question_type}
                                onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="SINGLE_CHOICE">Pilihan Ganda (Single)</option>
                                <option value="MULTIPLE_CHOICE">Pilihan Ganda Kompleks</option>
                                <option value="TRUE_FALSE">Benar / Salah</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Tingkat Kesulitan</label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="EASY">EASY (Mudah)</option>
                                <option value="MEDIUM">MEDIUM (Sedang)</option>
                                <option value="HARD">HARD (Sulit)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Bobot Skor</label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.score}
                                onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) || 1.0 })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Teks Soal / Pertanyaan * (Mendukung KaTeX: contoh $E = mc^2$)
                        </label>
                        <div className="flex gap-2">
                            <textarea
                                rows={4}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Tuliskan teks pertanyaan di sini..."
                                className="flex-1 p-3 text-xs rounded-xl border bg-background font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <MediaPicker onInsert={insertMedia("content")} />
                        </div>
                    </div>

                    {/* Options Editor */}
                    <div className="space-y-2 border-t pt-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-foreground">Pilihan Jawaban (Opsi)</label>
                            <Button type="button" variant="outline" size="sm" onClick={addOptionRow} className="text-[10px] h-7">
                                + Tambah Opsi
                            </Button>
                        </div>

                        {formData.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold w-6 text-center">{opt.label}</span>
                                <input
                                    type="text"
                                    placeholder={`Isi opsi ${opt.label}...`}
                                    value={opt.content}
                                    onChange={(e) => handleOptionChange(i, "content", e.target.value)}
                                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border bg-background"
                                />
                                <label className="flex items-center gap-1 shrink-0 text-[11px] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={opt.correct}
                                        onChange={(e) => handleOptionChange(i, "correct", e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                    />
                                    <span className={opt.correct ? "font-bold text-emerald-700" : "text-muted-foreground"}>
                                        Benar
                                    </span>
                                </label>
                                {formData.options.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOptionRow(i)}
                                        className="text-rose-500 h-7 w-7 p-0"
                                    >
                                        &times;
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Pembahasan Soal</label>
                        <div className="flex gap-2">
                            <textarea
                                rows={3}
                                value={formData.explanation}
                                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                placeholder="Tuliskan langkah penyelesaian atau penjelasan soal..."
                                className="flex-1 p-3 text-xs rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <MediaPicker onInsert={insertMedia("explanation")} />
                        </div>
                    </div>
                </div>
            </AdminActionModal>

            {/* --- EDIT QUESTION MODAL --- */}
            <AdminActionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Soal"
                description={`Penyuntingan soal ID ${activeQuestion?.id?.substring(0, 8)}`}
                onSubmit={handleEditSubmit}
                submitLabel="Simpan Perubahan"
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Jenjang</label>
                            <select
                                value={formData.level_id || ""}
                                onChange={(e) => {
                                    const levelId = e.target.value;
                                    setFormData({ ...formData, level_id: levelId, grade_id: "", subject_id: "", chapter_id: "" });
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Semua Jenjang --</option>
                                {levelsList.map((l: any) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Kelas</label>
                            <select
                                value={formData.grade_id || ""}
                                onChange={(e) => {
                                    setFormData({ ...formData, grade_id: e.target.value, subject_id: "", chapter_id: "" });
                                }}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Semua Kelas --</option>
                                {gradesList
                                    .filter((g: any) => !formData.level_id || g.education_level_id === formData.level_id)
                                    .map((g: any) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Mata Pelajaran *</label>
                            <select
                                value={formData.subject_id}
                                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value, chapter_id: "" })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Pilih Mata Pelajaran --</option>
                                {subjectsList
                                    .filter((s: any) => !formData.grade_id || s.grade_id === formData.grade_id)
                                    .map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Bab / Chapter</label>
                            <select
                                value={formData.chapter_id}
                                onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Tanpa Bab --</option>
                                {chaptersList.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Tipe Soal</label>
                            <select
                                value={formData.question_type}
                                onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="SINGLE_CHOICE">Pilihan Ganda (Single)</option>
                                <option value="MULTIPLE_CHOICE">Pilihan Ganda Kompleks</option>
                                <option value="TRUE_FALSE">Benar / Salah</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Tingkat Kesulitan</label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="EASY">EASY (Mudah)</option>
                                <option value="MEDIUM">MEDIUM (Sedang)</option>
                                <option value="HARD">HARD (Sulit)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Bobot Skor</label>
                            <input
                                type="number"
                                step="0.5"
                                value={formData.score}
                                onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) || 1.0 })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Teks Soal / Pertanyaan *</label>
                        <div className="flex gap-2">
                            <textarea
                                rows={4}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="flex-1 p-3 text-xs rounded-xl border bg-background font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <MediaPicker onInsert={insertMedia("content")} />
                        </div>
                    </div>

                    {/* Options Editor */}
                    <div className="space-y-2 border-t pt-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-foreground">Pilihan Jawaban (Opsi)</label>
                            <Button type="button" variant="outline" size="sm" onClick={addOptionRow} className="text-[10px] h-7">
                                + Tambah Opsi
                            </Button>
                        </div>

                        {formData.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold w-6 text-center">{opt.label}</span>
                                <input
                                    type="text"
                                    value={opt.content}
                                    onChange={(e) => handleOptionChange(i, "content", e.target.value)}
                                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border bg-background"
                                />
                                <label className="flex items-center gap-1 shrink-0 text-[11px] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={opt.correct}
                                        onChange={(e) => handleOptionChange(i, "correct", e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                    />
                                    <span className={opt.correct ? "font-bold text-emerald-700" : "text-muted-foreground"}>
                                        Benar
                                    </span>
                                </label>
                                {formData.options.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOptionRow(i)}
                                        className="text-rose-500 h-7 w-7 p-0"
                                    >
                                        &times;
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Pembahasan Soal</label>
                        <div className="flex gap-2">
                            <textarea
                                rows={3}
                                value={formData.explanation}
                                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                className="flex-1 p-3 text-xs rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <MediaPicker onInsert={insertMedia("explanation")} />
                        </div>
                    </div>
                </div>
            </AdminActionModal>

            {/* --- DELETE QUESTION CONFIRMATION MODAL --- */}
            <AdminActionModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Hapus Soal"
                description="Tindakan ini tidak dapat dibatalkan. Data soal dan opsi jawaban di database akan dihapus permanen."
                onSubmit={handleDeleteSubmit}
                submitLabel="Hapus Soal Permanen"
            >
                <div className="p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-900 text-xs space-y-2">
                    <p className="font-bold">Apakah Anda yakin ingin menghapus soal ini?</p>
                    <p className="font-mono bg-rose-100/80 p-2 rounded border border-rose-300">
                        {activeQuestion?.content}
                    </p>
                </div>
            </AdminActionModal>

            {/* --- BULK IMPORT MODAL (EXCEL / CSV) --- */}
            <AdminActionModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                title="Bulk Import Soal Massal (Excel & CSV)"
                description="Unggah file spreadsheet Excel (.xlsx) atau CSV (.csv) untuk menambah banyak soal secara langsung."
                onSubmit={handleExecuteBulkImport}
                submitLabel={importing ? "Memproses Import..." : `Import ${parsedImportRows.length} Soal ke Database`}
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    {/* Download Sample Template */}
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

                    {/* File Dropzone */}
                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Pilih File Spreadsheet (.xlsx, .xls, .csv)
                        </label>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                    </div>

                    {/* Results Alert */}
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

                    {/* Parsed Preview Table */}
                    {parsedImportRows.length > 0 && (
                        <div className="space-y-2 border-t pt-3">
                            <span className="text-xs font-bold text-foreground block">
                                Pratinjau Data File ({parsedImportRows.length} soal terdeteksi)
                            </span>
                            <div className="max-h-48 overflow-y-auto border rounded-xl">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-muted text-muted-foreground sticky top-0">
                                        <tr>
                                            <th className="p-2">#</th>
                                            <th className="p-2">Teks Soal</th>
                                            <th className="p-2">Kesulitan</th>
                                            <th className="p-2">Opsi</th>
                                            <th className="p-2">Jawaban</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {parsedImportRows.slice(0, 10).map((row, idx) => {
                                            const correctOpt = row.options.find((o: any) => o.is_correct)?.label || "A";
                                            return (
                                                <tr key={idx} className="hover:bg-muted/40">
                                                    <td className="p-2 font-mono">{row.rowNum}</td>
                                                    <td className="p-2 font-mono truncate max-w-[180px]">{row.content}</td>
                                                    <td className="p-2">{row.difficulty}</td>
                                                    <td className="p-2">{row.options.length} opsi</td>
                                                    <td className="p-2 font-bold text-emerald-700">{correctOpt}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {parsedImportRows.length > 10 && (
                                <p className="text-[10px] text-muted-foreground italic">
                                    ...dan {parsedImportRows.length - 10} baris soal lainnya.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </AdminActionModal>

            {/* --- FSM TRANSITION MODAL --- */}
            <AdminActionModal
                isOpen={isFsmModalOpen}
                onClose={() => setIsFsmModalOpen(false)}
                title="Transisi Status FSM State Machine"
                description={`Ubah status kualifikasi untuk soal Q-${activeQuestion?.id?.substring(0, 8)}`}
                onSubmit={handleFsmTransition}
                submitLabel="Perbarui Status FSM"
            >
                {fsmSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Status FSM berhasil diperbarui di PostgreSQL DB!
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="p-3 rounded-xl border bg-muted/40 font-mono text-[11px]">
                            Status Saat Ini: <span className="font-bold text-primary">{activeQuestion?.status || "APPROVED"}</span>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Pilih Status Baru</label>
                            <select
                                value={newTargetStatus}
                                onChange={(e) => setNewTargetStatus(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="APPROVED">APPROVED (Telah Disetujui / Validasi)</option>
                                <option value="PUBLISHED">PUBLISHED (Aktif Siap Dikerjakan Siswa CBT)</option>
                                <option value="DRAFT">DRAFT (Dalam Penyuntingan)</option>
                                <option value="ARCHIVED">ARCHIVED (Diarsipkan / Nonaktif)</option>
                            </select>
                        </div>
                    </div>
                )}
            </AdminActionModal>

            {/* --- KATEX PREVIEW MODAL --- */}
            <AdminActionModal
                isOpen={isKatexModalOpen}
                onClose={() => setIsKatexModalOpen(false)}
                title="KaTeX Math Formula Live Preview"
                description="Visualisasi rendering matematika KaTeX untuk soal ini."
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl border bg-muted/40 font-mono text-xs whitespace-pre-wrap">
                        {activeQuestion?.content}
                    </div>

                    <div className="p-4 rounded-xl border bg-primary/5 text-foreground space-y-2">
                        <span className="text-[11px] font-bold text-primary block uppercase tracking-wider">
                            Rendered Math Output
                        </span>
                        <div className="text-sm font-semibold italic text-foreground bg-background p-3 rounded-lg border">
                            {activeQuestion?.content || "No Math Formula"}
                        </div>
                    </div>
                </div>
            </AdminActionModal>
            {/* --- AI PDF / IMAGE / EXCEL IMPORT MODAL --- */}
            <AIPDFImportModal
                isOpen={isAiImportModalOpen}
                onClose={() => setIsAiImportModalOpen(false)}
                subjectsList={subjectsList}
                chaptersList={chaptersList}
                onSuccessImport={() => refetch()}
            />
        </div>
    );
}
