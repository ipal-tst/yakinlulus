"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Check, Sparkles } from "lucide-react";

const PTN_LIST = [
    "Universitas Indonesia (UI)",
    "Institut Teknologi Bandung (ITB)",
    "Universitas Gadjah Mada (UGM)",
    "Universitas Airlangga (UNAIR)",
    "Institut Teknologi Sepuluh Nopember (ITS)",
    "Universitas Padjadjaran (UNPAD)",
    "Universitas Diponegoro (UNDIP)",
    "Universitas Brawijaya (UB)",
];

export default function TargetsPage() {
    const [schoolName, setSchoolName] = useState("Universitas Indonesia (UI)");
    const [majorName, setMajorName] = useState("Teknik Informatika");
    const [targetScore, setTargetScore] = useState(720);
    const [saved, setSaved] = useState(false);

    const currentScore = 685;
    const chance = Math.round((currentScore / targetScore) * 100);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <AppShell>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Target PTN Impian</h1>
                    <p className="text-sm text-muted-foreground">Tentukan perguruan tinggi negeri dan jurusan impianmu untuk menghitung peluang kelulusan.</p>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        {saved && (
                            <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs flex items-center gap-2">
                                <Check className="h-4 w-4" /> Target PTN berhasil diperbarui!
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Perguruan Tinggi Negeri (PTN)</label>
                            <select
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {PTN_LIST.map((ptn) => (
                                    <option key={ptn} value={ptn}>{ptn}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Program Studi / Jurusan</label>
                            <Input
                                value={majorName}
                                onChange={(e) => setMajorName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Target Skor UTBK Minimum</label>
                            <Input
                                type="number"
                                value={targetScore}
                                onChange={(e) => setTargetScore(Number(e.target.value))}
                                required
                            />
                        </div>

                        {/* Live Chance Card */}
                        <div className="p-5 rounded-2xl bg-secondary/60 border border-border space-y-3 mt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold flex items-center gap-1.5">
                                    <Sparkles className="h-4 w-4 text-primary" /> Estimasi Peluang Lulus SNBT
                                </span>
                                <Badge variant="success" className="text-xs">
                                    {chance > 90 ? "Sangat Tinggi" : "Tinggi"}
                                </Badge>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>Skor Saat Ini: <strong>{currentScore}</strong></span>
                                    <span>Target: <strong>{targetScore}</strong></span>
                                </div>
                                <Progress value={chance} className="h-3" />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 rounded-xl font-semibold">
                            Simpan Target PTN
                        </Button>
                    </form>
                </Card>
            </div>
        </AppShell>
    );
}
