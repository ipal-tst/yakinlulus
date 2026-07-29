"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Play,
  Award,
  Search,
  Layers,
  Clock,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  HelpCircle,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useExams, apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";

interface SessionInfo {
  id: string;
  exam_content_id: string;
  status: string;
  score: number | null;
}

export default function StudentExamPage() {
  const { user } = useAuth();
  const { data: examsData, isLoading } = useExams();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("ALL");

  const { data: sessions } = useQuery({
    queryKey: ["student", "exam-sessions"],
    queryFn: () => apiFetch<SessionInfo[]>("/cbt/sessions?status=all"),
  });

  const exams = ((examsData as any) || []) as any[];
  const sessionMap = React.useMemo(() => {
    const m = new Map<string, SessionInfo>();
    if (sessions) {
      for (const s of sessions) {
        if (!m.has(s.exam_content_id) || s.status === "IN_PROGRESS") {
          m.set(s.exam_content_id, s);
        }
      }
    }
    return m;
  }, [sessions]);

  const getExamStatus = (examId: string): string => {
    const s = sessionMap.get(examId);
    if (!s) return "NOT_STARTED";
    if (s.status === "IN_PROGRESS") return "IN_PROGRESS";
    if (s.status === "COMPLETED" || s.status === "FINISHED") return "COMPLETED";
    return "NOT_STARTED";
  };

  const getSessionId = (examId: string): string | undefined => {
    return sessionMap.get(examId)?.id;
  };

  const availableCount = exams.length;
  const inProgressCount = exams.filter((e) => getExamStatus(e.id) === "IN_PROGRESS").length;
  const completedCount = exams.filter((e) => getExamStatus(e.id) === "COMPLETED").length;

  const filteredExams = React.useMemo(() => {
    return exams.filter((exam) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(exam.title || "").toLowerCase().includes(q) && !(exam.code || "").toLowerCase().includes(q)) return false;
      }
      if (filterStatus !== "ALL") {
        const status = getExamStatus(exam.id);
        if (status !== filterStatus) return false;
      }
      return true;
    });
  }, [exams, searchQuery, filterStatus, sessionMap]);

  const featuredExam = exams.length > 0 ? exams[0] : null;
  const featuredStatus = featuredExam ? getExamStatus(featuredExam.id) : null;
  const featuredSessionId = featuredExam ? getSessionId(featuredExam.id) : null;
  const score = featuredExam && featuredSessionId ? sessionMap.get(featuredExam.id)?.score : null;

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <Badge variant="default" className="text-[10px] font-bold">EXAM & TRYOUT HUB</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Ujian & Tryout</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Simulasi ujian berstandar nasional dan tryout CBT
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-primary/30 bg-primary/5 cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">Tersedia</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black mt-2">{availableCount} Paket</div>
        </Card>

        <Card
          onClick={() => setFilterStatus(filterStatus === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
          className={`p-4 cursor-pointer border ${filterStatus === "IN_PROGRESS" ? "border-amber-500 bg-amber-50" : "hover:border-amber-400"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 font-semibold">Sedang Dikerjakan</span>
            <RotateCcw className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black mt-2">{inProgressCount} Ujian</div>
        </Card>

        <Card
          onClick={() => setFilterStatus(filterStatus === "COMPLETED" ? "ALL" : "COMPLETED")}
          className={`p-4 cursor-pointer border ${filterStatus === "COMPLETED" ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-400"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-semibold">Riwayat Selesai</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black mt-2">{completedCount} Tryout</div>
        </Card>
      </div>

      {featuredExam && (featuredStatus === "NOT_STARTED" || featuredStatus === "IN_PROGRESS") && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 via-card to-indigo-500/10 border-primary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-xl">
            <Badge variant="default" className="text-[10px] bg-rose-600 animate-pulse">
              {featuredStatus === "IN_PROGRESS" ? "BELUM SELESAI" : "SEDANG BERLANGSUNG"}
            </Badge>
            <h2 className="text-xl font-black">{featuredExam.title}</h2>
            <p className="text-xs text-muted-foreground">
              Durasi: {featuredExam.duration_minutes || 120} Menit
            </p>
          </div>
          <Link href={featuredStatus === "IN_PROGRESS" ? `/exam/${featuredExam.id}` : `/student/exam/${featuredExam.id}/info`}>
            <Button size="lg" className="text-xs font-bold shadow-lg shadow-primary/25">
              {featuredStatus === "IN_PROGRESS" ? "Lanjutkan Ujian" : "Mulai Ujian"} <Play className="ml-1.5 h-4 w-4 fill-primary-foreground" />
            </Button>
          </Link>
        </Card>
      )}

      {featuredExam && featuredStatus === "COMPLETED" && score !== null && (
        <Card className="p-6 bg-gradient-to-r from-emerald-500/10 via-card to-teal-500/10 border-emerald-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-xl">
            <Badge variant="default" className="text-[10px] bg-emerald-600">TERAKHIR DIKERJAKAN</Badge>
            <h2 className="text-xl font-black">{featuredExam.title}</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-emerald-600">Skor: {score?.toFixed(1) ?? "—"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {featuredSessionId && (
              <>
                <Link href={`/student/exam/${featuredExam.id}/result`}>
                  <Button variant="outline" size="lg" className="text-xs font-bold">Lihat Hasil</Button>
                </Link>
                <Link href={`/student/exam/${featuredExam.id}/discussion`}>
                  <Button size="lg" className="text-xs font-bold">Pembahasan Soal</Button>
                </Link>
              </>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-3 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "NOT_STARTED", "IN_PROGRESS", "COMPLETED"].map((s) => (
              <Button
                key={s}
                variant={filterStatus === s ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus(s)}
                className="text-xs h-8"
              >
                {s === "ALL" ? "Semua" : s === "NOT_STARTED" ? "Belum" : s === "IN_PROGRESS" ? "Berjalan" : "Selesai"}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari ujian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">Memuat daftar ujian...</div>
        ) : filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam: any) => {
              const status = getExamStatus(exam.id);
              const sessionId = getSessionId(exam.id);
              const s = sessionId ? sessionMap.get(exam.id) : null;
              return (
                <Card key={exam.id} className="p-5 flex flex-col justify-between hover:border-primary/40 transition-all space-y-4 shadow-xs">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {exam.code || exam.id?.substring(0, 8)}
                      </Badge>
                      <Badge
                        variant={status === "COMPLETED" ? "default" : status === "IN_PROGRESS" ? "secondary" : "outline"}
                        className={`text-[10px] ${status === "COMPLETED" ? "bg-emerald-600" : ""}`}
                      >
                        {status === "COMPLETED" ? "SELESAI" : status === "IN_PROGRESS" ? "BERJALAN" : "TERSEDIA"}
                      </Badge>
                    </div>
                    <h4 className="font-extrabold text-sm leading-snug">{exam.title}</h4>
                    <p className="text-xs text-muted-foreground">{exam.description || ""}</p>
                  </div>

                  <div className="p-3 rounded-xl border bg-muted/20 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durasi</span>
                      <span className="font-bold">{exam.duration_minutes || 120} Menit</span>
                    </div>
                    {s?.score !== null && s?.score !== undefined && (
                      <div className="flex justify-between pt-1 border-t">
                        <span className="text-muted-foreground">Skor</span>
                        <span className="font-bold text-primary">{s!.score!.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t flex gap-2">
                    {status === "NOT_STARTED" && (
                      <Link href={`/student/exam/${exam.id}/info`} className="w-full">
                        <Button size="sm" className="w-full text-xs font-bold">Mulai <Play className="ml-1.5 h-3.5 w-3.5 fill-current" /></Button>
                      </Link>
                    )}
                    {status === "IN_PROGRESS" && (
                      <>
                        <Link href={`/exam/${exam.id}`} className="flex-1">
                          <Button size="sm" variant="warning" className="w-full text-xs font-bold">Lanjutkan</Button>
                        </Link>
                      </>
                    )}
                    {status === "COMPLETED" && sessionId && (
                      <>
                        <Link href={`/student/exam/${exam.id}/result`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full text-xs font-bold">Hasil</Button>
                        </Link>
                        <Link href={`/student/exam/${exam.id}/discussion`} className="flex-1">
                          <Button size="sm" className="w-full text-xs font-bold">Pembahasan</Button>
                        </Link>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center space-y-3 bg-muted/10 border-dashed">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h4 className="font-bold text-base">Belum Ada Paket Ujian</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Administrator dapat membuat paket ujian melalui Dashboard Admin
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}