"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CBTOptionSelector, OptionType, StatementType } from "./CBTOptionSelector";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";

interface CBTQuestionRendererProps {
    question: {
        id: string;
        stem: string;
        stimulus?: string;
        questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "TRUE_FALSE_MATRIX";
        options?: OptionType[];
        trueFalseStatements?: StatementType[];
        subjectName?: string;
        difficulty?: "EASY" | "MEDIUM" | "HARD" | "Mudah" | "Sedang" | "Sangat Sulit";
    };
    userAnswer?: any; // string[], string, or Record<string, boolean>
    onAnswerChange: (answer: any) => void;
    isDoubtful: boolean;
    onDoubtfulChange: (doubtful: boolean) => void;
    disabled?: boolean;
    questionIndex?: number;
    totalQuestions?: number;
}

export function CBTQuestionRenderer({
    question,
    userAnswer,
    onAnswerChange,
    isDoubtful,
    onDoubtfulChange,
    disabled = false,
    questionIndex,
    totalQuestions,
}: CBTQuestionRendererProps) {
    return (
        <Card className="p-6 space-y-6 bg-white border-[#E2E8F0] shadow-2xs rounded-2xl">
            {/* Question Header Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                    {questionIndex !== undefined && totalQuestions !== undefined && (
                        <Badge variant="outline" className="text-xs font-mono border-[#E2E8F0] bg-[#F8FAFC]">
                            Soal {questionIndex + 1} / {totalQuestions}
                        </Badge>
                    )}
                    {question.difficulty && (
                        <Badge
                            variant={
                                question.difficulty === "EASY" || question.difficulty === "Mudah"
                                    ? "secondary"
                                    : question.difficulty === "MEDIUM" || question.difficulty === "Sedang"
                                        ? "default"
                                        : "destructive"
                            }
                            className="text-[10px] uppercase font-bold"
                        >
                            {question.difficulty}
                        </Badge>
                    )}
                    {question.subjectName && (
                        <Badge variant="outline" className="text-[10px] text-[#1565C0] border-[#1565C0]/30 bg-[#E3F2FD]/50 font-bold">
                            {question.subjectName}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] cursor-pointer select-none bg-[#FFF8E1] border border-[#FFE082] px-3 py-1 rounded-lg">
                        <input
                            type="checkbox"
                            checked={isDoubtful}
                            onChange={(e) => onDoubtfulChange(e.target.checked)}
                            disabled={disabled}
                            className="h-4 w-4 rounded border-[#CBD5E1] text-[#F9A825] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[#B78103]">Tandai Ragu</span>
                    </label>
                </div>
            </div>

            {/* Stimulus / Intro (optional) */}
            {question.stimulus && (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#1E293B] leading-relaxed">
                    <MathKaTeXPreview content={question.stimulus} invertDark={false} />
                </div>
            )}

            {/* Question Stem */}
            <div className="prose max-w-none text-base md:text-lg leading-relaxed font-medium text-[#1E293B]">
                <MathKaTeXPreview content={question.stem} invertDark={false} />
            </div>

            {/* Options / True-False Matrix Selection */}
            <div className="pt-2">
                <CBTOptionSelector
                    questionType={question.questionType}
                    options={question.options || []}
                    statements={question.trueFalseStatements || []}
                    selectedValues={userAnswer}
                    onChange={onAnswerChange}
                    disabled={disabled}
                />
            </div>
        </Card>
    );
}