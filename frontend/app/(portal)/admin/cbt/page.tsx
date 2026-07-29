"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import {
    useExams,
    useCreateExam,
    useUpdateExam,
    useDeleteExam,
    useImportExams,
    useSubjects,
    useGrades
} from "@/lib/api";
import {
    FileSpreadsheet,
    Plus,
    Search,
    RefreshCw,
    Edit2,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileDown,
    Upload,
    BookOpen,
    Shuffle,
    Calendar,
    Layers,
    Activity,
    Check,
    X
} from "lucide-react";

export default function CBTOperationsAdminPage() {
    const { data: examsData, isLoading, refetch } = useExams() as any;
    const { data: subjects = [] } = useSubjects() as any;
    const { data: grades = [] } = useGrades() as any;

    const createExam = useCreateExam();
    const updateExam = useUpdateExam();
    const deleteExam = useDeleteExam();
    const importExams = useImportExams();

    const exams = React.useMemo(() => {
        if (!examsData) return [];
        if (Array.isArray(examsData)) return examsData;
        if (examsData.data && Array.isArray(examsData.data)) return examsData.data;
        if (examsData.items && Array.isArray(examsData.items)) return examsData.items;
        return [];
    }, [examsData]);

    // Filters & Search
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedStatus, setSelectedStatus] = React.useState("ALL");

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [isEditOpen, setIsEditOpen] = React.useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
    const [isImportOpen, setIsImportOpen] = React.useState(false);
    const [activeExam, setActiveExam] = React.useState<any>(null);

    // Form State
    const [formData, setFormData] = React.useState({
        title: "",
        description: "",
        subject_id: "",
        grade_id: "",
        duration_minutes: 90,
        passing_score: 70,
        max_attempts: 1,
        shuffle_questions: true,
        shuffle_options: true,
        status: "DRAFT"
    });

    // Bulk Import state
    const [importRows, setImportRows] = React.useState<any[]>([]);
    const [importFileName, setImportFileName] = React.useState("");
    const [importing, setImporting] = React.useState(false);
    const [importSuccess, setImportSuccess] = React.useState<string | null>(null);

    // Filtered exams
    const filteredExams = React.useMemo(() => {
        return exams.filter((e: any) => {
            const title = e.Content?.Title || e.title || "";
            const desc = e.Content?.Body || e.description || "";
            const status = e.Content?.Status || e.status || "DRAFT";

            const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                desc.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = selectedStatus === "ALL" || status === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }, [exams, searchTerm, selectedStatus]);

    // Open Edit Modal
    const handleOpenEdit = (exam: any) => {
        setActiveExam(exam);
        setFormData({
            title: exam.Content?.Title || exam.title || "",
            description: exam.Content?.Body || exam.description || "",
            subject_id: exam.Content?.SubjectID || exam.subject_id || "",
            grade_id: exam.Content?.GradeID || exam.grade_id || "",
            duration_minutes: exam.Exam?.DurationMinutes || exam.duration_minutes || 90,
            passing_score: exam.Exam?.PassingScore || exam.passing_score || 70,
            max_attempts: exam.Exam?.MaxAttempts || exam.max_attempts || 1,
            shuffle_questions: exam.Exam?.ShuffleQuestions ?? exam.shuffle_questions ?? true,
            shuffle_options: exam.Exam?.ShuffleOptions ?? exam.shuffle_options ?? true,
            status: exam.Content?.Status || exam.status || "DRAFT"
        });
        setIsEditOpen(true);
    };

    // Create Submit
    const handleCreateSubmit = async () => {
        try {
            await createExam.mutateAsync({
                title: formData.title,
                description: formData.description,
                subject_id: formData.subject_id || undefined,
                grade_id: formData.grade_id || undefined,
                duration_minutes: Number(formData.duration_minutes),
                passing_score: Number(formData.passing_score),
                max_attempts: Number(formData.max_attempts),
                shuffle_questions: formData.shuffle_questions,
                shuffle_options: formData.shuffle_options,
                status: formData.status
            });
            setIsCreateOpen(false);
            resetForm();
            refetch();
        } catch (err) {
            console.error("Failed to create exam:", err);
        }
    };

    // Edit Submit
    const handleEditSubmit = async () => {
        if (!activeExam) return;
        const id = activeExam.Content?.ID || activeExam.id;
        try {
            await updateExam.mutateAsync({
                id,
                data: {
                    title: formData.title,
                    description: formData.description,
                    duration_minutes: Number(formData.duration_minutes),
                    passing_score: Number(formData.passing_score),
                    max_attempts: Number(formData.max_attempts),
                    shuffle_questions: formData.shuffle_questions,
                    shuffle_options: formData.shuffle_options,
                    status: formData.status
                }
            });
            setIsEditOpen(false);
            setActiveExam(null);
            resetForm();
            refetch();
        } catch (err) {
            console.error("Failed to update exam:", err);
        }
    };

    // Delete Submit
    const handleDeleteSubmit = async () => {
        if (!activeExam) return;
        const id = activeExam.Content?.ID || activeExam.id;
        try {
            await deleteExam.mutateAsync(id);
            setIsDeleteOpen(false);
            setActiveExam(null);
            refetch();
        } catch (err) {
            console.error("Failed to delete exam:", err);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            subject_id: "",
            grade_id: "",
            duration_minutes: 90,
            passing_score: 70,
            max_attempts: 1,
            shuffle_questions: true,
            shuffle_options: true,
            status: "DRAFT"
        });
    };

    // Dynamic XLSX parsing for Bulk Import
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFileName(file.name);
        setImporting(true);

        try {
            const XLSX = await import("xlsx");
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) return;
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) return;
            const json: any[] = XLSX.utils.sheet_to_json(sheet);

            const parsedRows = json.map((row: any) => {
                const title = row["Judul Ujian"] || row["title"] || row["Title"] || "";
                const desc = row["Deskripsi"] || row["description"] || row["Description"] || "";
                const duration = Number(row["Durasi (Menit)"] || row["duration_minutes"] || 90);
                const passingScore = Number(row["Passing Score"] || row["passing_score"] || 70);
                const maxAttempts = Number(row["Max Attempts"] || row["max_attempts"] || 1);
                const shuffleQ = (row["Acak Soal"] ?? row["shuffle_questions"] ?? "TRUE").toString().toUpperCase() === "TRUE";
                const shuffleO = (row["Acak Opsi"] ?? row["shuffle_options"] ?? "TRUE").toString().toUpperCase() === "TRUE";
                const status = (row["Status"] || row["status"] || "DRAFT").toString().toUpperCase();

                return {
                    title,
                    description: desc,
                    duration_minutes: duration,
                    passing_score: passingScore,
                    max_attempts: maxAttempts,
                    shuffle_questions: shuffleQ,
                    shuffle_options: shuffleO,
                    status,
                    isValid: Boolean(title)
                };
            });

            setImportRows(parsedRows);
        } catch (err) {
            console.error("Failed to parse file:", err);
        } finally {
            setImporting(false);
        }
    };

    // Template Download
    const handleDownloadTemplate = async () => {
        try {
            const XLSX = await import("xlsx");
            const sampleData = [
                {
                    "Judul Ujian": "Try Out SNBT UTBK 2026 Gelombang 1",
                    "Deskripsi": "Simulasi Ujian UTBK SNBT Potensi Skolastik & Literasi",
                    "Durasi (Menit)": 195,
                    "Passing Score": 650,
                    "Max Attempts": 1,
                    "Acak Soal": "TRUE",
                    "Acak Opsi": "TRUE",
                    "Status": "DRAFT"
                },
                {
                    "Judul Ujian": "Ujian Akhir Semester Matematika Wajib Kelas 12",
                    "Deskripsi": "Ujian Evaluasi Bab Kalkulus & Geometri Tiga Dimensi",
                    "Durasi (Menit)": 90,
                    "Passing Score": 75,
                    "Max Attempts": 2,
                    "Acak Soal": "TRUE",
                    "Acak Opsi": "TRUE",
                    "Status": "DRAFT"
                }
            ];

            const worksheet = XLSX.utils.json_to_sheet(sampleData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Template Ujian");
            XLSX.writeFile(workbook, "Template_Import_Ujian_CBT.xlsx");
        } catch (err) {
            console.error("Failed to download template:", err);
        }
    };

    // Submit Import
    const handleProcessImport = async () => {
        const validRows = importRows.filter((r) => r.isValid);
        if (validRows.length === 0) return;

        try {
            await importExams.mutateAsync(validRows);
            setImportSuccess(`Berhasil mengimpor ${validRows.length} paket ujian!`);
            setTimeout(() => {
                setIsImportOpen(false);
                setImportRows([]);
                setImportFileName("");
                setImportSuccess(null);
                refetch();
            }, 1500);
        } catch (err) {
            console.error("Failed to import exams:", err);
        }
    };

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">CBT ENGINE CMS</Badge>
                        <span className="text-xs text-muted-foreground">Database: `exams` & `contents`</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Manajemen Ujian CBT</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola paket ujian, durasi, passing score, kuncian token, dan fitur bulk import Excel/CSV.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="text-xs font-semibold"
                    >
                        <FileDown className="mr-1.5 h-3.5 w-3.5 text-primary" /> Download Template
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsImportOpen(true)}
                        className="text-xs font-semibold"
                    >
                        <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-success" /> Bulk Import
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                            resetForm();
                            setIsCreateOpen(true);
                        }}
                        className="text-xs font-semibold shadow-sm"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Ujian
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        className="text-xs font-semibold"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Total Paket Ujian</span>
                        <div className="text-2xl font-extrabold">{exams.length} Ujian</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Published & Ongoing</span>
                        <div className="text-2xl font-extrabold text-success">
                            {exams.filter((e: any) => ["PUBLISHED", "ONGOING"].includes(e.Content?.Status || e.status)).length} Ujian
                        </div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Status Draft</span>
                        <div className="text-2xl font-extrabold text-warning">
                            {exams.filter((e: any) => (e.Content?.Status || e.status || "DRAFT") === "DRAFT").length} Draft
                        </div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">CBT Sync Engine</span>
                        <div className="text-2xl font-extrabold text-blue-500">100% Ready</div>
                    </div>
                </Card>
            </div>

            {/* Filter & Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari judul ujian atau deskripsi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 text-xs"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {["ALL", "DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "ARCHIVED"].map((st) => (
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

            {/* Exam Grid */}
            {isLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Memuat daftar ujian dari database...
                </div>
            ) : filteredExams.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="font-bold text-sm">Tidak Ada Paket Ujian Found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        Belum ada data ujian yang sesuai dengan filter. Klik tombol &quot;Tambah Ujian&quot; atau &quot;Bulk Import&quot; untuk menambahkan data.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam: any) => {
                        const id = exam.Content?.ID || exam.id;
                        const title = exam.Content?.Title || exam.title || "Ujian Tanpa Judul";
                        const desc = exam.Content?.Body || exam.description || "Tidak ada deskripsi";
                        const status = exam.Content?.Status || exam.status || "DRAFT";
                        const duration = exam.Exam?.DurationMinutes || exam.duration_minutes || 90;
                        const passing = exam.Exam?.PassingScore || exam.passing_score || 70;
                        const maxAttempts = exam.Exam?.MaxAttempts || exam.max_attempts || 1;
                        const shuffleQ = exam.Exam?.ShuffleQuestions ?? exam.shuffle_questions ?? true;
                        const shuffleO = exam.Exam?.ShuffleOptions ?? exam.shuffle_options ?? true;

                        const badgeVariant =
                            status === "PUBLISHED" ? "default" :
                                status === "ONGOING" ? "success" :
                                    status === "COMPLETED" ? "secondary" :
                                        status === "ARCHIVED" ? "outline" : "warning";

                        return (
                            <Card key={id} className="p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <Badge variant={badgeVariant} className="text-[10px] font-bold tracking-wider">
                                            {status}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                                            <Clock className="h-3 w-3" /> {duration} Menit
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-sm text-foreground line-clamp-1">{title}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{desc}</p>
                                    </div>

                                    <div className="p-3 rounded-xl border bg-muted/30 space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Passing Score:</span>
                                            <span className="font-bold text-primary">{passing} Poin</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Maks Percobaan:</span>
                                            <span className="font-bold">{maxAttempts}x</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-border/50">
                                            <span className="text-muted-foreground">Pengaturan Acak:</span>
                                            <span className="font-semibold text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Shuffle className="h-3 w-3" /> Soal: {shuffleQ ? "Ya" : "Tidak"} | Opsi: {shuffleO ? "Ya" : "Tidak"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenEdit(exam)}
                                        className="text-xs font-semibold"
                                    >
                                        <Edit2 className="mr-1.5 h-3.5 w-3.5 text-primary" /> Edit Ujian
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setActiveExam(exam);
                                            setIsDeleteOpen(true);
                                        }}
                                        className="text-xs font-semibold text-destructive hover:text-destructive border-destructive/20"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Exam Modal */}
            <AdminActionModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Tambah Paket Ujian Baru"
                description="Buat konfigurasi paket ujian CBT baru ke database PostgreSQL"
                onSubmit={handleCreateSubmit}
                submitLabel="Simpan Ujian"
            >
                <div className="space-y-4 text-xs">
                    <div>
                        <label className="text-xs font-semibold">Judul Ujian *</label>
                        <Input
                            placeholder="Contoh: Try Out UTBK SNBT 2026 Paket 1"
                            value={formData.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 text-xs"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold">Deskripsi Ujian</label>
                        <textarea
                            placeholder="Penjelasan singkat mengenai materi, aturan, dan sub-tes ujian..."
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-xs"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold">Mata Pelajaran (Opsional)</label>
                            <select
                                value={formData.subject_id}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, subject_id: e.target.value })}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                            >
                                <option value="">-- Pilih Mapel --</option>
                                {subjects.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold">Tingkat Kelas (Opsional)</label>
                            <select
                                value={formData.grade_id}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, grade_id: e.target.value })}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                            >
                                <option value="">-- Pilih Kelas --</option>
                                {grades.map((g: any) => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-semibold">Durasi (Menit)</label>
                            <Input
                                type="number"
                                value={formData.duration_minutes}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold">Passing Score</label>
                            <Input
                                type="number"
                                value={formData.passing_score}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, passing_score: Number(e.target.value) })}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold">Maks Attempt</label>
                            <Input
                                type="number"
                                value={formData.max_attempts}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, max_attempts: Number(e.target.value) })}
                                className="mt-1 text-xs"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2 border-t">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.shuffle_questions}
                                onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                                className="rounded border-input text-primary"
                            />
                            <span>Acak Urutan Soal</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.shuffle_options}
                                onChange={(e) => setFormData({ ...formData, shuffle_options: e.target.checked })}
                                className="rounded border-input text-primary"
                            />
                            <span>Acak Urutan Opsi</span>
                        </label>
                    </div>
                </div>
            </AdminActionModal>

            {/* Edit Exam Modal */}
            <AdminActionModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Konfigurasi Ujian"
                description="Perbarui metadata dan aturan ujian CBT"
                onSubmit={handleEditSubmit}
                submitLabel="Perbarui Data"
            >
                <div className="space-y-4 text-xs">
                    <div>
                        <label className="text-xs font-semibold">Judul Ujian *</label>
                        <Input
                            value={formData.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 text-xs"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold">Deskripsi Ujian</label>
                        <textarea
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-xs"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold">Status Ujian</label>
                            <select
                                value={formData.status}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                            >
                                <option value="DRAFT">DRAFT</option>
                                <option value="PUBLISHED">PUBLISHED</option>
                                <option value="ONGOING">ONGOING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="ARCHIVED">ARCHIVED</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold">Durasi (Menit)</label>
                            <Input
                                type="number"
                                value={formData.duration_minutes}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                                className="mt-1 text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold">Passing Score</label>
                            <Input
                                type="number"
                                value={formData.passing_score}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, passing_score: Number(e.target.value) })}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold">Maks Percobaan</label>
                            <Input
                                type="number"
                                value={formData.max_attempts}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, max_attempts: Number(e.target.value) })}
                                className="mt-1 text-xs"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2 border-t">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.shuffle_questions}
                                onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                                className="rounded border-input text-primary"
                            />
                            <span>Acak Urutan Soal</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.shuffle_options}
                                onChange={(e) => setFormData({ ...formData, shuffle_options: e.target.checked })}
                                className="rounded border-input text-primary"
                            />
                            <span>Acak Urutan Opsi</span>
                        </label>
                    </div>
                </div>
            </AdminActionModal>

            {/* Delete Modal */}
            <AdminActionModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Hapus Paket Ujian"
                description="Tindakan ini tidak dapat dibatalkan."
                onSubmit={handleDeleteSubmit}
                submitLabel="Ya, Hapus Ujian"
            >
                <div className="p-3 rounded-xl border bg-destructive/10 text-destructive text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" /> Peringatan Penghapusan Ujian
                    </div>
                    <p>
                        Paket Ujian <span className="font-bold text-foreground">{activeExam?.Content?.Title || activeExam?.title}</span> akan dihapus permanen dari database.
                    </p>
                </div>
            </AdminActionModal>

            {/* Bulk Import Modal */}
            <AdminActionModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                title="Bulk Import Paket Ujian dari Excel / CSV"
                description="Unggah file spreadsheet .xlsx atau .csv untuk menambahkan paket ujian secara massal"
                onSubmit={handleProcessImport}
                submitLabel={importing ? "Merapikan File..." : `Import ${importRows.filter(r => r.isValid).length} Ujian`}
            >
                <div className="space-y-4 text-xs">
                    {importSuccess ? (
                        <div className="p-4 rounded-xl bg-success/10 text-success font-bold text-xs flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" /> {importSuccess}
                        </div>
                    ) : (
                        <>
                            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-2 hover:border-primary/50 transition-all">
                                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                                <div>
                                    <label htmlFor="file-upload-exam" className="cursor-pointer text-primary font-bold hover:underline">
                                        Pilih File Excel / CSV
                                    </label>
                                    <input
                                        id="file-upload-exam"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {importFileName ? `File Terpilih: ${importFileName}` : "Format yang didukung: .xlsx, .xls, .csv"}
                                </p>
                            </div>

                            {importRows.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs">Pratinjau Data ({importRows.length} baris)</span>
                                        <Badge variant="outline" className="text-[10px]">
                                            {importRows.filter((r) => r.isValid).length} Valid / {importRows.filter((r) => !r.isValid).length} Error
                                        </Badge>
                                    </div>

                                    <div className="max-h-48 overflow-y-auto rounded-lg border text-[11px]">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-muted text-left border-b font-semibold">
                                                    <th className="p-2">Judul Ujian</th>
                                                    <th className="p-2">Durasi</th>
                                                    <th className="p-2">Passing</th>
                                                    <th className="p-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importRows.map((r, idx) => (
                                                    <tr key={idx} className="border-b hover:bg-muted/40">
                                                        <td className="p-2 font-medium">{r.title || <span className="text-destructive">Kosong</span>}</td>
                                                        <td className="p-2">{r.duration_minutes}m</td>
                                                        <td className="p-2">{r.passing_score}</td>
                                                        <td className="p-2">
                                                            <Badge variant={r.isValid ? "default" : "destructive"} className="text-[9px]">
                                                                {r.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </AdminActionModal>
        </div>
    );
}
