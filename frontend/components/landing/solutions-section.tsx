"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Users,
  WifiHigh,
  ChartBar,
  BookOpen,
  Gift,
} from "@phosphor-icons/react";

const solutions = [
  {
    icon: Users,
    title: "Micro-Subscription SaaS",
    desc: "Cuma Rp 10.000/bulan untuk akses penuh Super App. 10-50x lebih hemat dibanding bimbel konvensional (Rp 500rb-2jt/bulan).",
    highlight: true,
  },
  {
    icon: WifiHigh,
    title: "CBT Engine Offline-Resilient",
    desc: "Teknologi local-first menjamin jawaban ujian tersimpan aman di browser bahkan saat koneksi internet terputus.",
  },
  {
    icon: ChartBar,
    title: "Analitik Per Bab & Sub-bab",
    desc: "Bukan sekadar skor akhir, kami memberikan peta kelemahan spesifik per bab agar fokus belajar tepat sasaran.",
  },
  {
    icon: BookOpen,
    title: "Bank Soal Terstruktur AI",
    desc: "Otomatisasi AI berbasis data resmi dinas pendidikan untuk metadata bab, tingkat kesukaran, dan pembahasan.",
  },
  {
    icon: Gift,
    title: "Program 500 Beta Testers",
    desc: "Dapatkan fasilitas premium gratis selama 6 bulan penuh khusus untuk 500 pendaftar pertama pada peluncuran MVP.",
    special: true,
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

export default function SolutionsSection() {
  return (
    <section className="py-24 bg-muted/30 border-y" id="solusi">
      <div className="container mx-auto px-4 sm:px-8 max-w-5xl space-y-14">
        <FadeSlide
          delay={0}
          className="text-center space-y-4 max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Super App untuk <span className="text-primary">Semua Kebutuhan</span>{" "}
            Belajar Siswa Indonesia
          </h2>
        </FadeSlide>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {solutions.map((item, i) => (
            <FadeSlide key={item.title} delay={0.06 * i}>
              <Card
                className={`p-6 space-y-4 h-full transition-all duration-300 hover:shadow-md ${
                  item.highlight
                    ? "border-primary/30 bg-primary/[0.04]"
                    : item.special
                      ? "border-warning/30 bg-gradient-to-br from-card via-card to-warning/[0.04]"
                      : ""
                }`}
              >
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                    item.highlight
                      ? "bg-primary text-primary-foreground"
                      : item.special
                        ? "bg-warning text-warning-foreground"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  <item.icon className="h-5 w-5" weight="fill" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Card>
            </FadeSlide>
          ))}
        </div>
      </div>
    </section>
  );
}
