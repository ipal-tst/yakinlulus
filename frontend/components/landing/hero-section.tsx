"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkle, RocketLaunch, CheckCircle } from "@phosphor-icons/react";

const items = [
  { icon: CheckCircle, text: "10-50x Lebih Hemat dibanding Bimbel" },
  { icon: CheckCircle, text: "Offline-Resilient CBT Architecture" },
  { icon: CheckCircle, text: "Bank Soal Kurikulum Dinas Pendidikan" },
];

function FadeSlide({
  children,
  className,
  delay = 0,
  y = 32,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
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
        transform: show ? "translateY(0)" : `translateY(${y}px)`,
        transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative pt-20 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 sm:px-8 max-w-5xl text-center space-y-8">
        <FadeSlide
          delay={0}
          y={32}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary"
        >
          <Sparkle className="h-3.5 w-3.5" weight="fill" />
          Micro-Subscription SaaS - Cuma Rp 10.000 / bulan
        </FadeSlide>

        <FadeSlide
          delay={0.1}
          y={32}
          className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto"
        >
          <h1>
            Pendidikan Berkualitas untuk Semua Siswa, Cuma{" "}
            <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              Rp 10.000/Bulan
            </span>
          </h1>
        </FadeSlide>

        <FadeSlide
          delay={0.2}
          y={24}
          className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
        >
          <p>
            Buka akses 100K+ Bank Soal Terstruktur AI, CBT Engine
            Offline-Resilient, dan Materi Interaktif untuk SD, SMP, SMA &
            Persiapan UTBK.
          </p>
        </FadeSlide>

        <FadeSlide
          delay={0.3}
          y={24}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 font-bold h-12 text-sm shadow-xl shadow-primary/25 cursor-pointer active:scale-[0.98] transition-transform"
              >
                Klaim Gratis 6 Bulan (Beta Tester){" "}
                <RocketLaunch className="ml-2 h-4 w-4" weight="fill" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 text-sm cursor-pointer active:scale-[0.98] transition-transform"
              >
                Coba Demo Dashboard
              </Button>
            </Link>
          </div>
        </FadeSlide>

        <FadeSlide
          delay={0.4}
          y={20}
          className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground"
        >
          {items.map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-success" weight="fill" />
              {item.text}
            </div>
          ))}
        </FadeSlide>
      </div>
    </section>
  );
}
