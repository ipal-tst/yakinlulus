"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";
import { Plus, Trash2 } from "lucide-react";

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";

// Zod Validation Schema for Polymorphic Question
const questionSchema = z.object({
    questionText: z.string().min(10, "Teks soal minimal 10 karakter"),
    type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"]),
    explanation: z.string().min(5, "Penjelasan pembahasan wajib diisi"),
    options: z.array(
        z.object({
            label: z.string(),
            text: z.string().min(1, "Opsi tidak boleh kosong"),
            isCorrect: z.boolean(),
        })
    ).optional(),
    trueFalseStatements: z.array(
        z.object({
            statement: z.string().min(1, "Pernyataan tidak boleh kosong"),
            isTrue: z.boolean(),
        })
    ).optional(),
});

export type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormEngineProps {
    initialType?: QuestionType;
    onSubmit: (data: QuestionFormData) => void;
}

export function QuestionFormEngine({
    initialType = "SINGLE_CHOICE",
    onSubmit,
}: QuestionFormEngineProps) {
    const [questionType, setQuestionType] = React.useState<QuestionType>(initialType);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<QuestionFormData>({
        resolver: zodResolver(questionSchema),
        defaultValues: {
            type: initialType,
            questionText: "Diketahui persamaan kuadrat $x^2 - 5x + 6 = 0$. Nilai akar-akarnya adalah...",
            explanation: "Faktorkan persamaan $(x - 2)(x - 3) = 0$, sehingga $x_1 = 2$ atau $x_2 = 3$.",
            options: [
                { label: "A", text: "$x = 2$ atau $x = 3$", isCorrect: true },
                { label: "B", text: "$x = -2$ atau $x = -3$", isCorrect: false },
                { label: "C", text: "$x = 1$ atau $x = 6$", isCorrect: false },
                { label: "D", text: "$x = 0$ atau $x = 5$", isCorrect: false },
                { label: "E", text: "$x = -1$ atau $x = 6$", isCorrect: false },
            ],
            trueFalseStatements: [
                { statement: "Persamaan $x^2 - 5x + 6 = 0$ memiliki determinan $D > 0$.", isTrue: true },
                { statement: "Jumlah akar-akarnya $x_1 + x_2 = -5$.", isTrue: false },
                { statement: "Hasil kali akar-akarnya $x_1 \\cdot x_2 = 6$.", isTrue: true },
            ],
        },
    });

    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: "options",
    });

    const { fields: tfFields, append: appendTF, remove: removeTF } = useFieldArray({
        control,
        name: "trueFalseStatements",
    });

    const currentQuestionText = watch("questionText");
    const currentExplanation = watch("explanation");

    const handleTypeSwitch = (type: QuestionType) => {
        setQuestionType(type);
        setValue("type", type);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Type Switcher Bar */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pilih Tipe Soal Evaluasi
                </label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => handleTypeSwitch("SINGLE_CHOICE")}
                        className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${questionType === "SINGLE_CHOICE"
                            ? "border-primary bg-primary/10 text-primary shadow-xs"
                            : "hover:bg-accent text-muted-foreground"
                            }`}
                    >
                        Pilihan Ganda Tunggal
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTypeSwitch("MULTIPLE_CHOICE")}
                        className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${questionType === "MULTIPLE_CHOICE"
                            ? "border-primary bg-primary/10 text-primary shadow-xs"
                            : "hover:bg-accent text-muted-foreground"
                            }`}
                    >
                        Pilihan Ganda Majemuk
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTypeSwitch("TRUE_FALSE")}
                        className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${questionType === "TRUE_FALSE"
                            ? "border-primary bg-primary/10 text-primary shadow-xs"
                            : "hover:bg-accent text-muted-foreground"
                            }`}
                    >
                        Benar / Salah (Matriks)
                    </button>
                </div>
            </div>

            {/* Main Question Text & Live KaTeX Preview split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Teks Soal / Pertanyaan (Dukung $ LaTeX)</label>
                    <textarea
                        {...register("questionText")}
                        rows={4}
                        className="w-full rounded-lg border bg-background p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="Ketik soal disini..."
                    />
                    {errors.questionText && (
                        <p className="text-xs text-danger">{errors.questionText.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-primary">Live KaTeX Formula Preview</label>
                        <Badge variant="outline" className="text-[10px]">Realtime &lt;50ms</Badge>
                    </div>
                    <div className="h-[108px] rounded-lg border bg-card p-3 overflow-auto">
                        <MathKaTeXPreview content={currentQuestionText} />
                    </div>
                </div>
            </div>

            {/* Dynamic Form Sections based on Question Type */}

            {/* 1. SINGLE_CHOICE / MULTIPLE_CHOICE */}
            {(questionType === "SINGLE_CHOICE" || questionType === "MULTIPLE_CHOICE") && (
                <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Opsi Pilihan Ganda</h4>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                appendOption({
                                    label: String.fromCharCode(65 + optionFields.length),
                                    text: "",
                                    isCorrect: false,
                                })
                            }
                            className="text-xs"
                        >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Opsi
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {optionFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3">
                                <input
                                    type={questionType === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                                    name={questionType === "SINGLE_CHOICE" ? "correctOption" : undefined}
                                    checked={watch(`options.${index}.isCorrect`)}
                                    onChange={(e) => {
                                        if (questionType === "SINGLE_CHOICE") {
                                            optionFields.forEach((_, i) => setValue(`options.${i}.isCorrect`, i === index));
                                        } else {
                                            setValue(`options.${index}.isCorrect`, e.target.checked);
                                        }
                                    }}
                                    className="h-4 w-4 text-primary cursor-pointer"
                                />
                                <span className="font-bold text-xs w-5">{String.fromCharCode(65 + index)}.</span>
                                <Input
                                    {...register(`options.${index}.text` as const)}
                                    placeholder={`Teks pilihan ${String.fromCharCode(65 + index)}...`}
                                    className="flex-1"
                                />
                                {optionFields.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeOption(index)}
                                        className="h-8 w-8 text-muted-foreground hover:text-danger"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. TRUE_FALSE */}
            {questionType === "TRUE_FALSE" && (
                <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Matriks Pernyataan Benar / Salah</h4>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendTF({ statement: "", isTrue: true })}
                            className="text-xs"
                        >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Pernyataan
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {tfFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3">
                                <Input
                                    {...register(`trueFalseStatements.${index}.statement` as const)}
                                    placeholder={`Pernyataan #${index + 1}...`}
                                    className="flex-1"
                                />
                                <select
                                    onChange={(e) => setValue(`trueFalseStatements.${index}.isTrue`, e.target.value === "true")}
                                    value={watch(`trueFalseStatements.${index}.isTrue`) ? "true" : "false"}
                                    className="h-10 rounded-md border bg-background px-3 text-xs"
                                >
                                    <option value="true">Benar</option>
                                    <option value="false">Salah</option>
                                </select>
                                {tfFields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTF(index)}
                                        className="h-8 w-8 text-muted-foreground hover:text-danger"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Explanation / Pembahasan Section */}
            <div className="border-t pt-4 space-y-2">
                <label className="text-xs font-semibold">Penjelasan Pembahasan Soal (Dukung KaTeX)</label>
                <textarea
                    {...register("explanation")}
                    rows={3}
                    className="w-full rounded-lg border bg-background p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Tuliskan pembahasan langkah demi langkah..."
                />
                {currentExplanation && (
                    <div className="rounded-lg border bg-card p-3 text-xs">
                        <span className="font-semibold text-primary block mb-1">Preview Pembahasan:</span>
                        <MathKaTeXPreview content={currentExplanation} />
                    </div>
                )}
            </div>

            <Button type="submit" className="w-full" size="lg">
                Simpan Soal ke Bank Data
            </Button>
        </form>
    );
}
