// src/lib/school-form-values.ts
import type { InstitutionType, SchoolStatus } from "@/services/school.service";

export interface SchoolFormValues {
    school_name: string;
    npsn?: string;
    institution_type: InstitutionType;
    education_level?: string;
    school_status: SchoolStatus;
    yayasan_name?: string;
    province?: string;
    city?: string;
    district?: string;
    village?: string;
    address?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    curriculum_code?: string;
    is_active: boolean;
}

export const SCHOOL_LEVELS = ["SD", "SMP", "SMA", "SMK", "UNIVERSITY"] as const;

export function levelLabel(level?: string): string {
    if (!level) return "-";
    switch (level) {
        case "UNIVERSITY":
            return "Perguruan Tinggi";
        default:
            return level;
    }
}
