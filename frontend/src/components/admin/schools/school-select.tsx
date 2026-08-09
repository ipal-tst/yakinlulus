// src/components/admin/schools/school-select.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { schoolService, School } from "@/services/school.service";
import { Plus } from "lucide-react";

interface SchoolSelectProps {
    level?: string;
    value?: string;
    onChange: (schoolId: string) => void;
    onCreateSchool: () => void;
    disabled?: boolean;
}

export function SchoolSelect({ level, value, onChange, onCreateSchool, disabled }: SchoolSelectProps) {
    const [open, setOpen] = useState(false);
    const [schools, setSchools] = useState<School[]>([]);
    const reloadedFor = useRef<string | undefined>(undefined);

    const load = async () => {
        try {
            const all = await schoolService.listSchools({ limit: 500 });
            setSchools(level ? all.filter((s) => (s.education_level ?? "") === level) : all);
        } catch {
            // biarkan list kosong, empty state akan tampil
        }
    };

    // Setelah create-in-form, hasil sekolah baru belum ada di list -> reload + auto-select.
    useEffect(() => {
        if (value) {
            if (reloadedFor.current !== value && (schools.length === 0 || !schools.some((s) => s.id === value))) {
                reloadedFor.current = value;
                load();
            }
        } else {
            reloadedFor.current = undefined;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, schools.length]);

    return (
        <div className="flex items-end gap-2">
            <Select
                value={value}
                open={open}
                onOpenChange={(o) => {
                    setOpen(o);
                    if (o) load();
                }}
                onValueChange={(v) => {
                    if (v) onChange(v);
                }}
            >
                <SelectTrigger disabled={disabled} className="h-11 w-full">
                    <SelectValue placeholder="Pilih sekolah/PT dari katalog" />
                </SelectTrigger>
                <SelectContent>
                    {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                            {s.name}
                            {s.province ? ` — ${s.province}` : ""}
                        </SelectItem>
                    ))}
                    {schools.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                            Tidak ada sekolah tersedia. Klik tombol &quot;+ Baru&quot; untuk membuatnya.
                        </div>
                    )}
                </SelectContent>
            </Select>
            <Button
                type="button"
                variant="outline"
                size="icon"
                title="Buat sekolah/PT baru di katalog"
                onClick={onCreateSchool}
                disabled={disabled}
                className="h-11 w-11 shrink-0"
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}