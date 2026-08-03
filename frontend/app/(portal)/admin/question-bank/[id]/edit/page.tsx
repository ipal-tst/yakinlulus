"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionFormSection } from "@/components/admin/QuestionFormSection";
import { useQuestion, useUpdateQuestion } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditQuestionPage() {
    const params = useParams();
    const router = useRouter();
    const id = String(params.id || "");
    const { data: question, isLoading } = useQuestion(id) as any;
    const updateQuestionMutation = useUpdateQuestion();

    const handleSubmit = async (payload: any) => {
        try {
            await updateQuestionMutation.mutateAsync({ id, data: payload });
            router.push("/admin/question-bank");
        } catch (err: any) {
            alert("Gagal memperbarui soal: " + (err.message || err));
        }
    };

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">BANK SOAL</Badge>
                        <span className="text-xs text-muted-foreground">Edit soal #{id.slice(0, 8)}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Edit Soal</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Perbarui detail soal dengan live preview KaTeX di sisi kanan.
                    </p>
                </div>

                <Link href="/admin/question-bank">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Bank Soal
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <Card className="p-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat soal...
                </Card>
            ) : question ? (
                <QuestionFormSection
                    mode="edit"
                    initialData={question}
                    submitLabel="Perbarui Soal"
                    isSubmitting={updateQuestionMutation.isPending}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/admin/question-bank")}
                />
            ) : (
                <Card className="p-10 text-center space-y-3">
                    <p className="text-sm font-bold">Soal tidak ditemukan</p>
                    <p className="text-xs text-muted-foreground">Soal dengan ID ini tidak dapat dimuat.</p>
                    <Link href="/admin/question-bank">
                        <Button size="sm" variant="outline" className="text-xs">Kembali ke Bank Soal</Button>
                    </Link>
                </Card>
            )}
        </div>
    );
}
