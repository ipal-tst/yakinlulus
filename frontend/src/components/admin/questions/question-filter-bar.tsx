"use client";

import { Input } from "@/components/ui/input";
import { Search, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterState {
    search: string;
    subject: string;
    difficulty: string;
    questionType: string;
    status: string;
    isHotsOnly: boolean;
}

interface FilterProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    onReset: () => void;
}

export function QuestionFilterBar({ filters, onChange, onReset }: FilterProps) {
    return (
        <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari teks soal, kode (e.g. PM-001), atau topik..."
                        value={filters.search}
                        onChange={(e) => onChange({ ...filters, search: e.target.value })}
                        className="pl-9 bg-background/50 rounded-xl"
                    />
                </div>

                {/* Subject Filter */}
                <select
                    value={filters.subject}
                    onChange={(e) => onChange({ ...filters, subject: e.target.value })}
                    className="w-full md:w-52 h-10 rounded-xl border border-input bg-background/50 px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20"
                >
                    <option value="ALL">Semua Mata Pelajaran</option>
                    <option value="Penalaran Matematika">Penalaran Matematika</option>
                    <option value="Literasi Bahasa Indonesia">Literasi Bahasa Indonesia</option>
                    <option value="Literasi Bahasa Inggris">Literasi Bahasa Inggris</option>
                    <option value="Penalaran Umum">Penalaran Umum</option>
                    <option value="Fisika">Fisika</option>
                    <option value="Kimia">Kimia</option>
                </select>

                {/* Difficulty Filter */}
                <select
                    value={filters.difficulty}
                    onChange={(e) => onChange({ ...filters, difficulty: e.target.value })}
                    className="w-full md:w-40 h-10 rounded-xl border border-input bg-background/50 px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20"
                >
                    <option value="ALL">Semua Kesulitan</option>
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                    <option value="EXPERT">EXPERT</option>
                </select>

                {/* Question Type Filter */}
                <select
                    value={filters.questionType}
                    onChange={(e) => onChange({ ...filters, questionType: e.target.value })}
                    className="w-full md:w-44 h-10 rounded-xl border border-input bg-background/50 px-3 text-xs font-medium focus:ring-2 focus:ring-primary/20"
                >
                    <option value="ALL">Semua Tipe Soal</option>
                    <option value="SINGLE_CHOICE">Pilihan Ganda</option>
                    <option value="MULTIPLE_CHOICE">PG Kompleks</option>
                    <option value="TRUE_FALSE">Benar / Salah</option>
                    <option value="SHORT_ANSWER">Isian Singkat</option>
                    <option value="ESSAY">Uraian / Essay</option>
                </select>
            </div>

            {/* Sub-Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/40">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                        <input
                            type="checkbox"
                            checked={filters.isHotsOnly}
                            onChange={(e) => onChange({ ...filters, isHotsOnly: e.target.checked })}
                            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                        />
                        <span>Hanya Soal HOTS 🔥</span>
                    </label>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">Status:</span>
                        <select
                            value={filters.status}
                            onChange={(e) => onChange({ ...filters, status: e.target.value })}
                            className="h-8 rounded-lg border border-input bg-background/50 px-2 text-xs"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="DRAFT">Draft</option>
                            <option value="REVIEW">Review</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
                >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                </Button>
            </div>
        </div>
    );
}
