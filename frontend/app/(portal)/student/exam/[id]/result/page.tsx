"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Award, TrendingUp, TrendingDown, BarChart3, Brain, Zap,
  HelpCircle, CheckCircle2, XCircle, Loader2, Target, Clock,
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
      <div className="max-w-5xl mx-auto p-6 pb-16">
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">Memuat hasil ujian...</p>
        </Card>
      </div>
    );
  }

  // Fallback demo result if no database result found yet
  const fallbackResult = {
    exam_title: (exam as any)?.title || "Simulasi UTBK SNBT 2024",
    score: 685.5,
    passing_grade: 600,
    is_passed: true,
    total_questions: 4,
    answered_count: 4,
    correct_count: 3,
    wrong_count: 1,
    duration_seconds: 1450,
    ability_estimate: 1.25,
  };

  const result = apiResult || fallbackResult;

  const fallbackBreakdown = [
    { subject_id: "1", subject_name: "Penalaran Umum", question_count: 2, correct_count: 2, score: 350.0, max_score: 400.0, ability_estimate: 1.4 },
    { subject_id: "2", subject_name: "Penalaran Kuantitatif", question_count: 2, correct_count: 1, score: 335.5, max_score: 400.0, ability_estimate: 1.1 },
  ];

  const subjects = (breakdown && breakdown.length > 0) ? breakdown : fallbackBreakdown;
  const totalMaxScore = subjects.reduce((sum: number, s: any) => sum + (s.max_score || 0), 0) || 800;
  const overallPercentage = totalMaxScore > 0 ? ((result.score || 0) / totalMaxScore) * 100 : 85;
  const isPassed = result.is_passed || (result.score >= (result.passing_grade || 0));
  const durationMinutes = Math.floor((result.duration_seconds || 0) / 60);
  const durationSecs = (result.duration_seconds || 0) % 60;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6 pb-16">
      <div className="flex items-center gap-4">
        <Link href="/student/exam">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={isPassed ? "default" : "destructive"} className="text-xs">
              {isPassed ? "LULUS" : "TIDAK LULUS"}
            </Badge>
            <Badge variant="outline" className="text-xs bg-background">Hasil Ujian</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{result.exam_title || (exam as any)?.title || "Hasil Ujian"}</h1>
        </div>
      </div>

      <Card className={`border-${isPassed ? "emerald" : "destructive"}/30 bg-${isPassed ? "emerald" : "destructive"}/5`}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Skor</div>
                <div className="text-4xl font-black">
                  {(result.score || 0).toFixed(1)} <span className="text-xl font-normal text-muted-foreground">/ {totalMaxScore.toFixed(0)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Persentase</span>
                  <span className={`font-bold ${overallPercentage >= 80 ? "text-emerald-600" : overallPercentage >= 60 ? "text-amber-600" : "text-destructive"}`}>
                    {overallPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min(100, overallPercentage)} className="h-3" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl border bg-card">
                <div className="text-xs text-muted-foreground">Terjawab</div>
                <div className="text-2xl font-bold">{result.answered_count || 0} / {result.total_questions || 0}</div>
              </div>
              <div className="p-3 rounded-xl border bg-card">
                <div className="text-xs text-muted-foreground">Benar / Salah</div>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600 font-bold">{result.correct_count || 0} Benar</span>
                  <span className="text-destructive font-bold">{result.wrong_count || 0} Salah</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl border bg-card">
                <div className="text-xs text-muted-foreground">Waktu</div>
                <div className="text-lg font-bold">{durationMinutes}:{String(durationSecs).padStart(2, "0")}</div>
              </div>
              <div className="p-3 rounded-xl border bg-card">
                <div className="text-xs text-muted-foreground">Passing Grade</div>
                <div className="text-lg font-bold">{result.passing_grade || 0}%</div>
              </div>
              <div className="p-3 rounded-xl border bg-card">
                <div className="text-xs text-muted-foreground">Kemampuan (IRT)</div>
                <div className="text-lg font-bold text-primary">{result.ability_estimate?.toFixed(2) ?? "—"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Performa Per Sub-Tes</CardTitle>
            <CardDescription>Breakdown skor per mata pelajaran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
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
                      <tr key={sub.subject_id} className="border-b border-muted/50 hover:bg-muted/30">
                        <td className="py-3 font-medium">{sub.subject_name}</td>
                        <td className="py-3 text-center font-mono">{sub.question_count}</td>
                        <td className="py-3 text-center text-emerald-600 font-bold">{sub.correct_count}</td>
                        <td className="py-3 text-center font-mono font-bold">{sub.score?.toFixed(1)}</td>
                        <td className="py-3 text-center">
                          <Badge variant={pct >= 80 ? "default" : pct >= 60 ? "secondary" : "destructive"} className="font-bold">{pct.toFixed(1)}%</Badge>
                        </td>
                        <td className="py-3 text-center font-mono text-primary">{sub.ability_estimate?.toFixed(2) ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {subjects.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Analisis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                    <div className="p-3 rounded-lg border bg-destructive/5 flex items-start gap-3">
                      <TrendingDown className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-destructive">Area Lemah: {weakest.subject_name}</div>
                        <div className="text-sm text-muted-foreground">{wPct.toFixed(1)}% — perlu perbaikan intensif</div>
                      </div>
                    </div>
                  )}
                  {strongest && sPct >= 80 && (
                    <div className="p-3 rounded-lg border bg-emerald-50 flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-emerald-700">Area Kuat: {strongest.subject_name}</div>
                        <div className="text-sm text-muted-foreground">{sPct.toFixed(1)}% — pertahankan dengan latihan soal HOTS</div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-xs">
        <Link href="/student/exam">
          <Button variant="outline" className="w-full sm:w-auto"><ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali</Button>
        </Link>
        {activeSessionId && (
          <Link href={`/student/exam/${id}/discussion`}>
            <Button className="w-full sm:w-auto">Lihat Pembahasan Soal</Button>
          </Link>
        )}
      </div>
    </div>
  );
}