// frontend/src/components/siswa/TargetProgressCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, ArrowUpRight } from "lucide-react";

interface TargetProgressCardProps {
    schoolName?: string;
    majorName?: string;
    targetScore?: number;
    currentScore?: number;
    passingChance?: number;
}

export function TargetProgressCard({
    schoolName = "Universitas Indonesia",
    majorName = "Teknik Informatika",
    targetScore = 720,
    currentScore = 685,
    passingChance = 85,
}: TargetProgressCardProps) {
    const progressPercent = Math.min(100, Math.round((currentScore / targetScore) * 100));
    const scoreGap = Math.max(0, targetScore - currentScore);

    return (
        <Card className="border-primary/20 bg-linear-to-b from-card to-blue-50/30 dark:to-blue-950/10">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" /> Target PTN Impian
                    </CardTitle>
                    <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold">
                        {passingChance}% Peluang Lulus
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-background/80 border border-border/60">
                    <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                        {schoolName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-6 font-medium">
                        {majorName}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Skor Saat Ini: <strong className="text-primary font-bold text-sm">{currentScore}</strong></span>
                        <span>Target Minimum: <strong>{targetScore}</strong></span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Progress Score: {progressPercent}%</span>
                        {scoreGap > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">Sisa {scoreGap} poin lagi</span>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Target Tercapai! 🎉</span>
                        )}
                    </div>
                </div>

                <Button asChild variant="outline" className="w-full rounded-xl font-medium justify-between">
                    <Link href="/targets">
                        <span>Kelola Target PTN</span>
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
