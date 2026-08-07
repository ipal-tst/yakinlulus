"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Edit, Trash2 } from "lucide-react";

export default function GuruMaterialsPage() {
    const [materials] = useState([
        { id: "m-1", title: "Konsep Dasar Penalaran Matematika UTBK", subject: "Penalaran Matematika", time: 15, status: "PUBLISHED" },
        { id: "m-2", title: "Strategi Memahami Teks Bahasa Indonesia SNBT", subject: "Literasi Bahasa Indonesia", time: 20, status: "PUBLISHED" },
    ]);

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">Manajemen Materi Belajar</h1>
                        <p className="text-sm text-muted-foreground">Buat dan publikasikan modul teori, rangkuman, dan strategi belajar.</p>
                    </div>
                    <Button className="rounded-xl gap-2 font-semibold shadow-xs">
                        <Plus className="h-4 w-4" /> Tulis Materi Baru
                    </Button>
                </div>

                <Card className="p-4 divide-y divide-border">
                    {materials.map((m) => (
                        <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px]">{m.subject}</Badge>
                                    <Badge variant="success" className="text-[10px]">{m.status}</Badge>
                                </div>
                                <h3 className="font-heading font-semibold text-base">{m.title}</h3>
                                <p className="text-xs text-muted-foreground">{m.time} menit waktu baca</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="rounded-xl">Edit</Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                </Card>
            </div>
        </AppShell>
    );
}
