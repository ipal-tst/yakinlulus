"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    Calculator,
    Flag,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export default function StudentPracticeSessionPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = React.use(params);
    const practiceId = resolvedParams.id;
    const [currentIdx, setCurrentIdx] = React.useState(0);
    const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, string>>({});
    const [flagged, setFlagged] = React.useState<Record<number, boolean>>({});
    const [isCalculatorOpen, setIsCalculatorOpen] = React.useState(false);
    const [timeLeft, setTimeLeft] = React.useState(15 * 60);

    const questions = [
        {
            num: 1,
            text: "Diberikan matriks $A = \\begin{pmatrix} x & 2 \\\\ 3 & 4 \\end{pmatrix}$. Jika $\\det(A) = 10$, berapa nilai $x$?",
            options: [
                { label: "A", text: "$x = 4.5$" },
                { label: "B", text: "$x = 5.5$" },
                { label: "C", text: "$x = 4.0$" },
                { label: "D", text: "$x = 6.0$" },
                { label: "E", text: "$x = 3.5$" },
            ]
        },
        {
            num: 2,
            text: "Manakah penyelesaian terbaik untuk persamaan kuadrat $x^2 - 5x + 6 = 0$?",
            options: [
                { label: "A", text: "$x = 2$ atau $x = 3$" },
                { label: "B", text: "$x = 1$ atau $x = 6$" },
                { label: "C", text: "$x = -2$ atau $x = -3$" },
                { label: "D", text: "$x = 0$ atau $x = 5$" },
                { label: "E", text: "$x = 3$ atau $x = 4$" },
            ]
        }
    ];

    const defaultQuestion = questions[0]!;

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    const q = questions[currentIdx] ?? defaultQuestion;

    const handleSelectOption = (optLabel: string) => {
        setSelectedAnswers({ ...selectedAnswers, [currentIdx]: optLabel });
    };

    const toggleFlag = () => {
        setFlagged({ ...flagged, [currentIdx]: !flagged[currentIdx] });
    };

    return (
        <div className="space-y-6">
            {/* Session Top Bar */}
            <Card className="rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">Practice Session</Badge>
                        <span className="text-xs text-muted-foreground">Paket: {practiceId.toUpperCase()}</span>
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight mt-1">Soal No. {q.num} dari {questions.length}</h1>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/40 font-mono text-xs font-bold">
                        <Clock className="h-4 w-4 text-primary" /> {formatTime(timeLeft)}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                        className="text-xs font-semibold"
                    >
                        <Calculator className="mr-1.5 h-3.5 w-3.5" /> Kalkulator
                    </Button>
                    <Link href={`/student/practice/${practiceId}/result`}>
                        <Button size="sm" variant="success" className="text-xs font-bold">
                            Selesai &amp; Kumpulkan
                        </Button>
                    </Link>
                </div>
            </Card>

            {/* Main Question & Navigator */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                {/* Left 3 Cols: Question Box */}
                <Card className="lg:col-span-3 rounded-2xl p-5 space-y-5">
                    <div className="flex items-center justify-between border-b pb-3 gap-2 flex-wrap">
                        <span className="text-xs font-bold text-muted-foreground">Pilihan Ganda Sub-tes Penalaran Matematika</span>
                        <Button
                            variant={flagged[currentIdx] ? "warning" : "outline"}
                            size="sm"
                            onClick={toggleFlag}
                            className="text-xs font-semibold h-7"
                        >
                            <Flag className="mr-1.5 h-3 w-3" /> {flagged[currentIdx] ? "Ragu-Ragu (Flagged)" : "Tandai Ragu"}
                        </Button>
                    </div>

                    {/* Question Text */}
                    <div className="text-sm font-semibold text-foreground p-4 rounded-xl border bg-muted/20 leading-relaxed font-mono">
                        {q.text}
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {q.options.map((opt) => {
                            const isSelected = selectedAnswers[currentIdx] === opt.label;
                            return (
                                <div
                                    key={opt.label}
                                    onClick={() => handleSelectOption(opt.label)}
                                    className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${isSelected
                                        ? "border-primary bg-primary/10 font-bold"
                                        : "hover:border-primary/40 bg-card"
                                        }`}
                                >
                                    <div className={`h-7 w-7 rounded-lg font-bold text-xs flex items-center justify-center border shrink-0 ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted"
                                        }`}>
                                        {opt.label}
                                    </div>
                                    <span className="text-xs font-mono">{opt.text}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-4 border-t flex justify-between items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx(currentIdx - 1)}
                            className="text-xs font-semibold"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
                        </Button>

                        <Button
                            size="sm"
                            disabled={currentIdx === questions.length - 1}
                            onClick={() => setCurrentIdx(currentIdx + 1)}
                            className="text-xs font-bold"
                        >
                            Berikutnya <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                {/* Right 1 Col: Matrix Navigator & Calculator */}
                <div className="space-y-3">
                    <Card className="rounded-2xl p-4 space-y-3">
                        <h4 className="font-bold text-xs border-b pb-2">Matriks Navigasi Soal</h4>
                        <div className="grid grid-cols-5 gap-2 text-xs font-bold">
                            {questions.map((item, idx) => {
                                const isAns = selectedAnswers[idx];
                                const isFlag = flagged[idx];
                                const isCur = currentIdx === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIdx(idx)}
                                        className={`h-9 rounded-lg border flex items-center justify-center transition-all ${isCur
                                            ? "border-primary ring-2 ring-primary/40 font-extrabold"
                                            : isAns
                                                ? "bg-success text-success-foreground border-success"
                                                : isFlag
                                                    ? "bg-warning text-warning-foreground border-warning"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {isCalculatorOpen && (
                        <Card className="rounded-2xl p-4 space-y-3 border-primary/30">
                            <h4 className="font-bold text-xs flex items-center gap-1.5">
                                <Calculator className="h-4 w-4 text-primary" /> Calculator Sandbox
                            </h4>
                            <div className="p-2.5 rounded-lg border bg-muted font-mono text-right text-sm font-bold">
                                4.5 * 2 = 9
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
