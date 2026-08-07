// src/app/(staff)/staff/ai/page.tsx
"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/admin/page-header";
import { AiConfigForm } from "@/components/admin/ai/AiConfigForm";

export default function StaffAiPage() {
    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    title="Konfigurasi AI Tutor"
                    description="Kelola model AI, batasan token, dan uji koneksi endpoint OpenAI/AI Tutor untuk layanan AI Tutor otomatis di platform."
                />
                <AiConfigForm />
            </div>
        </AppShell>
    );
}