"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Play,
  Search,
  Layers,
  Clock,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
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

  const availableCount = exams.filter((e) => getExamStatus(e.id) === "NOT_STARTED").length;
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

  const statusLabel = (s: string) =>
    s === "COMPLETED" ? "Selesai" : s === "IN_PROGRESS" ? "Berjalan" : "Tersedia";

  return (
    <div className="space-y-6">
      <section>
        <Badge variant="default" className="text-[10px] font-bold">EXAM & TRYOUT HUB</Badge>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-2">Ujian & Tryout</h1>
        <p className="text-xs text-muted-foreground mt-1">Simulasi ujian berstandar nasional dan tryout CBT</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStatus("NOT_STARTED")}
          className="bg-muted/60 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer"
        >
          <Layers className="h-5 w-5 text-primary mb-1.5" />
          <span className="text-xl font-extrabold">{availableCount}</span>
          <span className="text-xs text-muted-foreground">Tersedia</span>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
          className="bg-muted/60 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer"
        >
          <RotateCcw className="h-5 w-5 text-warning mb-1.5" />
          <span className="text-xl font-extrabold">{inProgressCount}</span>
          <span className="text-xs text-muted-foreground">Dikerjakan</span>
        </button>
        <button
          onClick={() => setFilterStatus(filterStatus === "COMPLETED" ? "ALL" : "COMPLETED")}
          className="bg-muted/60 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer"
        >
          <CheckCircle2 className="h-5 w-5 text-success mb-1.5" />
          <span className="text-xl font-extrabold">{completedCount}</span>
          <span className="text-xs text-muted-foreground">Selesai</span>
        </button>
      </section>

      {featuredExam && (featuredStatus === "NOT_STARTED" || featuredStatus === "IN_PROGRESS") && (
        <section className="bg-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-lg shadow-primary/20">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                {featuredStatus === "IN_PROGRESS" ? "Lanjutkan Ujian" : "Ujian Unggulan"}
              </span>
            </div>
            <h2 className="text-lg font-bold mb-1">{featuredExam.title}</h2>
            <p className="text-xs opacity-90 mb-4 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {featuredExam.duration_minutes || 120} Menit · {featuredExam.total_questions || "—"} Soal
            </p>
            <Link
              href={featuredStatus === "IN_PROGRESS" ? `/exam/${featuredExam.id}` : `/student/exam/${featuredExam.id}/info`}
              className="inline-block"
            >
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 text-xs font-bold shadow-sm">
                {featuredStatus === "IN_PROGRESS" ? "Lanjutkan" : "Mulai Ujian"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <FileSpreadsheet className="h-40 w-40" />
          </div>
        </section>
      )}

      {featuredExam && featuredStatus === "COMPLETED" && score !== null && (
        <section className="bg-card rounded-2xl p-6 border border-emerald-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <Badge variant="success" className="text-[10px]">TERAKHIR DIKERJAKAN</Badge>
            <h2 className="text-lg font-bold">{featuredExam.title}</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-success">Skor: {score?.toFixed(1) ?? "—"}</span>
            </div>
          </div>
          {featuredSessionId && (
            <div className="flex flex-wrap gap-2">
              <Link href={`/student/exam/${featuredExam.id}/result`}>
                <Button variant="outline" size="sm" className="text-xs font-bold">Lihat Hasil</Button>
              </Link>
              <Link href={`/student/exam/${featuredExam.id}/discussion`}>
                <Button size="sm" className="text-xs font-bold">Pembahasan Soal</Button>
              </Link>
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-3 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "NOT_STARTED", "IN_PROGRESS", "COMPLETED"].map((s) => (
              <Button
                key={s}
                variant={filterStatus === s ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus(s)}
                className="text-xs h-8"
              >
                {s === "ALL" ? "Semua" : statusLabel(s)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="h-4 w-24 animate-pulse bg-muted rounded-lg" />
                <div className="h-5 w-3/4 animate-pulse bg-muted rounded-lg" />
                <div className="h-3 w-full animate-pulse bg-muted rounded-lg" />
                <div className="h-9 w-full animate-pulse bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam: any) => {
              const status = getExamStatus(exam.id);
              const sessionId = getSessionId(exam.id);
              const s = sessionId ? sessionMap.get(exam.id) : null;
              return (
                <div key={exam.id} className="bg-card rounded-2xl border p-5 flex flex-col justify-between gap-4 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {exam.code || exam.id?.substring(0, 8)}
                      </Badge>
                      <Badge
                        variant={status === "COMPLETED" ? "success" : status === "IN_PROGRESS" ? "warning" : "outline"}
                        className="text-[10px]"
                      >
                        {statusLabel(status).toUpperCase()}
                      </Badge>
                    </div>
                    <h4 className="font-extrabold text-sm leading-snug">{exam.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{exam.description || ""}</p>
                  </div>

                  <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durasi</span>
                      <span className="font-bold">{exam.duration_minutes || 120} Menit</span>
                    </div>
                    {s?.score !== null && s?.score !== undefined && (
                      <div className="flex justify-between pt-1 border-t border-border">
                        <span className="text-muted-foreground">Skor</span>
                        <span className="font-bold text-primary">{s!.score!.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border flex gap-2">
                    {status === "NOT_STARTED" && (
                      <Link href={`/student/exam/${exam.id}/info`} className="w-full">
                        <Button size="sm" className="w-full text-xs font-bold">Mulai <Play className="ml-1.5 h-3.5 w-3.5 fill-current" /></Button>
                      </Link>
                    )}
                    {status === "IN_PROGRESS" && (
                      <Link href={`/exam/${exam.id}`} className="w-full">
                        <Button size="sm" variant="warning" className="w-full text-xs font-bold">Lanjutkan</Button>
                      </Link>
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-dashed p-10 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h4 className="font-bold text-base">Belum Ada Paket Ujian</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Administrator dapat membuat paket ujian melalui Dashboard Admin
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
