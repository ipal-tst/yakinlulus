// src/components/admin/users/UserRoleBadge.tsx
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/admin";

const roleVariant: Record<UserRole, "default" | "secondary" | "warning" | "destructive" | "outline"> = {
    SUPER_ADMIN: "destructive",
    STAFF: "warning",
    GURU: "secondary",
    FINANCE: "default",
    SISWA: "outline",
    SUPER_SISWA: "outline",
    INVESTOR: "default",
};

export function UserRoleBadge({ role }: { role: UserRole }) {
    return <Badge variant={roleVariant[role] ?? "outline"}>{role}</Badge>;
}