"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { apiClient } from "@/lib/api-client";
import { useChapters, useSubjects, useDeleteChapter } from "@/lib/api";
import {
    Layers,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    BookOpen,
    BrainCircuit,
    RefreshCw,
    AlertTriangle,
} from "lucide-react";

interface ChapterItem {
    id: string;
    subject_id: string;
    subject_name: string;
    name: string;
    description: string;
    display_order: number;
    is_active: boolean;
}

export default function MasterDataChaptersPage() {
    const { data: chaptersList = [], isLoading: loading, refetch } = useChapters() as any;
    const { data: subjectsList = [] } = useSubjects() as any;
    const subjects: any[] = Array.isArray(subjectsList) ? subjectsList : subjectsList?.data || [];
    const chapters: ChapterItem[] = Array.isArray(chaptersList) ? chaptersList : chaptersList?.data || [];
    
    const [search, setSearch] = React.useState("");
    const [modalFeedback, setModalFeedback] = React.useState<string | null>(null);

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [formSubjectId, setFormSubjectId] = React.useState("");
    const [formTitle, setFormTitle] = React.useState("");
    const [formDesc, setFormDesc] = React.useState("");

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<ChapterItem | null>(null);
    const [editSubjectId, setEditSubjectId] = React.useState("");
    const [editTitle, setEditTitle] = React.useState("");
    const [editDesc, setEditDesc] = React.useState("");

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [deletingItem, setDeletingItem] = React.useState<ChapterItem | null>(null);

    

    // CREATE
    const handleCreateChapter = async () => {
        if (!formTitle || !formSubjectId) return;

        try {
            await apiClient.academic.createChapter({
                subject_id: formSubjectId,
                name: formTitle,
                description: formDesc || "",
                display_order: chapters.length + 1,
            });
        } catch (e) { }

        refetch();
        setModalFeedback("Bab berhasil ditambahkan ke database!");
        setTimeout(() => {
            setModalFeedback(null);
            setIsAddModalOpen(false);
            setFormSubjectId("");
            setFormTitle("");
            setFormDesc("");
        }, 1000);
    };

    // OPEN EDIT MODAL
    const handleOpenEdit = (ch: ChapterItem) => {
        setEditingItem(ch);
        setEditSubjectId(ch.subject_id);
        setEditTitle(ch.name);
        setEditDesc(ch.description || "");
        setIsEditModalOpen(true);
    };

    // SAVE EDIT
    const handleSaveEdit = async () => {
        if (!editingItem) return;

        try {
            await apiClient.academic.updateChapter(editingItem.id, {
                name: editTitle,
                description: editDesc,
                display_order: editingItem.display_order,
            });
        } catch (e) { }

        refetch();
        setModalFeedback("Perubahan bab berhasil disimpan!");
        setTimeout(() => {
            setModalFeedback(null);
            setIsEditModalOpen(false);
            setEditingItem(null);
        }, 1000);
    };

    // OPEN DELETE MODAL
    const handleOpenDelete = (ch: ChapterItem) => {
        setDeletingItem(ch);
        setIsDeleteModalOpen(true);
    };

    // CONFIRM DELETE
    const deleteChapterMutation = useDeleteChapter();

    const handleConfirmDelete = () => {
        if (!deletingItem) return;
        deleteChapterMutation.mutate(deletingItem.id, {
            onSuccess: () => {
                setModalFeedback(`Bab ${deletingItem.name} berhasil dihapus!`);
                setTimeout(() => {
                    setModalFeedback(null);
                    setIsDeleteModalOpen(false);
                    setDeletingItem(null);
                }, 800);
            },
            onError: (err) => {
                alert("Gagal menghapus: " + err.message);
            }
        });
    };

    const filtered = chapters.filter(
        (ch) => ch.name.toLowerCase().includes(search.toLowerCase()) || ch.subject_name.toLowerCase().includes(search.toLowerCase())
    );

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
                            CHAPTERS TAXONOMY
                        </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
                        Manajemen Bab Materi Soal
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola susunan bab dan urutan kisi-kisi per mata pelajaran.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading} className="text-xs font-semibold bg-white border-slate-200">
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                        Sync API
                    </Button>
                    <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="text-xs font-bold shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-1.5 h-4 w-4" /> Tambah Bab
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan bab atau mapel..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </Card>

            {/* Grid Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((ch) => (
                    <Card key={ch.id} className="p-5 bg-white border-slate-200 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="font-mono text-[10px] border-slate-200 bg-slate-50 text-slate-700">{`CH-${ch.display_order?.toString().padStart(2, "0") || "00"}`}</Badge>
                                <Badge className="text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">{ch.subject_name}</Badge>
                            </div>
                            <h3 className="font-bold text-base text-slate-900 pt-1">{ch.name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{ch.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-blue-600" /> Urutan ke-{ch.display_order}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(ch)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(ch)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600">
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
                title="Tambah Bab Materi Baru"
                description="Masukkan entitas bab baru ke mata pelajaran."
                onSubmit={handleCreateChapter}
                submitLabel="Simpan Bab"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Mata Pelajaran Induk *</label>
                            <select
                                value={formSubjectId}
                                onChange={(e) => setFormSubjectId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            >
                                <option value="">-- Pilih Mata Pelajaran --</option>
                                {subjects.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.level_code || "?"})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Judul Bab</label>
                            <input
                                type="text"
                                placeholder="Contoh: Silogisme & Logika Proposisi"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Singkat</label>
                            <textarea
                                placeholder="Cakupan bab..."
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
                title={`Edit Bab ${editingItem?.name}`}
                description="Perbarui judul dan rincian bab materi."
                onSubmit={handleSaveEdit}
                submitLabel="Simpan Perubahan"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Mata Pelajaran Induk *</label>
                            <select
                                value={editSubjectId}
                                onChange={(e) => setEditSubjectId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            >
                                <option value="">-- Pilih Mata Pelajaran --</option>
                                {subjects.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.level_code || "?"})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Judul Bab</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
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
                title="Hapus Bab Materi"
                description="Apakah Anda yakin ingin menghapus bab materi ini?"
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
                            Anda akan menghapus bab <strong>{deletingItem?.name}</strong>. Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                )}
            </AdminActionModal>
        </div>
    );
}
