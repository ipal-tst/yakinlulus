"use client";

import { useEffect, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

const faqs = [
  {
    q: "Mengapa biaya langganan hanya Rp 10.000 / bulan?",
    a: "Kami menggunakan model SaaS Micro-Subscription agar pendidikan berkualitas tinggi terjangkau oleh seluruh siswa dari kota hingga daerah tanpa kendala finansial.",
  },
  {
    q: "Bagaimana cara kerja CBT Engine Offline-Resilient?",
    a: "Platform kami menerapkan local-first architecture yang menyimpan state jawaban secara aman di memori lokal browser. Jika koneksi internet terputus saat ujian, data tidak hilang dan akan sinkron otomatis saat koneksi kembali.",
  },
  {
    q: "Siapa saja yang berhak mendapatkan Gratis 6 Bulan Beta Tester?",
    a: "500 siswa pendaftar pertama pada peluncuran MVP akan mendapatkan akses gratis 6 bulan penuh untuk seluruh materi, CBT, dan AI Tutor.",
  },
  {
    q: "Apakah platform ini bisa digunakan di daerah dengan internet lambat?",
    a: "Ya, dengan arsitektur local-first, sebagian besar fitur tetap berfungsi tanpa koneksi internet. Progres belajar dan jawaban ujian disimpan di browser dan sinkron saat koneksi tersedia.",
  },
  {
    q: "Fitur apa saja yang didukung AI Tutor?",
    a: "AI Tutor dapat menjawab pertanyaan seputar materi, memberikan pembahasan soal, merekomendasikan topik yang perlu dipelajari ulang, dan menyesuaikan tingkat kesukaran soal berdasarkan performa siswa.",
  },
];

function FadeSlide({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(16px)",
        transition:
          "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  );
}

export default function FaqSection() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section className="py-24 container mx-auto px-4 sm:px-8 max-w-3xl space-y-10" id="faq">
      <FadeSlide delay={0} className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Pertanyaan Populer
        </h2>
        <p className="text-xs text-muted-foreground">
          Jawaban cepat seputar platform YakinLulus.id
        </p>
      </FadeSlide>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <FadeSlide key={idx} delay={0.05 * idx}>
            <div className="rounded-xl border bg-card overflow-hidden transition-all duration-200">
              <button
                onClick={() => setOpen(open === idx ? -1 : idx)}
                className="flex items-center justify-between w-full text-left font-semibold text-sm p-5 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <span>{faq.q}</span>
                <CaretDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                    open === idx ? "rotate-180 text-primary" : "text-muted-foreground"
                  }`}
                  weight="bold"
                />
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  open === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          </FadeSlide>
        ))}
      </div>
    </section>
  );
}
