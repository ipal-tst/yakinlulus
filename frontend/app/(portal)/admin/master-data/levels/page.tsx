"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { useGrades } from "@/lib/api";
import { apiClient } from "@/lib/api-client";
import {
    School,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    Layers,
    BookOpen,
    RefreshCw,
    Sparkles,
    AlertTriangle,
} from "lucide-react";

interface LevelItem {
    id: string;
    code: string;
    name: string;
    stage: "SD" | "SMP" | "SMA" | "SMK" | "ALUMNI";
    grade_number: number;
    description: string;
    active_students_count: number;
}

const GRADE_OPTIONS_MAP: Record<LevelItem["stage"], { value: string; label: string }[]> = {
    SMA: [
        { value: "12", label: "Kelas 12" },
        { value: "11", label: "Kelas 11" },
        { value: "10", label: "Kelas 10" },
    ],
    SMP: [
        { value: "9", label: "Kelas 9" },
        { value: "8", label: "Kelas 8" },
        { value: "7", label: "Kelas 7" },
    ],
    SD: [
        { value: "6", label: "Kelas 6" },
        { value: "5", label: "Kelas 5" },
        { value: "4", label: "Kelas 4" },
        { value: "3", label: "Kelas 3" },
        { value: "2", label: "Kelas 2" },
        { value: "1", label: "Kelas 1" },
    ],
    SMK: [
        { value: "12", label: "Kelas 12 SMK" },
        { value: "11", label: "Kelas 11 SMK" },
        { value: "10", label: "Kelas 10 SMK" },
    ],
    ALUMNI: [
        { value: "13", label: "Alumni / Gap Year" },
    ],
};

