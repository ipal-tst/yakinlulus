"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useHasRole } from "@/providers/AuthProvider";
import {
    useTargetSchools, useCreateTargetSchool, useUpdateTargetSchool, useDeleteTargetSchool,
    type TargetSchool,
} from "@/lib/api";
import { Plus, Pencil, Trash2, Loader2, School } from "lucide-react";

const LEVELS: Array<{ value: TargetSchool["level"]; label: string }> = [
    { value: "SMP", label: "SMP" },
    { value: "SMA", label: "SMA" },
    { value: "UNIVERSITY", label: "Universitas" },
];

export default function AdminTargetSchoolsPage() {
    const { allowed, loading } = useHasRole("ADMIN", "STAFF");
    const router = useRouter();
    const [level, setLevel] = React.useState<TargetSchool["level"]>("SMP");
    const schools = useTargetSchools(level);
    const createSchool = useCreateTargetSchool();
    const updateSchool = useUpdateTargetSchool();
    const deleteSchool = useDeleteTargetSchool();
    const [editing, setEditing] = React.useState<Partial<TargetSchool> | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    if (loading) return <div className="p-6">Memuat...</div>;
    if (!allowed) {
        router.replace("/admin");
        return null;
    }

    const list = schools.data ?? [];

    const openNew = () => { setEditing({ level, max_total_score: 400, subjects: [], is_active: true }); setDialogOpen(true); };
    const openEdit = (s: TargetSchool) => { setEditing(s); setDialogOpen(true); };

    const save = async () => {
        if (!editing) return;
        if (editing.id) await updateSchool.mutateAsync({ id: editing.id, data: editing });
        else await createSchool.mutateAsync(editing);
        setDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider">ADMIN</Badge>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">Target Sekolah</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Master data sekolah & ambang nilai (SMP/SMA/Universitas).</p>
                </div>
                <Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Sekolah</Button>
            </div>

            <div className="flex gap-2">
                {LEVELS.map((l) => (
                    <Button key={l.value} variant={level === l.value ? "default" : "outline"} size="sm" onClick={() => setLevel(l.value)}>
                        {l.label}
                    </Button>
                ))}
            </div>

            <Card className="p-4">
                {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada sekolah untuk jenjang {level}.</p>
                ) : (
                    <div className="space-y-3">
                        {list.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-xl border p-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold truncate flex items-center gap-1.5">
                                        <School className="h-4 w-4 text-primary" /> {s.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Ambang: {s.min_score ?? "-"} - {s.max_score ?? "-"} • Maks: {s.max_total_score}
                                        {s.academic_year ? ` • ${s.academic_year}` : ""}
                                        {s.subjects.length ? ` • ${s.subjects.join(", ")}` : ""}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <Badge variant={s.is_active ? "success" : "secondary"} className="text-[10px]">{s.is_active ? "AKTIF" : "NONAKTIF"}</Badge>
                                    <Button variant="outline" size="icon" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button variant="outline" size="icon" className="text-danger" onClick={() => deleteSchool.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title={editing?.id ? "Edit Sekolah" : "Tambah Sekolah"}>
                {editing && (
                    <div className="space-y-3">
                        <Input placeholder="Nama sekolah" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                        <div className="grid grid-cols-3 gap-2">
                            <Input placeholder="Min" type="number" value={editing.min_score ?? ""} onChange={(e) => setEditing((prev) => { if (!prev) return prev; const next = { ...prev }; const v = e.target.value ? Number(e.target.value) : null; if (v === null) delete next.min_score; else next.min_score = v; return next; })} />
                            <Input placeholder="Max" type="number" value={editing.max_score ?? ""} onChange={(e) => setEditing((prev) => { if (!prev) return prev; const next = { ...prev }; const v = e.target.value ? Number(e.target.value) : null; if (v === null) delete next.max_score; else next.max_score = v; return next; })} />
                            <Input placeholder="Total maks" type="number" value={editing.max_total_score ?? 400} onChange={(e) => setEditing({ ...editing, max_total_score: e.target.value ? Number(e.target.value) : 400 })} />
                        </div>
                        <Input placeholder="Tahun ajaran (contoh 2026)" value={editing.academic_year || ""} onChange={(e) => setEditing({ ...editing, academic_year: e.target.value })} />
                        <Input placeholder="Mapel dipisah koma (contoh: Matematika, IPA)" value={(editing.subjects || []).join(", ")} onChange={(e) => setEditing({ ...editing, subjects: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                        <select value={editing.level || "SMP"} onChange={(e) => setEditing({ ...editing, level: e.target.value as TargetSchool["level"] })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                        <Button size="sm" className="w-full" onClick={save} disabled={createSchool.isPending || updateSchool.isPending}>
                            {(createSchool.isPending || updateSchool.isPending) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Simpan
                        </Button>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
