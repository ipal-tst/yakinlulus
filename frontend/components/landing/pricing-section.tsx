"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "@phosphor-icons/react";

const plans = [
  {
    badge: "BETA TESTERS (500 KUOTA)",
    badgeVariant: "warning" as const,
    title: "Gratis 6 Bulan",
    price: "Rp 0",
    period: "/6 bulan",
    features: [
      "Akses Penuh Semua Fitur Super App",
      "CBT Engine Offline-Resilient",
      "AI Tutor 24/7 Unlimited",
    ],
    cta: "Klaim 500 Kuota Beta",
    highlight: false,
    special: true,
  },
  {
    badge: "MICRO-SUBSCRIPTION",
    badgeVariant: "default" as const,
    title: "Paket Siswa Bulanan",
    price: "Rp 10.000",
    period: "/bulan",
    features: [
      "100K+ Bank Soal Kurikulum Resmi",
      "Modul Video HD & KaTeX PDF",
      "Simulasi CBT Standar IRT 3-PL",
      "Analitik Kelemahan Per Bab",
    ],
    cta: "Mulai Langganan Rp 10rb",
    highlight: true,
    special: false,
  },
  {
    badge: "SEKOLAH & MITRA",
    badgeVariant: "outline" as const,
    title: "Lisensi Sekolah",
    price: "Custom",
    period: "/tahun",
    features: [
      "Dashboard Guru & Sekolah",
      "Manajemen Kuota Masif Siswa",
      "Bank Soal Custom Institusi",
    ],
    cta: "Hubungi Tim Sales",
    highlight: false,
    special: false,
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

export default function PricingSection() {
  return (
    <section className="py-24 bg-muted/30 border-y" id="harga">
      <div className="container mx-auto px-4 sm:px-8 max-w-5xl space-y-14">
        <FadeSlide
          delay={0}
          className="text-center space-y-3 max-w-xl mx-auto"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Investasi Belajar Paling Terjangkau
          </h2>
          <p className="text-sm text-muted-foreground">
            Model Micro-Subscription mulai Rp 10.000/bulan
          </p>
        </FadeSlide>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <FadeSlide key={plan.title} delay={0.08 * i}>
              <Card
                className={`p-6 flex flex-col justify-between h-full space-y-6 relative ${
                  plan.highlight
                    ? "border-primary shadow-xl"
                    : plan.special
                      ? "border-warning/30 bg-warning/[0.03]"
                      : ""
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap">
                    REKOMENDASI UTAMA
                  </div>
                )}

                <div className="space-y-5">
                  <span
                    className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      plan.special
                        ? "bg-warning text-warning-foreground"
                        : plan.highlight
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-foreground"
                    }`}
                  >
                    {plan.badge}
                  </span>

                  <h3 className="font-bold text-xl">{plan.title}</h3>

                  <div className="text-3xl font-black">
                    {plan.price}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>

                  {plan.highlight && (
                    <p className="text-[11px] text-muted-foreground">
                      10-50x lebih hemat dibanding bimbel biasa (Rp 500rb - 2jt/bln).
                    </p>
                  )}

                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle
                          className="h-4 w-4 text-success shrink-0"
                          weight="fill"
                        />
                        <span
                          className={
                            plan.highlight ? "font-medium text-foreground" : ""
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href="/register" className="w-full">
                  <Button
                    variant={
                      plan.highlight
                        ? "default"
                        : plan.special
                          ? "outline"
                          : "outline"
                    }
                    className={`w-full text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform ${
                      plan.special ? "border-warning text-warning-foreground" : ""
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            </FadeSlide>
          ))}
        </div>
      </div>
    </section>
  );
}
