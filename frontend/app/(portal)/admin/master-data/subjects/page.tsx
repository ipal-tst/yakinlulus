"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { apiClient } from "@/lib/api-client";
import { useSubjects, useLevels, useGrades } from "@/lib/api";
import {
    BookOpen,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    Layers,
    RefreshCw,
    AlertTriangle,
    BookmarkCheck,
} from "lucide-react";

interface SubjectItem {
    id: string;
    code: string;
    name: string;
    level: string;
    education_level_id?: string | undefined;
    description: string;
    chapters_count: number;
}

const INITIAL_SUBJECTS: SubjectItem[] = [
    { id: "sbj-1", code: "PU", name: "Penalaran Umum", level: "SMA / UTBK", description: "Logika deduktif, induktif, kuantitatif, & penalaran teks", chapters_count: 14 },
    { id: "sbj-2", code: "PBM", name: "Pemahaman Bacaan & Menulis", level: "SMA / UTBK", description: "Kaidah ejaan, tata bahasa, wacana, & penyuntingan teks", chapters_count: 10 },
    { id: "sbj-3", code: "PPU", name: "Pengetahuan & Pemahaman Umum", level: "SMA / UTBK", description: "Kosakata, sinonim/antonim, bahasa Indonesia & Inggris", chapters_count: 12 },
    { id: "sbj-4", code: "PK", name: "Pengetahuan Kuantitatif", level: "SMA / UTBK", description: "Aritmetika, aljabar, geometri, & statistik dasar", chapters_count: 16 },
    { id: "sbj-5", code: "LB-IND", name: "Literasi Bahasa Indonesia", level: "SMA / UTBK", description: "Analisis teks sastra, populer, & karya ilmiah", chapters_count: 8 },
    { id: "sbj-6", code: "LB-ENG", name: "Literasi Bahasa Inggris", level: "SMA / UTBK", description: "Reading comprehension, main idea, & inference", chapters_count: 8 },
    { id: "sbj-7", code: "PM", name: "Penalaran Matematika", level: "SMA / UTBK", description: "Penerapan konsep matematika dalam konteks kehidupan nyata", chapters_count: 12 },
];

