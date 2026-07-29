"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, HelpCircle, FileText, Shield, AlertTriangle, Play, Loader2, AlertCircle } from "lucide-react";
import { useExam, useStartExamSession } from "@/lib/api";

export default function ExamInfoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: exam, isLoading, error } = useExam(id);
  const startMutation = useStartExamSession(id);
  const [startError, setStartError] = React.useState<string | null>(null);

  const handleStart = async () => {
    setStartError(null);
    try {
      const result = await startMutation.mutateAsync();
      const sessionId = (result as any)?.id || (result as any)?.session_id;
      if (sessionId) {
        router.push(`/exam/${id}`);
      } else {
        router.push(`/exam/${id}`);
      }
    } catch (err: any) {
      setStartError(err.message || "Gagal memulai ujian");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 pb-16">
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">Memuat informasi ujian...</p>
        </Card>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="max-w-3xl mx-auto p-6 pb-16">
        <Card className="border-destructive bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-destructive" />
          <h3 className="font-bold mb-1">Gagal Memuat Ujian</h3>
          <p className="text-sm text-muted-foreground">Data ujian tidak ditemukan</p>
          <Button variant="outline" onClick={() => router.push("/student/exam")} className="mt-4">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali
          </Button>
        </Card>
      </div>
    );
  }

  const e = exam as any;

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6 pb-16">
      <div className="flex items-center gap-4">
        <Link href="/student/exam">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <Badge variant="outline" className="text-xs bg-background">Informasi Ujian</Badge>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{e.title}</h1>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border bg-muted/20 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">Durasi</div>
            <div className="font-bold text-lg">{e.duration_minutes || 120} Menit</div>
          </div>
          <div className="p-4 rounded-xl border bg-muted/20 text-center">
            <HelpCircle className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">Jumlah Soal</div>
            <div className="font-bold text-lg">{e.total_questions || "—"}</div>
          </div>
          <div className="p-4 rounded-xl border bg-muted/20 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">Passing Grade</div>
            <div className="font-bold text-lg">{e.passing_grade ?? "—"}</div>
          </div>
          <div className="p-4 rounded-xl border bg-muted/20 text-center">
            <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">Penilaian</div>
            <div className="font-bold text-lg">IRT</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-amber-50/50 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" /> Aturan & Ketentuan Ujian
          </div>
          <ul className="text-xs text-amber-700 space-y-1.5 ml-5 list-disc">
            <li>Ujian bersifat <strong>online</strong> dan terhubung ke server CBT</li>
            <li>Dilarang membuka tab atau aplikasi lain selama ujian</li>
            <li>Dilarang melakukan kecurangan dalam bentuk apapun</li>
            <li>Waktu akan terus berjalan meskipun koneksi terputus (offline mode)</li>
            <li>Pastikan koneksi internet stabil sebelum memulai</li>
            <li>Setiap pelanggaran akan tercatat dan dapat mengurangi skor</li>
          </ul>
        </div>

        {startError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">{startError}</div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">Dengan memulai, Anda menyetujui aturan dan ketentuan yang berlaku</p>
          <Button
            size="lg"
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="text-xs font-bold shadow-lg shadow-primary/25 min-w-[180px]"
          >
            {startMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memulai...</>
            ) : (
              <><Play className="mr-1.5 h-4 w-4 fill-current" /> Mulai Ujian</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}