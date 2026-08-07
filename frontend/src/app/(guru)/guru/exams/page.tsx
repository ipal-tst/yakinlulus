"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Plus, Clock, HelpCircle, Eye } from "lucide-react";

export default function GuruExamsPage() {
    const [exams] = useState([
        { id: "ex-1", title: "Try Out Nasional UTBK SNBT 2026 #5", duration: 195, questions: 155, status: "ACTIVE" },
        { id: "ex-2", title: "Drill Subtes Penalaran Matematika #3", duration: 30, questions: 20, status: "ACTIVE" },
    ]);

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">Manajemen Try Out & Ujian</h1>
                        <p className="text-sm text-muted-foreground">Buat paket ujian baru, atur alokasi soal per subtes, dan durasi pengerjaan.</p>
                    </div>
                    <Button className="rounded-xl gap-2 font-semibold shadow-xs">
                        <Plus className="h-4 w-4" /> Buat Try Out Baru
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exams.map((ex) => (
                        <Card key={ex.id} className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge variant="success" className="text-[10px]">{ex.status}</Badge>
                                <span className="text-xs text-muted-foreground">ID: {ex.id}</span>
                            </div>

                            <h3 className="font-heading font-bold text-lg">{ex.title}</h3>

                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {ex.duration} Menit</span>
                                <span className="flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-primary" /> {ex.questions} Soal</span>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <Button variant="outline" size="sm" className="rounded-xl gap-1"><Eye className="h-3.5 w-3.5" /> Detail</Button>
                                <Button variant="default" size="sm" className="rounded-xl">Edit Ujian</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}
