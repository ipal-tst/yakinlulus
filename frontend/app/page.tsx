"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";
import { Sun, Moon, RocketLaunch, List, X } from "@phosphor-icons/react";
import HeroSection from "@/components/landing/hero-section";
import SolutionsSection from "@/components/landing/solutions-section";
import JenjangSection from "@/components/landing/jenjang-section";
import PricingSection from "@/components/landing/pricing-section";
import FaqSection from "@/components/landing/faq-section";

const NAV_LINKS = [
  { href: "#solusi", label: "Solusi" },
  { href: "#jenjang", label: "Jenjang" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Top Announcement Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-[11px] sm:text-xs font-medium flex items-center justify-center gap-2">
        <span className="leading-tight">Promo Beta Testers: Gratis 6 Bulan Pertama untuk 500 Siswa Pendaftar Pertama!</span>
        <Link href="/register" className="underline hover:opacity-90 font-bold whitespace-nowrap">
          Klaim Kuota Sekarang
        </Link>
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-lg shadow-md group-hover:scale-105 transition-transform">
              YL
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight">{APP_CONFIG.name}</span>
              <span className="text-[10px] text-muted-foreground block font-medium">Super App EdTech</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-primary transition-colors">{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-full"
              aria-label="Toggle theme"
            >
              {mounted ? (theme === "dark" ? (
                <Sun className="h-4 w-4" weight="fill" />
              ) : (
                <Moon className="h-4 w-4" weight="fill" />
              )) : <div className="h-4 w-4" />}
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden h-9 w-9 rounded-full"
              aria-label={mobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </Button>

            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-xs font-semibold cursor-pointer">
                Masuk
              </Button>
            </Link>
            <Link href="/register" className="hidden sm:block">
              <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20 cursor-pointer active:scale-[0.98] transition-transform">
                Daftar 500 Beta <RocketLaunch className="ml-1 h-3.5 w-3.5" weight="fill" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card/95 backdrop-blur-xl">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full text-xs font-semibold cursor-pointer">Masuk</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full text-xs font-bold cursor-pointer">Daftar Beta</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <HeroSection />

        <section id="solusi">
          <SolutionsSection />
        </section>

        <section id="jenjang">
          <JenjangSection />
        </section>

        <section id="harga">
          <PricingSection />
        </section>

        <FaqSection />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-10 text-xs text-muted-foreground">
        <div className="container mx-auto px-4 sm:px-8 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-xs">
              YL
            </div>
            {APP_CONFIG.name} - Super App EdTech
          </div>

          <div className="flex gap-6 text-xs">
            <Link href="/login" className="hover:text-primary">Portal Siswa</Link>
            <Link href="/login" className="hover:text-primary">Portal Guru</Link>
            <Link href="/login" className="hover:text-primary">Portal Admin</Link>
          </div>

          <p>&copy; 2026 {APP_CONFIG.name}. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
