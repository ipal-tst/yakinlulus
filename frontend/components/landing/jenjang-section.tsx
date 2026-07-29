"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

const jenjang = [
  {
    label: "SD (KELAS 4 - 6)",
    title: "Sekolah Dasar",
    desc: "Pondasi dasar matematika & literasi sains interaktif.",
  },
  {
    label: "SMP (KELAS 7 - 9)",
    title: "Sekolah Menengah",
    desc: "Latihan soal ujian sekolah & asesmen nasional.",
  },
  {
    label: "SMA (KELAS 10 - 12)",
    title: "Sekolah Menengah Atas",
    desc: "Materi kurikulum merdeka & latihan soal adaptif.",
  },
  {
    label: "GAP YEAR / UTBK",
    title: "Persiapan UTBK SNBT",
    desc: "Simulasi CBT IRT 3-PL & AI Tutor 24/7 target PTN.",
    highlight: true,
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
        transform: show ? "translateY(0)" : "translateY(24px)",
        transition:
          "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  );
}

export default function JenjangSection() {
  return (
    <section className="py-24 container mx-auto px-4 sm:px-8 max-w-5xl space-y-14" id="jenjang">
      <FadeSlide
        delay={0}
        className="text-center space-y-3 max-w-xl mx-auto"
      >
        <h2 className="text-3xl font-bold tracking-tight">
          Dirancang untuk Semua Tingkat Pendidikan
        </h2>
      </FadeSlide>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {jenjang.map((item, i) => (
          <FadeSlide key={item.title} delay={0.08 * i}>
            <Card
              className={`p-6 text-center space-y-3 h-full transition-all border ${
                item.highlight
                  ? "border-primary/40 bg-primary/[0.04]"
                  : "hover:border-primary/30"
              }`}
            >
              <span
                className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  item.highlight
                    ? "bg-warning text-warning-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {item.label}
              </span>
              <h3 className="font-bold text-sm">{item.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </Card>
          </FadeSlide>
        ))}
      </div>
    </section>
  );
}
