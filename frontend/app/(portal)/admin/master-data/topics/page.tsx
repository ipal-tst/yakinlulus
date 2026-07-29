"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { apiClient } from "@/lib/api-client";
import { useTopics, useChapters } from "@/lib/api";
import {
    Target,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    Layers,
    BrainCircuit,
    RefreshCw,
    AlertTriangle,
} from "lucide-react";

interface TopicItem {
    id: string;
    chapter_id: string;
    chapter_name: string;
    subject_name: string;
    title: string;
    sequence: number;
    description: string;
    is_active: boolean;
}

export default function MasterDataTopicsPage() {
    const { data: topicsList = [], isLoading: loading, refetch } = useTopics() as any;
    const { data: chaptersList = [] } = useChapters() as any;
    const topics: TopicItem[] = Array.isArray(topicsList) ? topicsList : topicsList?.data || [];
    const chapters: any[] = Array.isArray(chaptersList) ? chaptersList : chaptersList?.data || [];

    const [search, setSearch] = React.useState("");
    const [modalFeedback, setModalFeedback] = React.useState<string | null>(null);

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [formChapterId, setFormChapterId] = React.useState("");
    const [formTitle, setFormTitle] = React.useState("");
    const [formDesc, setFormDesc] = React.useState("");

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<TopicItem | null>(null);
    const [editChapterId, setEditChapterId] = React.useState("");
    const [editTitle, setEditTitle] = React.useState("");
    const [editDesc, setEditDesc] = React.useState("");

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [deletingItem, setDeletingItem] = React.useState<TopicItem | null>(null);



    // CREATE
    const handleCreateTopic = async () => {
        if (!formTitle || !formChapterId) return;

        try {
            await apiClient.academic.createTopic({
                chapter_id: formChapterId,
                title: formTitle,
                sequence: topics.length + 1,
                description: formDesc || "",
            });
        } catch (e) { }

        refetch();
        setModalFeedback("Topik berhasil ditambahkan!");
        setTimeout(() => {
            setModalFeedback(null);
            setIsAddModalOpen(false);
            setFormChapterId("");
            setFormTitle("");
            setFormDesc("");
        }, 1000);
    };

    // OPEN EDIT MODAL
    const handleOpenEdit = (top: TopicItem) => {
        setEditingItem(top);
        setEditChapterId(top.chapter_id);
        setEditTitle(top.title);
        setEditDesc(top.description || "");
        setIsEditModalOpen(true);
    };

    // SAVE EDIT
    const handleSaveEdit = async () => {
        if (!editingItem) return;

        try {
            await apiClient.academic.updateTopic(editingItem.id, {
                title: editTitle,
                sequence: editingItem.sequence,
                description: editDesc,
            });
        } catch (e) { }

        refetch();
        setModalFeedback("Perubahan topik berhasil disimpan!");
        setTimeout(() => {
            setModalFeedback(null);
            setIsEditModalOpen(false);
            setEditingItem(null);
        }, 1000);
    };

    // OPEN DELETE MODAL
    const handleOpenDelete = (top: TopicItem) => {
        setDeletingItem(top);
        setIsDeleteModalOpen(true);
    };

    // CONFIRM DELETE
    const handleConfirmDelete = async () => {
        if (!deletingItem) return;

        try {
            await apiClient.academic.deleteTopic(deletingItem.id);
        } catch (e) { }

        refetch();
        setModalFeedback(`Topik ${deletingItem.title} berhasil dihapus!`);
        setTimeout(() => {
            setModalFeedback(null);
            setIsDeleteModalOpen(false);
            setDeletingItem(null);
        }, 800);
    };

    const filtered = topics.filter(
        (t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.chapter_name.toLowerCase().includes(search.toLowerCase())
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
                            TOPICS & LEARNING OUTCOMES (CP/TP)
                        </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
                        Manajemen Topik & Sub-Topik (Learning Outcomes)
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola topik spesifik, Capaian Pembelajaran, dan tingkat Taksonomi Bloom (C1 - C6 HOTS).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading} className="text-xs font-semibold bg-white border-slate-200">
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                        Sync API
                    </Button>
                    <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="text-xs font-bold shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-1.5 h-4 w-4" /> Tambah Topik Soal
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari topik atau bab..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </Card>

            {/* Grid Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((top) => (
                    <Card key={top.id} className="p-5 bg-white border-slate-200 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="font-mono text-[10px] border-slate-200 bg-slate-50 text-slate-700">{top.chapter_name}</Badge>
                                {top.subject_name && (
                                    <Badge className="text-[10px] font-bold bg-purple-50 text-purple-700 border-purple-200">{top.subject_name}</Badge>
                                )}
                            </div>
                            <h3 className="font-bold text-base text-slate-900 pt-1">{top.title}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{top.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-blue-600" /> Urutan ke-{top.sequence}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(top)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(top)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600">
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
                title="Tambah Topik & Learning Outcome Baru"
                description="Masukkan entitas topik pembelajaran dan tingkat taksonomi Bloom."
                onSubmit={handleCreateTopic}
                submitLabel="Simpan Topik"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Bab Induk *</label>
                            <select
                                value={formChapterId}
                                onChange={(e) => setFormChapterId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            >
                                <option value="">-- Pilih Bab --</option>
                                {chapters.map((ch: any) => (
                                    <option key={ch.id} value={ch.id}>
                                        {ch.subject_name} - {ch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Judul Topik *</label>
                            <input
                                type="text"
                                placeholder="Contoh: Hukum Newton 1"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi</label>
                            <textarea
                                placeholder="Keterangan topik..."
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
                title={`Edit Topik ${editingItem?.title}`}
                description="Perbarui bab induk, judul, dan tingkat Taksonomi Bloom."
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
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Bab Induk *</label>
                            <select
                                value={editChapterId}
                                onChange={(e) => setEditChapterId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            >
                                <option value="">-- Pilih Bab --</option>
                                {chapters.map((ch: any) => (
                                    <option key={ch.id} value={ch.id}>
                                        {ch.subject_name} - {ch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Judul Topik *</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi</label>
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
                title="Hapus Topik Soal"
                description="Apakah Anda yakin ingin menghapus topik ini?"
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
                            Anda akan menghapus topik <strong>{deletingItem?.title}</strong>. Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                )}
            </AdminActionModal>
        </div>
    );
}
