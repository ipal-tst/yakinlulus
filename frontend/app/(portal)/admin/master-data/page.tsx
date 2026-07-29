"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { apiClient } from "@/lib/api-client";
import { useLevels, useSubjects } from "@/lib/api";
import {
    Database,
    Plus,
    Search,
    BookOpen,
    Layers,
    Tag,
    Calendar,
    Edit2,
    Trash2,
    CheckCircle2,
    ArrowRight,
    School,
    HelpCircle,
    ExternalLink,
    RefreshCw,
    BookmarkCheck,
    BrainCircuit,
    AlertCircle,
} from "lucide-react";

interface MasterDataItem {
    id: string;
    code: string;
    category: "JENJANG" | "KURIKULUM" | "MAPEL" | "BAB" | "TOPIK" | "PROGRAM";
    name: string;
    description: string;
    itemsCount: number;
    updatedAt: string;
    targetRoute: string;
}

export default function MasterDataAdminPage() {
    const [search, setSearch] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [modalFeedback, setModalFeedback] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    // Form states
    const [newCode, setNewCode] = React.useState("");
    const [newName, setNewName] = React.useState("");
    const [newCategory, setNewCategory] = React.useState<MasterDataItem["category"]>("MAPEL");
    const [newDesc, setNewDesc] = React.useState("");

    const { data: levels = [], isLoading: levelsLoading } = useLevels() as any;
    const { data: subjects = [], isLoading: subjectsLoading } = useSubjects() as any;

    const dataList = React.useMemo(() => {
        const items: MasterDataItem[] = [];
        if (Array.isArray(levels)) {
            levels.forEach((l: any) => items.push({
                id: l.id, code: l.code || `LVL-${l.id}`, category: "JENJANG",
                name: l.name, description: l.description || "",
                itemsCount: l.active_students_count || 0, updatedAt: l.updated_at || "",
                targetRoute: "/admin/master-data/levels",
            }));
        }
        if (Array.isArray(subjects)) {
            subjects.forEach((s: any) => items.push({
                id: s.id, code: s.code || `SUBJ-${s.id}`, category: "MAPEL",
                name: s.name, description: s.description || "",
                itemsCount: s.total_questions || 0, updatedAt: s.updated_at || "",
                targetRoute: "/admin/master-data/subjects",
            }));
        }
        return items;
    }, [levels, subjects]);

    const handleCreateItem = async () => {
        if (!newCode || !newName) return;

        setLoading(true);
        try {
            if (newCategory === "JENJANG") {
                await apiClient.academic.createLevel({ name: newName, code: newCode, display_order: 1 });
            } else if (newCategory === "MAPEL") {
                await apiClient.academic.createSubject({ code: newCode, name: newName, description: newDesc });
            } else if (newCategory === "KURIKULUM") {
                await apiClient.academic.createCurriculum({ name: newName, code: newCode, description: newDesc });
            } else if (newCategory === "BAB") {
                // Chapters require subject_id - skip for now
            } else if (newCategory === "TOPIK") {
                // No API for topics yet
            } else if (newCategory === "PROGRAM") {
                await apiClient.academic.createProgram({ name: newName, code: newCode, description: newDesc });
            }
            setModalFeedback("Item Master Data berhasil ditambahkan!");
        } catch (e: any) {
            setModalFeedback(`Gagal menambahkan: ${e?.message || "Terjadi kesalahan server"}`);
        } finally {
            setLoading(false);
        }
        setTimeout(() => {
            setModalFeedback(null);
            setIsAddModalOpen(false);
            setNewCode("");
            setNewName("");
            setNewDesc("");
        }, 1000);
    };

    const handleDelete = async (id: string, category?: MasterDataItem["category"]) => {
        setLoading(true);
        try {
            if (category === "JENJANG") {
                await apiClient.academic.deleteLevel(id);
            } else if (category === "MAPEL") {
                await apiClient.academic.deleteSubject(id);
            } else if (category === "PROGRAM") {
                await apiClient.academic.deleteProgram(id);
            } else if (category === "BAB") {
                await apiClient.academic.deleteChapter(id);
            } else if (category === "KURIKULUM") {
                // No deleteCurriculum in apiClient yet
            } else if (category === "TOPIK") {
                // No deleteTopic in apiClient yet
            }
            setModalFeedback(`Item berhasil dihapus!`);
        } catch (e: any) {
            setModalFeedback(`Gagal menghapus: ${e?.message || "Terjadi kesalahan server"}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = dataList.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 p-4 sm:p-6 pb-16 bg-slate-50/50">
            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-extrabold tracking-wider bg-blue-600 text-white">
                            NORMALIZED TAXONOMY (DB 021)
                        </Badge>
                        <span className="text-xs text-slate-500 font-mono">Go Backend: `/api/v1/academic/*`</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
                        Master Data Akademik CMS
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola 6 tingkatan hirarki taksonomi: Level & Kelas, Kurikulum, Mapel, Bab, Topik (CP/TP Bloom), dan Program PTN.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={loading} className="text-xs font-semibold bg-white border-slate-200">
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                        Sync API
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-xs font-bold shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="mr-1.5 h-4 w-4" /> Tambah Master Data
                    </Button>
                </div>
            </div>

            {/* Quick Navigation Cards Grid - 6 DB Taxonomy Levels */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-500" /> Direct Sub-Page Access (Database Hierarchy)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: "Jenjang & Kelas", category: "JENJANG", icon: School, href: "/admin/master-data/levels", count: "4 Level & 12 Kelas", color: "text-blue-600 bg-blue-50 border-blue-200" },
                        { title: "Kurikulum Akademik", category: "KURIKULUM", icon: BookmarkCheck, href: "/admin/master-data/curriculums", count: "UTBK, Merdeka, K13", color: "text-teal-600 bg-teal-50 border-teal-200" },
                        { title: "Mata Pelajaran (Mapel)", category: "MAPEL", icon: BookOpen, href: "/admin/master-data/subjects", count: "8 Mapel TPS & TKA", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
                        { title: "Bab Materi Soal", category: "BAB", icon: Layers, href: "/admin/master-data/chapters", count: "48 Bab Terstruktur", color: "text-amber-600 bg-amber-50 border-amber-200" },
                        { title: "Topik & Learning Outcomes", category: "TOPIK", icon: BrainCircuit, href: "/admin/master-data/topics", count: "CP/TP Bloom C1-C6", color: "text-purple-600 bg-purple-50 border-purple-200" },
                        { title: "Tahun Ajaran & Program PTN", category: "PROGRAM", icon: Calendar, href: "/admin/master-data/programs", count: "TA 2025/2026 Active", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                    ].map((cat, idx) => {
                        const Icon = cat.icon;
                        return (
                            <Link key={idx} href={cat.href}>
                                <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all flex flex-col justify-between h-full group">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-2.5 rounded-xl border ${cat.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                                            {cat.title}
                                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                        </h4>
                                        <span className="text-xs text-slate-500 mt-0.5 block">{cat.count}</span>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Main Filter & Search Bar */}
            <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari kode atau nama taksonomi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {[
                        { label: "Semua", val: "ALL" },
                        { label: "Jenjang", val: "JENJANG" },
                        { label: "Kurikulum", val: "KURIKULUM" },
                        { label: "Mapel", val: "MAPEL" },
                        { label: "Bab", val: "BAB" },
                        { label: "Topik", val: "TOPIK" },
                        { label: "Program", val: "PROGRAM" },
                    ].map((cat) => (
                        <button
                            key={cat.label}
                            onClick={() => setSelectedCategory(cat.val)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0 transition-all ${selectedCategory === cat.val
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Grid Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredData.map((item) => (
                    <Card key={item.id} className="p-5 bg-white border-slate-200 shadow-sm hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="font-mono text-[10px] border-slate-200 bg-slate-50 text-slate-700">{item.code}</Badge>
                                <Badge className="text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">{item.category}</Badge>
                            </div>
                            <h3 className="font-bold text-base text-slate-900 pt-1">{item.name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{item.itemsCount} Items Terkait</span>
                            <div className="flex items-center gap-2">
                                <Link href={item.targetRoute}>
                                    <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold border-slate-200 text-blue-600 hover:bg-blue-50">
                                        Kelola Sub-Halaman <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(item.id, item.category)}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                    disabled={loading}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add Modal */}
            <AdminActionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Tambah Item Master Data Akademik"
                description="Masukkan entitas taksonomi baru ke dalam database Go Fiber backend."
                onSubmit={handleCreateItem}
                submitLabel="Simpan Master Data"
                disabled={loading}
            >
                {modalFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> {modalFeedback}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kode Unik Taksonomi</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: MP-PK"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kategori Taksonomi</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as MasterDataItem["category"])}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                                >
                                    <option value="JENJANG">JENJANG</option>
                                    <option value="KURIKULUM">KURIKULUM</option>
                                    <option value="MAPEL">MAPEL</option>
                                    <option value="BAB">BAB</option>
                                    <option value="TOPIK">TOPIK</option>
                                    <option value="PROGRAM">PROGRAM</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Taksonomi</label>
                            <input
                                type="text"
                                placeholder="Masukkan nama..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Deskripsi Singkat</label>
                            <textarea
                                placeholder="Keterangan tambahan..."
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                            />
                        </div>

                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 inline mr-1" /> 
                            Catatan: Kurikulum, Bab, Topik memerlukan endpoint backend tambahan. Hanya Jenjang, Mapel, Program yang CRUD penuh saat ini.
                        </div>
                    </div>
                )}
            </AdminActionModal>
        </div>
    );
}