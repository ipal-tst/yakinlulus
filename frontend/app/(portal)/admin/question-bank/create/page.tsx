"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionFormSection } from "@/components/admin/QuestionFormSection";
import { useCreateQuestion } from "@/lib/api";
import { ArrowLeft, Plus } from "lucide-react";

export default function CreateQuestionPage() {
    const router = useRouter();
    const createQuestionMutation = useCreateQuestion();

    const handleSubmit = async (payload: any) => {
        try {
            await createQuestionMutation.mutateAsync(payload);
            router.push("/admin/question-bank");
        } catch (err: any) {
            alert("Gagal membuat soal: " + (err.message || err));
        }
    };

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">BANK SOAL</Badge>
                        <span className="text-xs text-muted-foreground">Buat soal baru</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Buat Soal Baru</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Isi detail soal dengan live preview KaTeX di sisi kanan.
                    </p>
                </div>

                <Link href="/admin/question-bank">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Bank Soal
                    </Button>
                </Link>
            </div>

            <QuestionFormSection
                mode="create"
                submitLabel="Simpan Soal"
                isSubmitting={createQuestionMutation.isPending}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/admin/question-bank")}
            />
        </div>
    );
}
