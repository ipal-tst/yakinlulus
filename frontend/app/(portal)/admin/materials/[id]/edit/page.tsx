"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MaterialFormSection } from "@/components/admin/MaterialFormSection";
import { useMaterial, useUpdateMaterial } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditMaterialPage() {
    const params = useParams();
    const router = useRouter();
    const id = String(params.id || "");
    const { data: material, isLoading } = useMaterial(id) as any;
    const updateMaterialMutation = useUpdateMaterial();

    const handleSubmit = async (payload: any) => {
        try {
            await updateMaterialMutation.mutateAsync({ id, data: payload });
            router.push("/admin/materials");
        } catch (err: any) {
            alert("Gagal memperbarui materi: " + (err.message || err));
        }
    };

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">MATERI</Badge>
                        <span className="text-xs text-muted-foreground">Edit modul #{id.slice(0, 8)}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Edit Modul Materi</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Perbarui materi pembelajaran dengan live preview KaTeX & Markdown di sisi kanan.
                    </p>
                </div>

                <Link href="/admin/materials">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Materi
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <Card className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat materi...
                </Card>
            ) : material ? (
                <MaterialFormSection
                    mode="edit"
                    initialData={material}
                    submitLabel="Perbarui Modul"
                    isSubmitting={updateMaterialMutation.isPending}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/admin/materials")}
                />
            ) : (
                <Card className="p-10 text-center space-y-3">
                    <p className="text-sm font-bold">Modul tidak ditemukan</p>
                    <p className="text-xs text-muted-foreground">Modul dengan ID ini tidak dapat dimuat.</p>
                    <Link href="/admin/materials">
                        <Button size="sm" variant="outline" className="text-xs">Kembali ke Materi</Button>
                    </Link>
                </Card>
            )}
        </div>
    );
}
