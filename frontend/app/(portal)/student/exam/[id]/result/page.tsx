"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Award, TrendingUp, TrendingDown, BarChart3, Brain,
  XCircle, Target, Clock,
} from "lucide-react";
import { useExam, apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: exam } = useExam(id);

  const { data: sessions } = useQuery({
    queryKey: ["student", "exam-sessions", id],
    queryFn: () => apiFetch<any[]>("/cbt/sessions"),
  });

  const matchingSession = Array.isArray(sessions)
    ? sessions.find((s: any) => s.exam_id === id || s.exam_content_id === id || s.id === id)
    : null;

  const activeSessionId = matchingSession?.id || (id && id.length > 20 ? id : null);

  const { data: apiResult, isLoading } = useQuery({
    queryKey: ["result", activeSessionId],
    queryFn: () => apiFetch<any>(`/results/${activeSessionId}`),
    enabled: !!activeSessionId,
  });

  const { data: breakdown } = useQuery({
    queryKey: ["result", activeSessionId, "breakdown"],
    queryFn: () => apiFetch<any[]>(`/results/${activeSessionId}/subject-breakdown`),
    enabled: !!activeSessionId,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-32 animate-pulse bg-muted rounded-lg" />
        <div className="bg-card rounded-2xl border p-6 space-y-4">
          <div className="h-6 w-1/2 animate-pulse bg-muted rounded-lg" />
          <div className="h-8 w-2/3 animate-pulse bg-muted rounded-lg" />
          <div className="h-4 w-full animate-pulse bg-muted rounded-lg" />
          <div className="h-2 w-full animate-pulse bg-muted rounded-full" />
        </div>
        <div className="bg-card rounded-2xl border p-6">
          <div className="h-5 w-48 animate-pulse bg-muted rounded-lg mb-4" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // No fabricated demo result: show "belum ada hasil" when the DB has none.
  const result = apiResult;

  const fallbackBreakdown = [] as any[];

  const subjects = (breakdown && breakdown.length > 0) ? breakdown : fallbackBreakdown;
  const totalMaxScore = subjects.reduce((sum: number, s: any) => sum + (s.max_score || 0), 0) || 0;
  const overallPercentage = totalMaxScore > 0 ? ((result?.score || 0) / totalMaxScore) * 100 : 0;
  const isPassed = !!(result && (result.is_passed || (result.score >= (result.passing_grade || 0))));
  const durationMinutes = Math.floor((result?.duration_seconds || 0) / 60);
  const durationSecs = (result?.duration_seconds || 0) % 60;

  if (!result) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/student/exam" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>
        <Card className="p-10 text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Belum ada hasil</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Hasil ujian belum tersedia. Selesaikan ujian terlebih dahulu, lalu cek kembali halaman ini.
          </p>
          <Button onClick={() => router.push("/student/exam")} className="mt-2">Lihat Daftar Ujian</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/student/exam">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={isPassed ? "success" : "destructive"} className="text-xs">
              {isPassed ? "LULUS" : "TIDAK LULUS"}
            </Badge>
            <Badge variant="outline" className="text-xs bg-background">Hasil Ujian</Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">{result.exam_title || (exam as any)?.title || "Hasil Ujian"}</h1>
        </div>
      </div>

      <div className={`bg-card rounded-2xl p-5 md:p-6 shadow-sm ${isPassed ? "border border-emerald-200" : "border border-destructive/30"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isPassed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {isPassed ? <Award className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Skor</div>
                <div className="text-3xl font-black">
                  {(result.score || 0).toFixed(1)} <span className="text-lg font-normal text-muted-foreground">/ {totalMaxScore.toFixed(0)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Persentase</span>
                <span className={`font-bold ${overallPercentage >= 80 ? "text-success" : overallPercentage >= 60 ? "text-warning" : "text-destructive"}`}>
                  {overallPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(100, overallPercentage)} className="h-2 bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="bg-muted/60 rounded-xl p-4 text-center">
              <div className="text-xs text-muted-foreground">Terjawab</div>
              <div className="text-xl font-bold">{result.answered_count || 0} / {result.total_questions || 0}</div>
            </div>
            <div className="bg-muted/60 rounded-xl p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">Benar / Salah</div>
              <div className="flex justify-center gap-3 text-sm">
                <span className="text-success font-bold">{result.correct_count || 0}</span>
                <span className="text-destructive font-bold">{result.wrong_count || 0}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="bg-muted/60 rounded-xl p-4 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Waktu</div>
              <div className="text-lg font-bold">{durationMinutes}:{String(durationSecs).padStart(2, "0")}</div>
            </div>
            <div className="bg-muted/60 rounded-xl p-4 text-center">
              <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Passing Grade</div>
              <div className="text-lg font-bold">{result.passing_grade || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="bg-card rounded-2xl border p-5 md:p-6">
          <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-primary" /> Performa Per Sub-Tes
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Breakdown skor per mata pelajaran</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Sub-Tes</th>
                  <th className="pb-3 font-medium text-center">Soal</th>
                  <th className="pb-3 font-medium text-center">Benar</th>
                  <th className="pb-3 font-medium text-center">Skor</th>
                  <th className="pb-3 font-medium text-center">%</th>
                  <th className="pb-3 font-medium text-center">IRT</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub: any) => {
                  const pct = sub.max_score > 0 ? (sub.score / sub.max_score) * 100 : 0;
                  return (
                    <tr key={sub.subject_id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 font-medium">{sub.subject_name}</td>
                      <td className="py-3 text-center font-mono">{sub.question_count}</td>
                      <td className="py-3 text-center text-success font-bold">{sub.correct_count}</td>
                      <td className="py-3 text-center font-mono font-bold">{sub.score?.toFixed(1)}</td>
                      <td className="py-3 text-center">
                        <Badge variant={pct >= 80 ? "success" : pct >= 60 ? "secondary" : "destructive"} className="font-bold">{pct.toFixed(1)}%</Badge>
                      </td>
                      <td className="py-3 text-center font-mono text-primary">{sub.ability_estimate?.toFixed(2) ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subjects.length > 0 && (
        <div className="bg-primary/5 rounded-2xl border border-primary/30 p-5 md:p-6">
          <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-primary" /> Analisis
          </h2>
          <div className="space-y-3">
            {(() => {
              const sorted = [...subjects].sort((a: any, b: any) => {
                const pA = a.max_score > 0 ? (a.score / a.max_score) * 100 : 0;
                const pB = b.max_score > 0 ? (b.score / b.max_score) * 100 : 0;
                return pA - pB;
              });
              const weakest = sorted[0];
              const strongest = sorted[sorted.length - 1];
              const wPct = weakest?.max_score > 0 ? (weakest.score / weakest.max_score) * 100 : 0;
              const sPct = strongest?.max_score > 0 ? (strongest.score / strongest.max_score) * 100 : 0;

              return (
                <>
                  {weakest && wPct < 60 && (
                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex items-start gap-3">
                      <TrendingDown className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-destructive">Area Lemah: {weakest.subject_name}</div>
                        <div className="text-sm text-muted-foreground">{wPct.toFixed(1)}% — perlu perbaikan intensif</div>
                      </div>
                    </div>
                  )}
                  {strongest && sPct >= 80 && (
                    <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-emerald-700">Area Kuat: {strongest.subject_name}</div>
                        <div className="text-sm text-muted-foreground">{sPct.toFixed(1)}% — pertahankan dengan latihan soal HOTS</div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border bg-card shadow-sm">
        <Link href="/student/exam" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto"><ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali</Button>
        </Link>
        {activeSessionId && (
          <Link href={`/student/exam/${id}/discussion`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Lihat Pembahasan Soal</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
