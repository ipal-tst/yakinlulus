"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { apiClient } from "@/lib/api-client";
import {
    Calendar,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    Users,
    RefreshCw,
    AlertTriangle,
} from "lucide-react";

interface ProgramItem {
    id: string;
    code: string;
    name: string;
    academic_year: string;
    target_type: "SNBT_UTBK" | "MANDIRI_PTN" | "KEDINASAN" | "SIMAK_UI";
    status: "ACTIVE" | "ARCHIVED" | "UPCOMING";
    description: string;
    enrolled_students: number;
}

const INITIAL_PROGRAMS: ProgramItem[] = [
    { id: "prg-1", code: "TA-2026-SNBT", name: "Super Intensive SNBT 2026", academic_year: "2025/2026", target_type: "SNBT_UTBK", status: "ACTIVE", description: "Bimbingan & Tryout CBT persiapan seleksi nasional berbasis tes 2026", enrolled_students: 1250 },
    { id: "prg-2", code: "TA-2026-KED", name: "Program Kedinasan & STAN 2026", academic_year: "2025/2026", target_type: "KEDINASAN", status: "ACTIVE", description: "Persiapan Tes SKD TWK, TIU, TKP, dan Psikotes Sekolah Kedinasan", enrolled_students: 480 },
    { id: "prg-3", code: "TA-2026-SUI", name: "Simulasi SIMAK UI & UTUL UGM", academic_year: "2025/2026", target_type: "SIMAK_UI", status: "UPCOMING", description: "Ujian mandiri PTN klaster papan atas dengan tingkat kesulitan tinggi", enrolled_students: 310 },
    { id: "prg-4", code: "TA-2025-ARCH", name: "Tahun Ajaran 2024/2025 (Arsip)", academic_year: "2024/2025", target_type: "SNBT_UTBK", status: "ARCHIVED", description: "Arsip histori hasil ujian & bank soal angkatan 2025", enrolled_students: 2100 },
];

