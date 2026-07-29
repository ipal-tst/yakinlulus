"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";

export interface OptionType {
    id: string;
    label?: string; // e.g., "A", "B", "(1)", "(2)"
    text: string;
}

export interface StatementType {
    id: string;
    label?: string; // e.g., "A", "B", "C"
    statement: string;
    isTrue?: boolean;
}

export interface CBTOptionSelectorProps {
    questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "TRUE_FALSE_MATRIX";
    options?: OptionType[];
    statements?: StatementType[];
    selectedValues?: string[] | Record<string, boolean>; // string[] for options, Record<statementId, boolean> for true/false
    onChange: (val: any) => void;
    disabled?: boolean;
    customInstruction?: string;
}

export function CBTOptionSelector({
    questionType,
    options = [],
    statements = [],
    selectedValues,
    onChange,
    disabled = false,
    customInstruction,
}: CBTOptionSelectorProps) {
    const isSingleChoice = questionType === "SINGLE_CHOICE";
    const isMultipleChoice = questionType === "MULTIPLE_CHOICE";
    const isTrueFalse = questionType === "TRUE_FALSE" || questionType === "TRUE_FALSE_MATRIX";

    // 1. TRUE_FALSE MATRIX TABLE VIEW
    if (isTrueFalse) {
        const tfAnswers = (selectedValues && typeof selectedValues === "object" && !Array.isArray(selectedValues))
            ? (selectedValues as Record<string, boolean>)
            : {};

        const handleTFChange = (stmtId: string, val: boolean) => {
            if (disabled) return;
            onChange({
                ...tfAnswers,
                [stmtId]: val,
            });
        };

        return (
            <div className="space-y-3">
                {/* Header Prompt Instruction */}
                <div className="text-sm font-bold text-[#1E293B]">
                    {customInstruction || "Tentukan benar atau salah untuk setiap pernyataan berikut!"}
                </div>

                {/* Grid Table Layout */}
                <div className="border border-[#CBD5E1] rounded-lg overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#E2E8F0] border-b border-[#CBD5E1] text-[#1E293B] text-xs font-extrabold uppercase tracking-wide">
                                <th className="p-3 w-10 text-center border-r border-[#CBD5E1]">#</th>
                                <th className="p-3 border-r border-[#CBD5E1]">Pernyataan</th>
                                <th className="p-3 w-24 text-center border-r border-[#CBD5E1]">Benar</th>
                                <th className="p-3 w-24 text-center">Salah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-xs md:text-sm">
                            {statements.length === 0 && options.length > 0 ? (
                                // Fallback: convert options to statements if passed via options prop
                                options.map((opt, idx) => {
                                    const stmtId = opt.id || String(idx);
                                    const currentVal = tfAnswers[stmtId];
                                    const rowLabel = opt.label || String.fromCharCode(65 + idx);

                                    return (
                                        <tr key={stmtId} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-3 font-bold text-[#64748B] text-center border-r border-[#CBD5E1]">
                                                {rowLabel}
                                            </td>
                                            <td className="p-3 text-[#1E293B] border-r border-[#CBD5E1] font-medium leading-relaxed">
                                                <MathKaTeXPreview content={opt.text} />
                                            </td>
                                            <td className="p-3 text-center border-r border-[#CBD5E1] bg-[#F8FAFC]/50">
                                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                                    <input
                                                        type="radio"
                                                        name={`tf-${stmtId}`}
                                                        checked={currentVal === true}
                                                        onChange={() => handleTFChange(stmtId, true)}
                                                        disabled={disabled}
                                                        className="h-4 w-4 text-[#1565C0] focus:ring-0 cursor-pointer"
                                                    />
                                                </label>
                                            </td>
                                            <td className="p-3 text-center bg-[#F8FAFC]/50">
                                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                                    <input
                                                        type="radio"
                                                        name={`tf-${stmtId}`}
                                                        checked={currentVal === false}
                                                        onChange={() => handleTFChange(stmtId, false)}
                                                        disabled={disabled}
                                                        className="h-4 w-4 text-[#E11D48] focus:ring-0 cursor-pointer"
                                                    />
                                                </label>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                statements.map((stmt, idx) => {
                                    const stmtId = stmt.id || String(idx);
                                    const currentVal = tfAnswers[stmtId];
                                    const rowLabel = stmt.label || String.fromCharCode(65 + idx);

                                    return (
                                        <tr key={stmtId} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="p-3 font-bold text-[#64748B] text-center border-r border-[#CBD5E1]">
                                                {rowLabel}
                                            </td>
                                            <td className="p-3 text-[#1E293B] border-r border-[#CBD5E1] font-medium leading-relaxed">
                                                <MathKaTeXPreview content={stmt.statement} />
                                            </td>
                                            <td className="p-3 text-center border-r border-[#CBD5E1] bg-[#F8FAFC]/50">
                                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                                    <input
                                                        type="radio"
                                                        name={`tf-${stmtId}`}
                                                        checked={currentVal === true}
                                                        onChange={() => handleTFChange(stmtId, true)}
                                                        disabled={disabled}
                                                        className="h-4 w-4 text-[#1565C0] focus:ring-0 cursor-pointer"
                                                    />
                                                </label>
                                            </td>
                                            <td className="p-3 text-center bg-[#F8FAFC]/50">
                                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                                    <input
                                                        type="radio"
                                                        name={`tf-${stmtId}`}
                                                        checked={currentVal === false}
                                                        onChange={() => handleTFChange(stmtId, false)}
                                                        disabled={disabled}
                                                        className="h-4 w-4 text-[#E11D48] focus:ring-0 cursor-pointer"
                                                    />
                                                </label>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Array of selected option IDs
    const selectedList = Array.isArray(selectedValues)
        ? (selectedValues as string[])
        : typeof selectedValues === "string"
            ? [selectedValues as string]
            : [];

    const handleOptionToggle = (optionId: string) => {
        if (disabled) return;
        if (isSingleChoice) {
            onChange([optionId]);
        } else {
            if (selectedList.includes(optionId)) {
                onChange(selectedList.filter((id) => id !== optionId));
            } else {
                onChange([...selectedList, optionId]);
            }
        }
    };

    // 2. MULTIPLE CHOICE COMPLEX (Pilihan Ganda Kompleks / Multi Checkbox)
    if (isMultipleChoice) {
        return (
            <div className="space-y-3">
                {/* Instruction Banner */}
                <div className="text-sm font-bold text-[#1E293B]">
                    {customInstruction || "Pilihlah lebih dari satu pernyataan yang benar berikut:"}
                </div>

                <div className="space-y-2.5">
                    {options.map((opt, idx) => {
                        const optId = opt.id || opt.label || String(idx);
                        const isSelected = selectedList.includes(optId) || selectedList.includes(opt.label || "");
                        const displayNumLabel = opt.label && opt.label.startsWith("(") ? opt.label : `(${idx + 1})`;

                        return (
                            <button
                                key={optId}
                                type="button"
                                disabled={disabled}
                                onClick={() => handleOptionToggle(optId)}
                                className={cn(
                                    "w-full p-3.5 rounded-xl border-2 text-left text-sm md:text-base transition-all flex items-start gap-3 cursor-pointer",
                                    isSelected
                                        ? "border-[#1565C0] bg-[#E3F2FD]/50 text-[#1E293B] font-medium shadow-2xs"
                                        : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#1E293B]"
                                )}
                            >
                                {/* Square Checkbox box */}
                                <div
                                    className={cn(
                                        "h-5 w-5 rounded-md border-2 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                        isSelected
                                            ? "bg-[#1565C0] border-[#1565C0] text-white"
                                            : "bg-white border-[#CBD5E1] text-transparent"
                                    )}
                                >
                                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                                </div>

                                <div className="flex items-start gap-2 flex-1">
                                    <span className="font-bold text-[#1E293B] shrink-0">{displayNumLabel}</span>
                                    <div className="flex-1">
                                        <MathKaTeXPreview content={opt.text} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // 3. SINGLE CHOICE (Pilihan Ganda Tunggal)
    return (
        <div className="space-y-2.5">
            {customInstruction && (
                <div className="text-sm font-bold text-[#1E293B] mb-2">{customInstruction}</div>
            )}

            {options.map((opt, idx) => {
                const optId = opt.id || opt.label || String(idx);
                const optLabel = opt.label || String.fromCharCode(65 + idx);
                const isSelected = selectedList.includes(optId) || selectedList.includes(optLabel);

                return (
                    <button
                        key={optId}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleOptionToggle(optId)}
                        className={cn(
                            "w-full p-3.5 rounded-xl border-2 text-left text-sm md:text-base transition-all flex items-start gap-3 cursor-pointer",
                            isSelected
                                ? "border-[#1565C0] bg-[#E3F2FD]/50 text-[#1E293B] font-semibold shadow-2xs"
                                : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#1E293B]"
                        )}
                    >
                        {/* Circle Radio Indicator with Letter (A, B, C, D) */}
                        <div
                            className={cn(
                                "h-7 w-7 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 border transition-colors",
                                isSelected
                                    ? "bg-[#1565C0] text-white border-[#1565C0]"
                                    : "bg-white text-[#1E293B] border-[#CBD5E1]"
                            )}
                        >
                            {optLabel.replace(/\.$/, "")}.
                        </div>

                        <div className="flex-1 pt-0.5">
                            <MathKaTeXPreview content={opt.text} />
                        </div>
                    </button>
                );
            })}
        </div>
    );
}