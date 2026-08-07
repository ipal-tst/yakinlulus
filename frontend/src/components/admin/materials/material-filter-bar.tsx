"use client";

import { useQuery } from "@tanstack/react-query";
import { academicMasterService } from "@/services/academic-master.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, UploadCloud, RotateCcw } from "lucide-react";

export interface MaterialFilterState {
    search: string;
    subject: string;
    category: string;
    status: string;
}

interface MaterialFilterBarProps {
    filters: MaterialFilterState;
    onFilterChange: (filters: MaterialFilterState) => void;
    onOpenAuthoring: () => void;
    onOpenImport: () => void;
}

export function MaterialFilterBar({
    filters,
    onFilterChange,
    onOpenAuthoring,
    onOpenImport,
}: MaterialFilterBarProps) {
    // Dynamic Subjects from Academic Master Database
    const { data: dbSubjects = [] } = useQuery({
        queryKey: ["academic-master-subjects-materials-filter"],
        queryFn: async () => {
            try {
                const res = await academicMasterService.getSubjects();
                return Array.isArray(res) ? res : [];
            } catch {
                return [];
            }
        },
    });

    const defaultSubjectNames = [
        "Penalaran Matematika",
        "Literasi Bahasa Indonesia",
        "Literasi Bahasa Inggris",
        "Penalaran Umum",
        "Fisika",
        "Kimia",
        "Biologi",
    ];

    const rawSubjectList = dbSubjects.length > 0
        ? dbSubjects.map((s) => s.name)
        : defaultSubjectNames;

    const subjectList = Array.from(new Set(rawSubjectList.filter(Boolean)));

    const handleReset = () => {
        onFilterChange({
            search: "",
            subject: "ALL",
            category: "ALL",
            status: "ALL",
        });
    };

    return (
        <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari judul materi, kata kunci teori, atau konsep..."
                        value={filters.search}
                        onChange={(e) =>
                            onFilterChange({ ...filters, search: e.target.value })
                        }
                        className="pl-9 h-10 text-xs rounded-xl bg-background"
                    />
                </div>

                {/* Filter Selects */}
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    {/* Subject Filter */}
                    <select
                        value={filters.subject}
                        onChange={(e) =>
                            onFilterChange({ ...filters, subject: e.target.value })
                        }
                        className="h-10 rounded-xl border border-input bg-background px-3 font-medium text-xs text-foreground focus:outline-hidden"
                    >
                        <option value="ALL">Semua Mata Pelajaran</option>
                        {subjectList.map((subName) => (
                            <option key={subName} value={subName}>
                                {subName}
                            </option>
                        ))}
                    </select>

                    {/* Category Filter */}
                    <select
                        value={filters.category}
                        onChange={(e) =>
                            onFilterChange({ ...filters, category: e.target.value })
                        }
                        className="h-10 rounded-xl border border-input bg-background px-3 font-medium text-xs text-foreground focus:outline-hidden"
                    >
                        <option value="ALL">Semua Kategori</option>
                        <option value="TEORI">Rangkuman Teori</option>
                        <option value="STRATEGI">Strategi Belajar</option>
                        <option value="TRIK_CEPAT">Trik Cepat / Formula</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) =>
                            onFilterChange({ ...filters, status: e.target.value })
                        }
                        className="h-10 rounded-xl border border-input bg-background px-3 font-medium text-xs text-foreground focus:outline-hidden"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="PUBLISHED">Terpublikasi</option>
                        <option value="DRAFT">Draf</option>
                        <option value="ARCHIVED">Arsip</option>
                    </select>

                    {/* Reset Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleReset}
                        className="h-10 w-10 shrink-0 rounded-xl"
                        title="Reset Filter"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <div className="text-muted-foreground font-medium">
                    Kelola dan publikasikan modul teori siswa
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenImport}
                        className="rounded-xl gap-1.5 font-semibold text-xs h-9"
                    >
                        <UploadCloud className="h-4 w-4 text-primary" /> Impor Massal
                    </Button>
                    <Button
                        size="sm"
                        onClick={onOpenAuthoring}
                        className="rounded-xl gap-1.5 font-semibold text-xs h-9 shadow-xs"
                    >
                        <Plus className="h-4 w-4" /> Tulis Materi Baru
                    </Button>
                </div>
            </div>
        </div>
    );
}