export default function MasterDataProgramsPage() {
    const [programs, setPrograms] = React.useState<ProgramItem[]>(INITIAL_PROGRAMS);
    const [search, setSearch] = React.useState("");
    const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<string>("ALL");
    const [loading, setLoading] = React.useState(false);
    const [modalFeedback, setModalFeedback] = React.useState<string | null>(null);

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [formCode, setFormCode] = React.useState("");
    const [formName, setFormName] = React.useState("");
    const [formYear, setFormYear] = React.useState("2025/2026");
    const [formTarget, setFormTarget] = React.useState<ProgramItem["target_type"]>("SNBT_UTBK");
    const [formDesc, setFormDesc] = React.useState("");

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<ProgramItem | null>(null);
    const [editCode, setEditCode] = React.useState("");
    const [editName, setEditName] = React.useState("");
    const [editYear, setEditYear] = React.useState("");
    const [editTarget, setEditTarget] = React.useState<ProgramItem["target_type"]>("SNBT_UTBK");
    const [editStatus, setEditStatus] = React.useState<ProgramItem["status"]>("ACTIVE");
    const [editDesc, setEditDesc] = React.useState("");

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [deletingItem, setDeletingItem] = React.useState<ProgramItem | null>(null);

    const fetchPrograms = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.academic.getPrograms();
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                setPrograms(res.data);
            }
        } catch (err) {
            console.warn("Using fallback initial programs data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);

    // CREATE
    const handleCreateProgram = async () => {
        if (!formCode || !formName) return;

        const newProgram: ProgramItem = {
            id: `prg-${Date.now().toString().slice(-4)}`,
            code: formCode,
            name: formName,
            academic_year: formYear,
            target_type: formTarget,
            status: "ACTIVE",
            description: formDesc || "Program akademik baru",
            enrolled_students: 0,
        };

        try {
            await apiClient.academic.createProgram(newProgram);
        } catch (e) { }

        setPrograms([newProgram, ...programs]);
        setModalFeedback("Program Akademik berhasil ditambahkan!");
        setTimeout(() => {
            setModalFeedback(null);
            setIsAddModalOpen(false);
            setFormCode("");
            setFormName("");
            setFormDesc("");
        }, 1000);
    };

    // OPEN EDIT MODAL
    const handleOpenEdit = (prg: ProgramItem) => {
        setEditingItem(prg);
        setEditCode(prg.code);
        setEditName(prg.name);
        setEditYear(prg.academic_year);
        setEditTarget(prg.target_type);
        setEditStatus(prg.status);
        setEditDesc(prg.description);
        setIsEditModalOpen(true);
    };

    // SAVE EDIT
    const handleSaveEdit = async () => {
        if (!editingItem) return;
        const updated: ProgramItem = {
            ...editingItem,
            code: editCode,
            name: editName,
            academic_year: editYear,
            target_type: editTarget,
            status: editStatus,
            description: editDesc,
        };

        try {
            await apiClient.academic.updateProgram(editingItem.id, updated);
        } catch (e) { }

        setPrograms(programs.map((item) => (item.id === editingItem.id ? updated : item)));
        setModalFeedback("Perubahan program berhasil disimpan!");
        setTimeout(() => {
            setModalFeedback(null);
            setIsEditModalOpen(false);
            setEditingItem(null);
        }, 1000);
    };

    // OPEN DELETE MODAL
    const handleOpenDelete = (prg: ProgramItem) => {
        setDeletingItem(prg);
        setIsDeleteModalOpen(true);
    };

    // CONFIRM DELETE
    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        try {
            await apiClient.academic.deleteProgram(deletingItem.id);
        } catch (e) { }

        setPrograms(programs.filter((item) => item.id !== deletingItem.id));
        setModalFeedback(`Program ${deletingItem.name} berhasil dihapus!`);
        setTimeout(() => {
            setModalFeedback(null);
            setIsDeleteModalOpen(false);
            setDeletingItem(null);
        }, 800);
    };

    const filteredPrograms = programs.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = selectedStatusFilter === "ALL" || item.status === selectedStatusFilter;
        return matchesSearch && matchesStatus;
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
                            PROGRAMS TAXONOMY
                        </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
                        Manajemen Tahun Ajaran & Program PTN
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola periode siklus ujian, program persiapan SNBT, Kedinasan, & Ujian Mandiri PTN.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchPrograms} disabled={loading} className="text-xs font-semibold bg-white border-slate-200">
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                        Sync API
                    </Button>
                    <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="text-xs font-bold shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-1.5 h-4 w-4" /> Tambah Program
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari program atau kode..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    {["ALL", "ACTIVE", "UPCOMING", "ARCHIVED"].map((st) => (
                        <button
                            key={st}
                            onClick={() => setSelectedStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedStatusFilter === st ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Grid Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredPrograms.map((prg) => (
                    <Card key={prg.id} className="p-5 bg-white border-slate-200 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="font-mono text-[10px] border-slate-200 bg-slate-50 text-slate-700">{prg.code}</Badge>
                                <Badge
                                    className={`text-[10px] font-bold ${prg.status === "ACTIVE"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : prg.status === "UPCOMING"
                                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                        }`}
                                >
                                    {prg.status}
                                </Badge>
                            </div>
                            <h3 className="font-bold text-base text-slate-900 pt-1">{prg.name}</h3>
                            <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> TA {prg.academic_year} • {prg.target_type}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{prg.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-blue-500" /> {prg.enrolled_students} Siswa Terdaftar
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(prg)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(prg)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600">
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
                title="Tambah Program / Tahun Ajaran Baru"
                description="Daftarkan skema program persiapan PTN baru."
                onSubmit={handleCreateProgram}
                submitLabel="Simpan Program"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kode Program</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: TA-2026-SNBT"
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tahun Akademik</label>
                                <input
                                    type="text"
                                    placeholder="2025/2026"
                                    value={formYear}
                                    onChange={(e) => setFormYear(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Program Target</label>
                            <input
                                type="text"
                                placeholder="Contoh: Super Intensive SNBT 2026"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kategori Target Ujian</label>
                            <select
                                value={formTarget}
                                onChange={(e) => setFormTarget(e.target.value as ProgramItem["target_type"])}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            >
                                <option value="SNBT_UTBK">SNBT UTBK (Seleksi Nasional)</option>
                                <option value="KEDINASAN">Sekolah Kedinasan & STAN</option>
                                <option value="SIMAK_UI">SIMAK UI & Ujian Mandiri PTN</option>
                                <option value="MANDIRI_PTN">Ujian Mandiri Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Program</label>
                            <textarea
                                placeholder="Keterangan target & fasilitas program..."
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
                title={`Edit Program ${editingItem?.code}`}
                description="Perbarui rincian, status, dan target ujian program."
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
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kode Program</label>
                                <input
                                    type="text"
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Status Aktivasi</label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as ProgramItem["status"])}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-emerald-700"
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="UPCOMING">UPCOMING</option>
                                    <option value="ARCHIVED">ARCHIVED</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Program</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tahun Akademik</label>
                                <input
                                    type="text"
                                    value={editYear}
                                    onChange={(e) => setEditYear(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kategori Target Ujian</label>
                            <select
                                value={editTarget}
                                onChange={(e) => setEditTarget(e.target.value as ProgramItem["target_type"])}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            >
                                <option value="SNBT_UTBK">SNBT UTBK (Seleksi Nasional)</option>
                                <option value="KEDINASAN">Sekolah Kedinasan & STAN</option>
                                <option value="SIMAK_UI">SIMAK UI & Ujian Mandiri PTN</option>
                                <option value="MANDIRI_PTN">Ujian Mandiri Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Program</label>
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
                title="Hapus Program Akademik"
                description="Apakah Anda yakin ingin menghapus program akademik ini?"
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
                            Anda akan menghapus program <strong>{deletingItem?.code} - {deletingItem?.name}</strong>. Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                )}
            </AdminActionModal>
        </div>
    );
}