export default function MasterDataLevelsPage() {
    const { data: apiLevels = [], isLoading: levelsLoading, refetch } = useGrades() as any;
    const [search, setSearch] = React.useState("");
    const [selectedStage, setSelectedStage] = React.useState<string>("ALL");
    const [levels, setLevels] = React.useState<LevelItem[]>([]);

    // Sync API data to local state for optimistic updates
    React.useEffect(() => {
        if (Array.isArray(apiLevels) && apiLevels.length > 0) {
            const mapped = apiLevels.map(mapApiLevelToLevelItem);
            setLevels(mapped);
        }
    }, [apiLevels]);

    // Add Modal state
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [modalFeedback, setModalFeedback] = React.useState<string | null>(null);
    const [formStage, setFormStage] = React.useState<LevelItem["stage"]>("SMA");
    const [formGrade, setFormGrade] = React.useState("12");
    const [formDesc, setFormDesc] = React.useState("");

    // Edit Modal state
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<LevelItem | null>(null);
    const [editStage, setEditStage] = React.useState<LevelItem["stage"]>("SMA");
    const [editGrade, setEditGrade] = React.useState("12");
    const [editDesc, setEditDesc] = React.useState("");

    // Delete Confirmation Modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [deletingItem, setDeletingItem] = React.useState<LevelItem | null>(null);

    // Auto compute Kode Unik & Nama for Add
    const computedCode = React.useMemo(() => {
        if (formStage === "ALUMNI") return "ALUMNI";
        return `${formStage}-${formGrade}`;
    }, [formStage, formGrade]);

    const computedName = React.useMemo(() => {
        if (formStage === "ALUMNI") return "Alumni / Gap Year";
        if (formStage === "SMA") return `Kelas ${formGrade} SMA / MA`;
        if (formStage === "SMP") return `Kelas ${formGrade} SMP / MTs`;
        if (formStage === "SD") return `Kelas ${formGrade} SD / MI`;
        if (formStage === "SMK") return `Kelas ${formGrade} SMK`;
        return `Kelas ${formGrade} ${formStage}`;
    }, [formStage, formGrade]);

    // Auto compute for Edit
    const editComputedCode = React.useMemo(() => {
        if (editStage === "ALUMNI") return "ALUMNI";
        return `${editStage}-${editGrade}`;
    }, [editStage, editGrade]);

    const editComputedName = React.useMemo(() => {
        if (editStage === "ALUMNI") return "Alumni / Gap Year";
        if (editStage === "SMA") return `Kelas ${editGrade} SMA / MA`;
        if (editStage === "SMP") return `Kelas ${editGrade} SMP / MTs`;
        if (editStage === "SD") return `Kelas ${editGrade} SD / MI`;
        if (editStage === "SMK") return `Kelas ${editGrade} SMK`;
        return `Kelas ${editGrade} ${editStage}`;
    }, [editStage, editGrade]);

    const handleStageChange = (newStage: LevelItem["stage"]) => {
        setFormStage(newStage);
        const availableGrades = GRADE_OPTIONS_MAP[newStage];
        if (availableGrades && availableGrades[0]) {
            setFormGrade(availableGrades[0].value);
        }
    };

    const handleEditStageChange = (newStage: LevelItem["stage"]) => {
        setEditStage(newStage);
        const availableGrades = GRADE_OPTIONS_MAP[newStage];
        if (availableGrades && availableGrades[0]) {
            setEditGrade(availableGrades[0].value);
        }
    };

    const mapApiLevelToLevelItem = (raw: any): LevelItem => {
        const code = raw.alias || raw.code || raw.level_code || raw.name || "SMA-12";
        const name = raw.name || "Kelas 12 SMA / MA";
        let stage: LevelItem["stage"] = "SMA";
        let grade_number = 12;

        const levelCodeUpper = (raw.level_code || code || "").toUpperCase();
        const nameUpper = name.toUpperCase();

        if (levelCodeUpper.includes("SD") || nameUpper.includes("SD")) {
            stage = "SD";
        } else if (levelCodeUpper.includes("SMP") || nameUpper.includes("SMP")) {
            stage = "SMP";
        } else if (levelCodeUpper.includes("SMK") || nameUpper.includes("SMK")) {
            stage = "SMK";
        } else if (
            levelCodeUpper.includes("UTBK") ||
            levelCodeUpper.includes("GAPYEAR") ||
            nameUpper.includes("UTBK") ||
            nameUpper.includes("GAPYEAR") ||
            nameUpper.includes("ALUMNI")
        ) {
            stage = "ALUMNI";
            grade_number = 13;
        }

        const gradeMatch = code.match(/\d+/) || name.match(/\d+/);
        if (gradeMatch && stage !== "ALUMNI") {
            grade_number = parseInt(gradeMatch[0], 10);
        }

        return {
            id: raw.id,
            code: code,
            name: name,
            stage: stage,
            grade_number: grade_number,
            description: raw.description || `Tingkat ${name} untuk persiapan ujian CBT`,
            active_students_count: raw.active_students_count || 0,
        };
    };

    // CREATE
    const handleCreateLevel = async () => {
        setModalFeedback(null);
        const payload = {
            name: computedName,
            alias: computedCode,
            level_code: formStage,
            display_order: levels.length + 1,
        };

        try {
            const res = await apiClient.academic.createGrade(payload);
            if (res.success && res.data) {
                const createdItem = mapApiLevelToLevelItem(res.data);
                createdItem.stage = formStage;
                createdItem.grade_number = parseInt(formGrade) || 12;
                createdItem.description = formDesc || `Tingkat ${computedName}`;

                setLevels([createdItem, ...levels]);
                setModalFeedback(`Jenjang/Tingkat ${computedCode} (${computedName}) berhasil disimpan ke Database!`);
                setTimeout(() => {
                    setModalFeedback(null);
                    setIsAddModalOpen(false);
                    setFormDesc("");
                }, 1000);
            } else {
                setModalFeedback(`Gagal menyimpan: ${res.message || res.error || "Terjadi kesalahan server"}`);
            }
        } catch (e: any) {
            setModalFeedback(`Error: ${e?.message || "Gagal terhubung ke backend"}`);
        }
    };

    // OPEN EDIT MODAL
    const handleOpenEdit = (lvl: LevelItem) => {
        setEditingItem(lvl);
        setEditStage(lvl.stage);
        setEditGrade(lvl.grade_number.toString());
        setEditDesc(lvl.description);
        setModalFeedback(null);
        setIsEditModalOpen(true);
    };

    // SAVE EDIT
    const handleSaveEdit = async () => {
        if (!editingItem) return;
        setModalFeedback(null);

        const updated: LevelItem = {
            ...editingItem,
            code: editComputedCode,
            name: editComputedName,
            stage: editStage,
            grade_number: parseInt(editGrade) || 12,
            description: editDesc,
        };

        try {
            let res = await apiClient.academic.updateGrade(editingItem.id, {
                name: editComputedName,
                alias: editComputedCode,
                display_order: 1,
            });
            if (!res.success) {
                res = await apiClient.academic.updateLevel(editingItem.id, {
                    name: editComputedName,
                    code: editComputedCode,
                    display_order: 1,
                });
            }

            if (res.success) {
                setLevels(levels.map((item) => (item.id === editingItem.id ? updated : item)));
                setModalFeedback("Perubahan jenjang berhasil diperbarui di Database!");
                setTimeout(() => {
                    setModalFeedback(null);
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                }, 1000);
            } else {
                setModalFeedback(`Gagal mengedit: ${res.message || res.error || "Tidak sesuai UUID atau ID tidak ditemukan"}`);
            }
        } catch (e: any) {
            setModalFeedback(`Error: ${e?.message || "Gagal memperbarui ke backend"}`);
        }
    };

    // OPEN DELETE MODAL
    const handleOpenDelete = (lvl: LevelItem) => {
        setDeletingItem(lvl);
        setModalFeedback(null);
        setIsDeleteModalOpen(true);
    };

    // CONFIRM DELETE
    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setModalFeedback(null);

        try {
            let res = await apiClient.academic.deleteGrade(deletingItem.id);
            if (!res.success) {
                res = await apiClient.academic.deleteLevel(deletingItem.id);
            }
            if (res.success) {
                setLevels((prev) => prev.filter((item) => item.id !== deletingItem.id));
                setModalFeedback(`Jenjang ${deletingItem.code} berhasil dihapus dari Database!`);
                setTimeout(() => {
                    setModalFeedback(null);
                    setIsDeleteModalOpen(false);
                    setDeletingItem(null);
                }, 800);
            } else {
                setModalFeedback(`Gagal menghapus: ${res.message || res.error || "Terjadi kesalahan server"}`);
            }
        } catch (e: any) {
            setModalFeedback(`Error: ${e?.message || "Gagal menghapus dari backend"}`);
        }
    };

    const filteredLevels = levels.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
        const matchesStage = selectedStage === "ALL" || item.stage === selectedStage;
        return matchesSearch && matchesStage;
    });

    return (
        <div className="space-y-8 p-4 sm:p-6 pb-16 bg-slate-50/50">
            {/* Navigation Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin/master-data">
                            <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Master Data Hub
                            </Button>
                        </Link>
                        <Badge variant="outline" className="text-[10px] font-bold border-slate-200 bg-white">
                            LEVELS TAXONOMY
                        </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
                        Manajemen Jenjang & Tingkat Kelas
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola tingkatan pendidikan siswa (SMA, Class 10-12, Alumni) yang terhubung ke target materi CBT.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={refetch} disabled={levelsLoading} className="text-xs font-semibold bg-white border-slate-200">
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${levelsLoading ? "animate-spin text-blue-600" : ""}`} />
                        Sync API
                    </Button>
                    <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="text-xs font-bold shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-1.5 h-4 w-4" /> Tambah Jenjang
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan kode atau nama..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    {["ALL", "SMA", "SMP", "SD", "SMK", "ALUMNI"].map((stg) => (
                        <button
                            key={stg}
                            onClick={() => setSelectedStage(stg)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedStage === stg ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {stg}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Grid Items */}
            {levelsLoading && levels.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
                            <div className="h-5 w-24 rounded-lg bg-slate-200 animate-pulse" />
                            <div className="h-4 w-3/4 rounded-lg bg-slate-200 animate-pulse" />
                            <div className="h-3 w-full rounded-lg bg-slate-100 animate-pulse" />
                            <div className="pt-3 border-t border-slate-100 h-6" />
                        </Card>
                    ))}
                </div>
            ) : filteredLevels.length === 0 ? (
                <Card className="p-10 bg-white border-slate-200 shadow-sm text-center">
                    <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-700">Belum ada jenjang/tingkat</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Klik "Tambah Jenjang" untuk membuat tingkatan pendidikan pertama.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredLevels.map((lvl) => (
                        <Card key={lvl.id} className="p-5 bg-white border-slate-200 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="font-mono text-[10px] border-slate-200 bg-slate-50 text-slate-700">{lvl.code}</Badge>
                                    <Badge className="text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">{lvl.stage}</Badge>
                                </div>
                                <h3 className="font-bold text-base text-slate-900 pt-1">{lvl.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2">{lvl.description}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700 flex items-center gap-1">
                                    <BookOpen className="w-3.5 h-3.5 text-blue-500" /> {lvl.active_students_count} Peserta
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(lvl)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(lvl)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* ADD MODAL */}
            <AdminActionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Tambah Jenjang & Tingkat Kelas Baru"
                description="Pilih Jenjang dan Kelas. Kode unik dan nama tingkatan akan di-generate otomatis."
                onSubmit={handleCreateLevel}
                submitLabel="Simpan Jenjang"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">1. Pilih Jenjang Sekolah</label>
                                <select
                                    value={formStage}
                                    onChange={(e) => handleStageChange(e.target.value as LevelItem["stage"])}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-blue-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="SMA">SMA / MA</option>
                                    <option value="SMP">SMP / MTs</option>
                                    <option value="SD">SD / MI</option>
                                    <option value="SMK">SMK</option>
                                    <option value="ALUMNI">Alumni / Gap Year</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">2. Pilih Kelas / Tingkat</label>
                                <select
                                    value={formGrade}
                                    onChange={(e) => setFormGrade(e.target.value)}
                                    disabled={formStage === "ALUMNI"}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-blue-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {GRADE_OPTIONS_MAP[formStage]?.map((g) => (
                                        <option key={g.value} value={g.value}>{g.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/60 space-y-2">
                            <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                                <Sparkles className="w-3.5 h-3.5" /> Output Tergenerate Otomatis
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <span className="text-[10px] font-semibold text-slate-500 block">Kode Unik (Auto)</span>
                                    <Badge variant="outline" className="font-mono text-xs font-bold border-blue-300 bg-white text-blue-700 mt-0.5 px-2.5 py-1">
                                        {computedCode}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-[10px] font-semibold text-slate-500 block">Nama Tingkatan (Auto)</span>
                                    <span className="text-xs font-bold text-slate-900 block mt-1">{computedName}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Singkat (Opsional)</label>
                            <textarea
                                placeholder="Keterangan peruntukan materi atau target ujian..."
                                value={formDesc}
                                onChange={(e) => setFormDesc(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>
                    </div>
                )}
            </AdminActionModal>

            {/* EDIT MODAL */}
            <AdminActionModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit Jenjang ${editingItem?.code}`}
                description="Perbarui informasi jenjang dan tingkat kelas."
                onSubmit={handleSaveEdit}
                submitLabel="Simpan Perubahan"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">Jenjang Sekolah</label>
                                <select
                                    value={editStage}
                                    onChange={(e) => handleEditStageChange(e.target.value as LevelItem["stage"])}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-blue-200 bg-white font-semibold text-slate-900"
                                >
                                    <option value="SMA">SMA / MA</option>
                                    <option value="SMP">SMP / MTs</option>
                                    <option value="SD">SD / MI</option>
                                    <option value="SMK">SMK</option>
                                    <option value="ALUMNI">Alumni / Gap Year</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">Kelas / Tingkat</label>
                                <select
                                    value={editGrade}
                                    onChange={(e) => setEditGrade(e.target.value)}
                                    disabled={editStage === "ALUMNI"}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-blue-200 bg-white font-semibold text-slate-900 disabled:opacity-50"
                                >
                                    {GRADE_OPTIONS_MAP[editStage]?.map((g) => (
                                        <option key={g.value} value={g.value}>{g.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                            <div className="text-[11px] font-bold text-slate-600">Preview Perubahan:</div>
                            <div className="text-xs text-slate-800 font-medium">
                                Kode: <strong className="text-blue-600">{editComputedCode}</strong> — Nama: <strong>{editComputedName}</strong>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Singkat</label>
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>
                    </div>
                )}
            </AdminActionModal>

            {/* DELETE CONFIRMATION MODAL */}
            <AdminActionModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Hapus Jenjang Akademik"
                description="Apakah Anda yakin ingin menghapus data jenjang ini?"
                onSubmit={handleConfirmDelete}
                submitLabel="Hapus Permanen"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-600" /> Konfirmasi Penghapusan
                        </div>
                        <p className="text-xs text-rose-700">
                            Anda akan menghapus jenjang <strong>{deletingItem?.code} - {deletingItem?.name}</strong>. Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                )}
            </AdminActionModal>
        </div>
    );
}
