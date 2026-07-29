"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { apiClient } from "@/lib/api-client";
import { useCurriculums } from "@/lib/api";
import {
    BookmarkCheck,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    Layers,
    BookOpen,
    RefreshCw,
    AlertTriangle,
} from "lucide-react";

interface CurriculumItem {
    id: string;
    code: string;
    name: string;
    description: string;
    is_active: boolean;
    subjects_count: number;
}

export default function MasterDataCurriculumsPage() {
    const { data: curriculumList = [], isLoading: loading, refetch } = useCurriculums() as any;
    const curriculums: CurriculumItem[] = curriculumList ?? [];

    const [search, setSearch] = React.useState("");
    const [modalFeedback, setModalFeedback] = React.useState<string | null>(null);

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [formCode, setFormCode] = React.useState("");
    const [formName, setFormName] = React.useState("");
    const [formDesc, setFormDesc] = React.useState("");

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<CurriculumItem | null>(null);
    const [editCode, setEditCode] = React.useState("");
    const [editName, setEditName] = React.useState("");
    const [editDesc, setEditDesc] = React.useState("");

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [deletingItem, setDeletingItem] = React.useState<CurriculumItem | null>(null);



    // CREATE
    const handleCreateCurriculum = async () => {
        if (!formCode || !formName) return;

        try {
            const res = await apiClient.academic.createCurriculum({
                code: formCode,
                name: formName,
                description: formDesc || "Kurikulum acuan pembelajaran baru",
            });
            if (res && res.success) {
                setModalFeedback("Kurikulum berhasil ditambahkan ke Database!");
            } else {
                setModalFeedback(res?.message || "Gagal menambahkan kurikulum.");
            }
        } catch (e: any) {
            console.error("Failed to create curriculum:", e);
            setModalFeedback("Gagal terhubung ke API backend.");
        }

        refetch();
        setTimeout(() => {
            setModalFeedback(null);
            setIsAddModalOpen(false);
            setFormCode("");
            setFormName("");
            setFormDesc("");
        }, 1000);
    };

    // OPEN EDIT MODAL
    const handleOpenEdit = (curr: CurriculumItem) => {
        setEditingItem(curr);
        setEditCode(curr.code);
        setEditName(curr.name);
        setEditDesc(curr.description || "");
        setIsEditModalOpen(true);
    };

    // SAVE EDIT
    const handleSaveEdit = async () => {
        if (!editingItem) return;

        try {
            const res = await apiClient.academic.updateCurriculum(editingItem.id, {
                code: editCode,
                name: editName,
                description: editDesc,
            });
            if (res && res.success) {
                setModalFeedback("Perubahan kurikulum berhasil disimpan!");
            } else {
                setModalFeedback(res?.message || "Gagal menyimpan perubahan.");
            }
        } catch (e: any) {
            console.error("Failed to update curriculum:", e);
            setModalFeedback("Gagal memperbarui kurikulum.");
        }

        refetch();
        setTimeout(() => {
            setModalFeedback(null);
            setIsEditModalOpen(false);
            setEditingItem(null);
        }, 1000);
    };

    // OPEN DELETE MODAL
    const handleOpenDelete = (curr: CurriculumItem) => {
        setDeletingItem(curr);
        setIsDeleteModalOpen(true);
    };

    // CONFIRM DELETE
    const handleConfirmDelete = async () => {
        if (!deletingItem) return;

        try {
            const res = await apiClient.academic.deleteCurriculum(deletingItem.id);
            if (res && res.success) {
                setModalFeedback(`Kurikulum ${deletingItem.name} berhasil dihapus dari Database!`);
            } else {
                setModalFeedback(res?.message || "Gagal menghapus kurikulum.");
            }
        } catch (e: any) {
            console.error("Failed to delete curriculum:", e);
            setModalFeedback("Gagal menghapus kurikulum.");
        }

        refetch();
        setTimeout(() => {
            setModalFeedback(null);
            setIsDeleteModalOpen(false);
            setDeletingItem(null);
        }, 800);
    };

    const filtered = curriculums.filter(
        (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
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
                            CURRICULUMS TAXONOMY
                        </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
                        Manajemen Kurikulum Akademik
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola kerangka kurikulum (UTBK SNBT, Kurikulum Merdeka, K13, dan Kurikulum Akselerasi Internal).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading} className="text-xs font-semibold bg-white border-slate-200">
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                        Sync API
                    </Button>
                    <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="text-xs font-bold shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-1.5 h-4 w-4" /> Tambah Kurikulum
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari kurikulum..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </Card>

            {/* Grid Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filtered.map((curr) => (
                    <Card key={curr.id} className="p-5 bg-white border-slate-200 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="font-mono text-[10px] border-slate-200 bg-slate-50 text-slate-700">{curr.code}</Badge>
                                <Badge className="text-[10px] font-bold bg-teal-50 text-teal-700 border-teal-200">ACTIVE</Badge>
                            </div>
                            <h3 className="font-bold text-base text-slate-900 pt-1">{curr.name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{curr.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 flex items-center gap-1">
                                <BookmarkCheck className="w-3.5 h-3.5 text-teal-600" /> {curr.subjects_count} Mapel Terkait
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(curr)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(curr)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600">
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
                title="Tambah Kurikulum Baru"
                description="Masukkan entitas kerangka kurikulum ke database."
                onSubmit={handleCreateCurriculum}
                submitLabel="Simpan Kurikulum"
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kode Kurikulum</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Merdeka"
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Kurikulum</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Kurikulum Merdeka"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Kerangka</label>
                            <textarea
                                placeholder="Keterangan acuan kurikulum..."
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
                title={`Edit Kurikulum ${editingItem?.code}`}
                description="Perbarui nama dan rincian acuan kurikulum."
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
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kode Kurikulum</label>
                                <input
                                    type="text"
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Kurikulum</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Kerangka</label>
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
                title="Hapus Kurikulum"
                description="Apakah Anda yakin ingin menghapus kurikulum ini?"
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
                            Anda akan menghapus kurikulum <strong>{deletingItem?.code} - {deletingItem?.name}</strong>. Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                )}
            </AdminActionModal>
        </div>
    );
}
