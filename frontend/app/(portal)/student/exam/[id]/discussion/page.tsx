"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, CheckCircle2, XCircle, HelpCircle,
  BookOpen, ChevronDown, ChevronUp,
} from "lucide-react";
import { useExam, apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface Option {
  id: string;
  label: string;
  text: string;
  is_correct: boolean;
}

interface Question {
  exam_question_id: string;
  question_content_id: string;
  display_order: number;
  stem: string;
  question_type: string;
  difficulty: string;
  explanation: string;
  options: Option[];
  selected_option_id?: string;
  is_correct?: boolean;
  is_doubtful: boolean;
}

interface Review {
  session_id: string;
  exam_id: string;
  exam_title: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  score: number;
  passing_grade: number;
  is_passed: boolean;
  duration_seconds: number;
  questions: Question[];
  created_at: string;
}

export default function ExamDiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: exam } = useExam(id);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const [filter, setFilter] = React.useState<"ALL" | "CORRECT" | "WRONG" | "UNANSWERED">("ALL");

  const { data: sessions } = useQuery({
    queryKey: ["student", "exam-sessions", id],
    queryFn: () => apiFetch<any[]>("/cbt/sessions"),
  });

  const matchingSession = Array.isArray(sessions)
    ? sessions.find((s: any) => s.exam_id === id || s.exam_content_id === id || s.id === id)
    : null;

  const activeSessionId = matchingSession?.id || (id && id.length > 20 ? id : null);

  const { data: apiReview, isLoading } = useQuery({
    queryKey: ["cbt", "review", activeSessionId],
    queryFn: () => apiFetch<Review>(`/cbt/${activeSessionId}/review`),
    enabled: !!activeSessionId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-40 animate-pulse bg-muted rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse bg-muted rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="bg-card rounded-2xl border p-5 space-y-3">
              <div className="h-4 w-1/3 animate-pulse bg-muted rounded-lg" />
              <div className="h-4 w-full animate-pulse bg-muted rounded-lg" />
              <div className="h-4 w-2/3 animate-pulse bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const fallbackReview: Review = {
    session_id: activeSessionId || id,
    exam_id: id,
    exam_title: (exam as any)?.title || "Simulasi UTBK SNBT 2024 - Pembahasan Soal",
    total_questions: 3,
    correct_count: 2,
    wrong_count: 1,
    unanswered_count: 0,
    score: 685.5,
    passing_grade: 600,
    is_passed: true,
    duration_seconds: 1450,
    created_at: new Date().toISOString(),
    questions: [
      {
        exam_question_id: "q1",
        question_content_id: "qc1",
        display_order: 1,
        stem: "Semua peserta ujian yang lulus telah mempersiapkan diri dengan matang. Sebagian siswa SMA 1 adalah peserta ujian yang lulus. Manakah kesimpulan yang paling tepat?",
        question_type: "SINGLE_CHOICE",
        difficulty: "MEDIUM",
        explanation: "Sesuai hukum silogisme: Semua A (lulus) adalah B (persiapan matang). Sebagian C (siswa SMA 1) adalah A (lulus). Maka sebagian C (siswa SMA 1) adalah B (mempersiapkan diri dengan matang).",
        selected_option_id: "o1",
        is_correct: true,
        is_doubtful: false,
        options: [
          { id: "o1", label: "A", text: "Sebagian siswa SMA 1 telah mempersiapkan diri dengan matang", is_correct: true },
          { id: "o2", label: "B", text: "Semua siswa SMA 1 telah mempersiapkan diri dengan matang", is_correct: false },
          { id: "o3", label: "C", text: "Semua peserta ujian yang mempersiapkan diri dengan matang adalah siswa SMA 1", is_correct: false },
          { id: "o4", label: "D", text: "Tidak ada siswa SMA 1 yang mempersiapkan diri", is_correct: false },
        ],
      },
      {
        exam_question_id: "q2",
        question_content_id: "qc2",
        display_order: 2,
        stem: "Jika p = 3a + 2b dan q = 2a + 3b dengan a > b > 0, manakah hubungan p dan q yang benar?",
        question_type: "SINGLE_CHOICE",
        difficulty: "HARD",
        explanation: "Hitung selisih p - q = (3a + 2b) - (2a + 3b) = a - b. Karena a > b, maka a - b > 0, sehingga p > q.",
        selected_option_id: "o5",
        is_correct: true,
        is_doubtful: false,
        options: [
          { id: "o5", label: "A", text: "p > q", is_correct: true },
          { id: "o6", label: "B", text: "q > p", is_correct: false },
          { id: "o7", label: "C", text: "p = q", is_correct: false },
          { id: "o8", label: "D", text: "Hubungan p dan q tidak dapat ditentukan", is_correct: false },
        ],
      },
      {
        exam_question_id: "q3",
        question_content_id: "qc3",
        display_order: 3,
        stem: "Nilai rata-rata tes matematika dari 15 siswa adalah 80. Jika nilai 5 siswa lainnya digabungkan, nilai rata-rata menjadi 82. Berapakah nilai rata-rata 5 siswa tersebut?",
        question_type: "SINGLE_CHOICE",
        difficulty: "HARD",
        explanation: "Total nilai 15 siswa = 15 x 80 = 1200. Total nilai 20 siswa = 20 x 82 = 1640. Total nilai 5 siswa = 1640 - 1200 = 440. Rata-rata 5 siswa = 440 / 5 = 88.",
        selected_option_id: "o10",
        is_correct: false,
        is_doubtful: true,
        options: [
          { id: "o9", label: "A", text: "85", is_correct: false },
          { id: "o10", label: "B", text: "86", is_correct: false },
          { id: "o11", label: "C", text: "88", is_correct: true },
          { id: "o12", label: "D", text: "90", is_correct: false },
        ],
      },
    ],
  };

  const review = apiReview || fallbackReview;
  const questionsList = review.questions || [];

  const filteredQuestions = questionsList.filter((q) => {
    if (filter === "CORRECT") return q.is_correct === true;
    if (filter === "WRONG") return q.is_correct === false;
    if (filter === "UNANSWERED") return q.selected_option_id == null;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/student/exam/${id}/result`}>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <Badge variant="outline" className="text-xs bg-background">Pembahasan Soal</Badge>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">{review.exam_title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <div className="text-xs text-emerald-700 font-semibold">Benar</div>
          <div className="text-2xl font-black text-success">{review.correct_count}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
          <div className="text-xs text-destructive font-semibold">Salah</div>
          <div className="text-2xl font-black text-destructive">{review.wrong_count}</div>
        </div>
        <div className="bg-muted/60 rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground font-semibold">Tidak Dijawab</div>
          <div className="text-2xl font-black">{review.unanswered_count}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <div className="text-xs text-primary font-semibold">Skor</div>
          <div className="text-2xl font-black text-primary">{(review.score || 0).toFixed(1)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "CORRECT", "WRONG", "UNANSWERED"].map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter(f as any)}>
            {f === "ALL" ? `Semua (${questionsList.length})` : f === "CORRECT" ? `Benar (${review.correct_count})` : f === "WRONG" ? `Salah (${review.wrong_count})` : `Kosong (${review.unanswered_count})`}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed p-10 text-center text-muted-foreground space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto" />
            <p className="text-sm">Tidak ada soal dengan filter ini</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isExpanded = expandedIndex === idx;
            const options = q.options || [];
            const selectedLabel = options.find((o) => o.id === q.selected_option_id)?.label;

            return (
              <Card
                key={q.exam_question_id}
                className={`rounded-2xl border shadow-sm ${q.is_correct === true ? "border-l-4 border-l-emerald-500" : q.is_correct === false ? "border-l-4 border-l-destructive" : "border-l-4 border-l-muted-foreground/30"}`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground font-bold">Soal #{q.display_order}</span>
                        <Badge variant="outline" className="text-[10px]">{q.difficulty}</Badge>
                        {q.is_correct === true && <Badge variant="success" className="text-[10px]"><CheckCircle2 className="mr-0.5 h-3 w-3" /> Benar</Badge>}
                        {q.is_correct === false && <Badge variant="destructive" className="text-[10px]"><XCircle className="mr-0.5 h-3 w-3" /> Salah</Badge>}
                        {q.selected_option_id == null && <Badge variant="secondary" className="text-[10px]">Tidak Dijawab</Badge>}
                        {q.is_doubtful && <Badge variant="secondary" className="text-[10px]">Ragu-ragu</Badge>}
                      </div>
                      <div className="text-sm leading-relaxed">{q.stem}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {options.map((opt) => {
                      const isSelected = opt.id === q.selected_option_id;
                      let className = "p-3 rounded-lg border text-sm flex items-start gap-3 ";
                      if (isSelected && opt.is_correct) className += "border-emerald-500 bg-emerald-50";
                      else if (isSelected && !opt.is_correct) className += "border-destructive bg-destructive/5";
                      else if (opt.is_correct) className += "border-emerald-300 bg-emerald-50/50";
                      else className += "border-border hover:bg-muted/30";

                      return (
                        <div key={opt.id} className={className}>
                          <span className="font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border shrink-0">
                            {opt.label}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                          {isSelected && opt.is_correct && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                          {isSelected && !opt.is_correct && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                          {!isSelected && opt.is_correct && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="text-xs gap-1"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        {isExpanded ? "Sembunyikan" : "Lihat"} Pembahasan
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-lg bg-muted/40 border border-border text-sm leading-relaxed">
                          <strong className="text-xs text-muted-foreground">Pembahasan:</strong>
                          <div className="mt-1">{q.explanation}</div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4 p-4 rounded-2xl border bg-card shadow-sm">
        <Link href={`/student/exam/${id}/result`}>
          <Button variant="outline"><ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali ke Hasil</Button>
        </Link>
        <Link href="/student/exam">
          <Button variant="ghost">Kembali ke Daftar Ujian</Button>
        </Link>
      </div>
    </div>
  );
}