export default function MasterDataSubjectsPage() {
    const { data: apiSubjects = [], isLoading: loadingSubjects, refetch: refetchSubjects } = useSubjects() as any;
    const { data: apiLevels = [] } = useLevels() as any;
    const { data: apiGrades = [] } = useGrades() as any;

    const [subjects, setSubjects] = React.useState<SubjectItem[]>(INITIAL_SUBJECTS);
    const [search, setSearch] = React.useState("");
    const [selectedLevelFilter, setSelectedLevelFilter] = React.useState<string>("ALL");
    const [modalFeedback, setModalFeedback] = React.useState<string | null>(null);

    // Sync API data if available - use useEffect for proper lifecycle
    const [synced, setSynced] = React.useState(false);
    React.useEffect(() => {
        if (!synced && Array.isArray(apiSubjects) && apiSubjects.length > 0) {
            // Create level lookup map - map by ID to code (SD, SMP, SMA, UTBK_GAPYEAR)
            const levelMap = new Map();
            if (Array.isArray(apiLevels)) {
                apiLevels.forEach((l: any) => levelMap.set(l.id, l.code));
            }
            const mapped: SubjectItem[] = apiSubjects.map((s: any) => ({
                id: s.id,
                code: s.code || `SBJ-${s.name.slice(0, 3).toUpperCase()}`,
                name: s.name,
                level: levelMap.get(s.level_id) || levelMap.get(s.education_level_id) || s.level_name || s.education_level?.name || "SMA / UTBK",
                education_level_id: s.education_level_id || s.level_id,
                description: s.description || "Mata pelajaran kurikulum persiapan seleksi PTN",
                chapters_count: s.chapters_count || s.chapters?.length || 0,
            }));
            setSubjects(mapped);
            setSynced(true);
        }
    }, [apiSubjects, apiLevels, synced]);

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [formCode, setFormCode] = React.useState("");
    const [formName, setFormName] = React.useState("");
    const [formLevelId, setFormLevelId] = React.useState("");
    const [formGradeId, setFormGradeId] = React.useState("");
    const [formDesc, setFormDesc] = React.useState("");

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<SubjectItem | null>(null);
    const [editCode, setEditCode] = React.useState("");
    const [editName, setEditName] = React.useState("");
    const [editLevelId, setEditLevelId] = React.useState("");
    const [editGradeId, setEditGradeId] = React.useState("");
    const [editDesc, setEditDesc] = React.useState("");

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [deletingItem, setDeletingItem] = React.useState<SubjectItem | null>(null);

    // Auto-generate subject code: abbreviation-grade
    const generateSubjectCode = (name: string, gradeId: string) => {
        if (!name || !gradeId) return "";
        const grade = apiGrades.find((g: any) => g.id === gradeId);
        if (!grade) return "";

        // Create abbreviation from subject name (first letters of each word, uppercase)
        const words = name.trim().split(/\s+/);
        const abbreviation = words.map(w => w.charAt(0).toUpperCase()).join('');

        // Get grade name/alias (e.g., "10", "11", "12", "7", "8", "9", "1", "2", etc.)
        const gradeName = grade.alias || grade.name;

        return `${abbreviation}-${gradeName}`;
    };

    // Auto-update formCode when formName or formGradeId changes
    React.useEffect(() => {
        if (isAddModalOpen && formName && formGradeId) {
            const generatedCode = generateSubjectCode(formName, formGradeId);
            if (generatedCode) {
                setFormCode(generatedCode);
            }
        }
    }, [formName, formGradeId, isAddModalOpen]);

    const handleSync = async () => {
        await refetchSubjects();
        setSynced(false);
    };

    // CREATE
    const handleCreateSubject = async () => {
        if (!formCode || !formName || !formLevelId) return;

        try {
            const res = await apiClient.academic.createSubject({
                code: formCode,
                name: formName,
                level_id: formLevelId,
                grade_id: formGradeId || undefined,
                description: formDesc || "Mata pelajaran kurikulum akademik",
            });
            if (res && res.success) {
                setModalFeedback("Mata Pelajaran berhasil ditambahkan ke Database!");
            } else {
                setModalFeedback(res?.message || "Gagal menambahkan mata pelajaran.");
            }
        } catch (e: any) {
            console.error("Failed to create subject:", e);
            setModalFeedback("Gagal terhubung ke API backend.");
        }

        await refetchSubjects();
        setSynced(false);
        setTimeout(() => {
            setModalFeedback(null);
            setIsAddModalOpen(false);
            setFormCode("");
            setFormName("");
            setFormLevelId("");
            setFormGradeId("");
            setFormDesc("");
        }, 1000);
    };

    // OPEN EDIT MODAL
    const handleOpenEdit = (sbj: SubjectItem) => {
        setEditingItem(sbj);
        setEditCode(sbj.code);
        setEditName(sbj.name);
        setEditLevelId(sbj.education_level_id || "");
        setEditDesc(sbj.description || "");
        setIsEditModalOpen(true);
    };

    // SAVE EDIT
    const handleSaveEdit = async () => {
        if (!editingItem) return;

        try {
            const res = await apiClient.academic.updateSubject(editingItem.id, {
                code: editCode,
                name: editName,
                level_id: editLevelId || undefined,
                grade_id: editGradeId || undefined,
                description: editDesc,
            });
            if (res && res.success) {
                setModalFeedback("Perubahan mata pelajaran berhasil disimpan!");
            } else {
                setModalFeedback(res?.message || "Gagal menyimpan perubahan.");
            }
        } catch (e: any) {
            console.error("Failed to update subject:", e);
            setModalFeedback("Gagal memperbarui mata pelajaran.");
        }

        await refetchSubjects();
        setSynced(false);
        setTimeout(() => {
            setModalFeedback(null);
            setIsEditModalOpen(false);
            setEditingItem(null);
        }, 1000);
    };

    // OPEN DELETE MODAL
    const handleOpenDelete = (sbj: SubjectItem) => {
        setDeletingItem(sbj);
        setIsDeleteModalOpen(true);
    };

    // CONFIRM DELETE
    const handleConfirmDelete = async () => {
        if (!deletingItem) return;

        try {
            const res = await apiClient.academic.deleteSubject(deletingItem.id);
            if (res && res.success) {
                setModalFeedback(`Mata Pelajaran ${deletingItem.name} berhasil dihapus dari Database!`);
            } else {
                setModalFeedback(res?.message || "Gagal menghapus mata pelajaran.");
            }
        } catch (e: any) {
            console.error("Failed to delete subject:", e);
            setModalFeedback("Gagal menghapus mata pelajaran.");
        }

        await refetchSubjects();
        setSynced(false);
        setTimeout(() => {
            setModalFeedback(null);
            setIsDeleteModalOpen(false);
            setDeletingItem(null);
        }, 800);
    };

    const filteredSubjects = subjects.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
        const matchesLevel = selectedLevelFilter === "ALL" || item.level.toLowerCase().includes(selectedLevelFilter.toLowerCase());
        return matchesSearch && matchesLevel;
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
                            SUBJECTS TAXONOMY
                        </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
                        Manajemen Mata Pelajaran
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola bidang studi akademik (TPS UTBK, Literasi, Penalaran Matematika, & Mapel Sains/Soshum).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSync} disabled={loadingSubjects} className="text-xs font-semibold bg-white border-slate-200">
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingSubjects ? "animate-spin text-blue-600" : ""}`} />
                        Sync API
                    </Button>
                    <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="text-xs font-bold shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-1.5 h-4 w-4" /> Tambah Mata Pelajaran
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama atau kode mapel..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    {["ALL", "SMA", "UTBK", "SMP", "SD"].map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => setSelectedLevelFilter(lvl)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedLevelFilter === lvl ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Grid Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSubjects.map((sbj) => (
                    <Card key={sbj.id} className="p-5 bg-white border-slate-200 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="font-mono text-[10px] border-slate-200 bg-slate-50 text-slate-700 font-bold">{sbj.code}</Badge>
                                <Badge className="text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200">
                                    {sbj.level}
                                </Badge>
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-slate-900">{sbj.name}</h3>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sbj.description}</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <BookmarkCheck className="w-3.5 h-3.5 text-teal-600" /> {sbj.chapters_count} Bab Materi
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(sbj)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(sbj)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* ADD MODAL */}
            <AdminActionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Tambah Mata Pelajaran Baru"
                description="Daftarkan entitas mata pelajaran ke taksonomi akademik."
                onSubmit={handleCreateSubject}
                submitLabel="Simpan Mata Pelajaran"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kode Mapel</label>
                                <input
                                    type="text"
                                    placeholder="Otomatis: Singkatan-Kelas"
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Jenjang Pendidikan</label>
                                <select
                                    value={formLevelId}
                                    onChange={(e) => {
                                        setFormLevelId(e.target.value);
                                        setFormGradeId(""); // Reset grade when level changes
                                    }}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                >
                                    <option value="">Pilih Jenjang...</option>
                                    {Array.isArray(apiLevels) && apiLevels.map((lvl: any) => (
                                        <option key={lvl.id} value={lvl.id}>{lvl.name} ({lvl.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kelas</label>
                            <select
                                value={formGradeId}
                                onChange={(e) => setFormGradeId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                disabled={!formLevelId}
                            >
                                <option value="">Pilih Kelas...</option>
                                {Array.isArray(apiGrades) && apiGrades
                                    .filter((g: any) => !formLevelId || g.education_level_id === formLevelId)
                                    .map((grd: any) => (
                                        <option key={grd.id} value={grd.id}>{grd.alias || grd.name}</option>
                                    ))}
                            </select>
                            {!formLevelId && <p className="text-[10px] text-slate-400 mt-1">Pilih jenjang dulu</p>}
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Mata Pelajaran</label>
                            <input
                                type="text"
                                placeholder="Contoh: Penalaran Kuantitatif"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Ruang Lingkup</label>
                            <textarea
                                placeholder="Keterangan materi & silabus mata pelajaran..."
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
                title={`Edit Mata Pelajaran ${editingItem?.code}`}
                description="Perbarui nama, kode, dan rincian mata pelajaran."
                onSubmit={handleSaveEdit}
                submitLabel="Simpan Perubahan"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kode Mapel</label>
                                <input
                                    type="text"
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Jenjang Pendidikan</label>
                                <select
                                    value={editLevelId}
                                    onChange={(e) => setEditLevelId(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                >
                                    <option value="">Default ({editingItem?.level})</option>
                                    {Array.isArray(apiLevels) && apiLevels.map((lvl: any) => (
                                        <option key={lvl.id} value={lvl.id}>{lvl.name} ({lvl.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Mata Pelajaran</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Ruang Lingkup</label>
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
                title="Hapus Mata Pelajaran"
                description="Apakah Anda yakin ingin menghapus mata pelajaran ini?"
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
                            Anda akan menghapus mata pelajaran <strong>{deletingItem?.code} - {deletingItem?.name}</strong>. Semua bab dan topik terkait akan terpengaruh.
                        </p>
                    </div>
                )}
            </AdminActionModal>
        </div>
    );
}
