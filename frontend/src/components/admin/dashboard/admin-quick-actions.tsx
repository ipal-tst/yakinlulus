"use client";
import Link from "next/link";
import { ArrowRight, BookMarked, Users, BarChart3, FileCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const ACTIONS = [
    { title: "Master Akademik", description: "Jenjang, kelas, mapel, bab", href: "/admin/academic", icon: BookMarked },
    { title: "Kelola Pengguna", description: "Aktifkan / nonaktifkan akun", href: "/admin/users", icon: Users },
    { title: "Analitik & Laporan", description: "Laporan sistem & performa", href: "/admin/analytics", icon: BarChart3 },
    { title: "Kelola Ujian", description: "Buat & kelola paket ujian", href: "/admin/exams", icon: FileCheck },
];

export function AdminQuickActions() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACTIONS.map((a) => (
                <Card key={a.href} className="p-4 hover:border-primary transition-colors rounded-2xl">
                    <Link href={a.href} className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <a.icon className="h-5 w-5 mt-0.5 text-primary" />
                            <div>
                                <h4 className="font-heading font-semibold text-sm">{a.title}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                    </Link>
                </Card>
            ))}
        </div>
    );
}