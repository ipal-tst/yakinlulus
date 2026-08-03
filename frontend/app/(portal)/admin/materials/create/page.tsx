"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaterialFormSection } from "@/components/admin/MaterialFormSection";
import { useCreateMaterial } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function CreateMaterialPage() {
    const router = useRouter();
    const createMaterialMutation = useCreateMaterial();

    const handleSubmit = async (payload: any) => {
        try {
            await createMaterialMutation.mutateAsync(payload);
            router.push("/admin/materials");
        } catch (err: any) {
            alert("Gagal membuat materi: " + (err.message || err));
        }
    };

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">MATERI</Badge>
                        <span className="text-xs text-muted-foreground">Buat modul baru</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Buat Modul Materi</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Tulis materi pembelajaran dengan live preview KaTeX & Markdown di sisi kanan.
                    </p>
                </div>

                <Link href="/admin/materials">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Materi
                    </Button>
                </Link>
            </div>

            <MaterialFormSection
                mode="create"
                submitLabel="Simpan Modul"
                isSubmitting={createMaterialMutation.isPending}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/materials")}
            />
        </div>
    );
}
