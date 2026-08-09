"use client";

import { useRouter } from "next/navigation";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { dashboardHref } from "@/config/admin-nav";
import { useAuthStore } from "@/stores/auth.store";

interface PagePlaceholderProps {
    title: string;
    description: string;
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    return (
        <EmptyState
            icon={Construction}
            title={title}
            description={description}
            actionLabel="Kembali ke dashboard"
            onAction={() => router.push(dashboardHref(user?.role || "SISWA"))}
            className="my-4"
        />
    );
}