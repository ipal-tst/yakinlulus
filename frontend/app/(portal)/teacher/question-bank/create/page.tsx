"use client";

import * as React from "react";
import Link from "next/link";
import { useCreateQuestion } from "@/lib/api";
import { ArrowLeft, Sparkles, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FSMStateControl, FSMState } from "@/components/editor/FSMStateControl";
import { QuestionFormEngine } from "@/components/editor/QuestionFormEngine";

export default function QuestionCreateStudioPage() {
    const createQuestion = useCreateQuestion();
    const [fsmState, setFsmState] = React.useState<FSMState>("DRAFT");

    const handleStateChange = (newState: FSMState, reason?: string) => {
        setFsmState(newState);
        if (reason) {
            console.log(`FSM State updated to ${newState} with reason: ${reason}`);
        }
    };

    const handleSubmit = (data: any) => {
        createQuestion.mutate(data, {
            onSuccess: () => {
                alert("Soal berhasil disimpan dalam draf!");
            },
            onError: (err: Error) => {
                alert(`Gagal menyimpan soal: ${err.message}`);
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Header section with back navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/teacher/question-bank">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">Studio Penulisan Soal</h2>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                <Sparkles className="mr-1 h-3 w-3" /> React 19 Engine
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Buat dan susun butir soal dengan dukungan KaTeX Math, Audio Listening, dan Polymorphic Types.
                        </p>
                    </div>
                </div>
            </div>

            {/* FSM Workflow Controller */}
            <FSMStateControl
                currentState={fsmState}
                onStateChange={handleStateChange}
                userRole="teacher"
            />

            {/* Main Studio Area */}
            <div className="grid grid-cols-1 gap-6">
                <QuestionFormEngine
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}
