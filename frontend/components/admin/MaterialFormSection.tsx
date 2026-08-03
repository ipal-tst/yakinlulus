"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MediaPicker from "@/components/media-picker";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";
import { useSubjects, useChapters, useTopics, apiFetch } from "@/lib/api";
import {
    emptyMaterialForm,
    mapMaterialToForm,
    type MaterialFormData,
} from "@/lib/material-form-utils";
import { Loader2 } from "lucide-react";

interface MaterialFormSectionProps {
    mode: "create" | "edit";
    initialData?: any;
    submitLabel?: string;
    isSubmitting?: boolean;
    onSubmit: (payload: any) => void;
    onCancel: () => void;
}

export function MaterialFormSection({
    mode,
    initialData,
    submitLabel = "Simpan Modul",
    isSubmitting = false,
    onSubmit,
    onCancel,
}: MaterialFormSectionProps) {
    const { data: subjects = [] } = useSubjects() as any;
    const subjectsList: any[] = Array.isArray(subjects) ? subjects : [];
    const { data: allChapters = [] } = useChapters() as any;
    const chaptersList: any[] = Array.isArray(allChapters) ? allChapters : [];

    const [formData, setFormData] = React.useState<MaterialFormData>(emptyMaterialForm());
    const [initialized, setInitialized] = React.useState(mode === "create");

    React.useEffect(() => {
        if (mode === "edit" && initialData && !initialized) {
            setFormData(mapMaterialToForm(initialData));
            setInitialized(true);
        }
    }, [mode, initialData, initialized]);

    const { data: topics = [], refetch: refetchTopics } = useTopics(formData.chapter_id || undefined) as any;
    const topicsList: any[] = Array.isArray(topics) ? topics : [];

    const [showNewChapter, setShowNewChapter] = React.useState(false);
    const [newChapterName, setNewChapterName] = React.useState("");
    const [showNewTopic, setShowNewTopic] = React.useState(false);
    const [newTopicName, setNewTopicName] = React.useState("");
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const insertMedia = (md: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const next = text.substring(0, start) + md + text.substring(end);
            setFormData((prev) => ({ ...prev, content: next }));
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + md.length;
            });
        } else {
            setFormData((prev) => ({ ...prev, content: prev.content + "\n" + md + "\n" }));
        }
    };

    const handleCreateChapter = async () => {
        if (!newChapterName.trim() || !formData.subject_id) return;
        try {
            const res = await apiFetch("/academic/chapters", {
                method: "POST",
                body: JSON.stringify({ subject_id: formData.subject_id, name: newChapterName.trim() }),
            });
            setFormData((prev) => ({
                ...prev,
                chapter_id: (res as any)?.id || (res as any)?.chapter_id || "",
                topic_id: "",
            }));
            setNewChapterName("");
            setShowNewChapter(false);
            refetchTopics();
        } catch {
            alert("Gagal membuat bab baru");
        }
    };

    const handleCreateTopic = async () => {
        if (!newTopicName.trim() || !formData.chapter_id) return;
        try {
            const res = await apiFetch("/academic/topics", {
                method: "POST",
                body: JSON.stringify({ chapter_id: formData.chapter_id, name: newTopicName.trim() }),
            });
            setFormData((prev) => ({
                ...prev,
                topic_id: (res as any)?.id || (res as any)?.topic_id || "",
            }));
            setNewTopicName("");
            setShowNewTopic(false);
            refetchTopics();
        } catch {
            alert("Gagal membuat sub topik baru");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert("Judul Modul tidak boleh kosong");
            return;
        }
        if (!formData.content.trim()) {
            alert("Isi modul tidak boleh kosong");
            return;
        }
        onSubmit(formData);
    };

    const selectedSubject = subjectsList.find((s) => s.id === formData.subject_id);
    const selectedChapter = chaptersList.find((c) => c.id === formData.chapter_id);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Card className="p-5 space-y-4">
                    <h3 className="text-sm font-extrabold border-b pb-2">Informasi Modul</h3>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Judul Modul Materi *</label>
                        <input
                            type="text"
                            placeholder="Contoh: Hukum II Newton & Dinamika Gerak"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Mata Pelajaran *</label>
                            <select
                                value={formData.subject_id}
                                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value, chapter_id: "", topic_id: "" })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Pilih Mata Pelajaran --</option>
                                {subjectsList.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.level_code || "?"})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Bab / Chapter</label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.chapter_id}
                                    onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value, topic_id: "" })}
                                    className="flex-1 w-full min-w-0 px-3 py-2 text-xs rounded-xl border bg-background"
                                >
                                    <option value="">-- Pilih Bab --</option>
                                    {chaptersList
                                        .filter((ch: any) => !formData.subject_id || ch.subject_id === formData.subject_id)
                                        .map((ch: any) => (
                                            <option key={ch.id} value={ch.id}>{ch.name}</option>
                                        ))}
                                </select>
                                {formData.subject_id && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowNewChapter((v) => !v)}
                                        className="shrink-0 text-xs cursor-pointer"
                                    >
                                        + Bab
                                    </Button>
                                )}
                            </div>
                            {showNewChapter && (
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nama bab baru..."
                                        value={newChapterName}
                                        onChange={(e) => setNewChapterName(e.target.value)}
                                        className="flex-1 px-3 py-1.5 text-xs border rounded-lg bg-background"
                                        autoFocus
                                    />
                                    <Button type="button" size="sm" onClick={handleCreateChapter} className="text-xs cursor-pointer">Simpan</Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => { setShowNewChapter(false); setNewChapterName(""); }} className="text-xs cursor-pointer">Batal</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Sub Topik (Opsional)</label>
                        <div className="flex gap-2">
                            <select
                                value={formData.topic_id}
                                onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                                className="flex-1 w-full min-w-0 px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="">-- Pilih Sub Topik --</option>
                                {topicsList.map((t: any) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            {formData.chapter_id && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowNewTopic((v) => !v)}
                                    className="shrink-0 text-xs cursor-pointer"
                                >
                                    + Sub Topik
                                </Button>
                            )}
                        </div>
                        {showNewTopic && (
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nama sub topik baru..."
                                    value={newTopicName}
                                    onChange={(e) => setNewTopicName(e.target.value)}
                                    className="flex-1 px-3 py-1.5 text-xs border rounded-lg bg-background"
                                    autoFocus
                                />
                                <Button type="button" size="sm" onClick={handleCreateTopic} className="text-xs cursor-pointer">Simpan</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowNewTopic(false); setNewTopicName(""); }} className="text-xs cursor-pointer">Batal</Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Estimasi Waktu Belajar (Menit)</label>
                            <input
                                type="number"
                                min={1}
                                value={formData.estimated_duration}
                                onChange={(e) => setFormData({ ...formData, estimated_duration: Number(e.target.value) })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Status Publikasi</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="PUBLISHED">PUBLISHED (Dapat Diakses Siswa)</option>
                                <option value="DRAFT">DRAFT (Dalam Penyusunan)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Isi & Ringkasan Modul Materi *</label>
                        <div className="flex gap-2">
                            <textarea
                                ref={textareaRef}
                                rows={8}
                                placeholder="Tuliskan materi pembelajaran lengkap, formula LaTeX, atau catatan penting..."
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="flex-1 p-3 text-xs rounded-xl border bg-background font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <MediaPicker onInsert={insertMedia} />
                        </div>
                    </div>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={onCancel}>Batal</Button>
                    <Button type="submit" size="sm" disabled={isSubmitting} className="font-bold">
                        {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                        {isSubmitting ? "Menyimpan..." : submitLabel}
                    </Button>
                </div>
            </form>

            <aside className="space-y-4 lg:sticky lg:top-6">
                <Card className="p-5 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Pratinjau Live</span>
                        <span className="text-[10px] text-muted-foreground">KaTeX & Markdown</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {formData.subject_id && (
                            <Badge variant="default" className="text-[10px]">
                                {selectedSubject?.name || "Mapel"}
                            </Badge>
                        )}
                        {formData.chapter_id && (
                            <Badge variant="secondary" className="text-[10px]">
                                {selectedChapter?.name || "Bab"}
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">{formData.status}</Badge>
                        <Badge variant="outline" className="text-[10px]">~{formData.estimated_duration} menit</Badge>
                    </div>

                    <div>
                        <h3 className="font-extrabold text-sm leading-snug">
                            {formData.title.trim() || "Judul modul akan tampil di sini"}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formData.content.split(/\s+/).filter(Boolean).length} kata • pratinjau render akhir
                        </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 border p-3 min-h-[120px]">
                        <MathKaTeXPreview content={formData.content.trim() || "(isi modul akan tampil di sini)"} />
                    </div>
                </Card>
            </aside>
        </div>
    );
}
