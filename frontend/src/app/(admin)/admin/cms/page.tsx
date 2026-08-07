"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Search, Newspaper, HelpCircle, Settings } from "lucide-react";

interface CmsItem {
    id: string;
    title: string;
    status: "PUBLISHED" | "DRAFT";
    updated_at: string;
}

const mockPages: CmsItem[] = [
    { id: "pg-1", title: "Beranda", status: "PUBLISHED", updated_at: "2026-08-01" },
    { id: "pg-2", title: "Tentang Kami", status: "PUBLISHED", updated_at: "2026-07-28" },
    { id: "pg-3", title: "Kebijakan Privasi", status: "DRAFT", updated_at: "2026-07-20" },
];

const mockNews: CmsItem[] = [
    { id: "ns-1", title: "Try Out UTBK Batch 3 Segera Dibuka", status: "PUBLISHED", updated_at: "2026-08-05" },
    { id: "ns-2", title: "Fitur AI Tutor Baru Diluncurkan", status: "PUBLISHED", updated_at: "2026-07-30" },
];

export default function AdminCmsPage() {
    const [search, setSearch] = useState("");

    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    title="Manajemen Konten (CMS)"
                    description="Kelola halaman, berita, banner, dan konten publik platform."
                    actions={
                        <Button className="rounded-xl gap-2 font-medium shadow-xs">
                            <Plus className="h-4 w-4" /> Buat Konten
                        </Button>
                    }
                />

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari konten..."
                        className="h-10 pl-9 rounded-xl"
                    />
                </div>

                <Tabs defaultValue="pages" className="w-full">
                    <TabsList className="grid w-full max-w-lg grid-cols-4">
                        <TabsTrigger value="pages">Halaman</TabsTrigger>
                        <TabsTrigger value="news">Berita</TabsTrigger>
                        <TabsTrigger value="faq">FAQ</TabsTrigger>
                        <TabsTrigger value="settings">Pengaturan</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pages" className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mockPages.map((item) => (
                                <Card key={item.id} className="p-4 hover:border-primary transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">{item.updated_at}</p>
                                            </div>
                                        </div>
                                        <Badge variant={item.status === "PUBLISHED" ? "success" : "outline"}>
                                            {item.status === "PUBLISHED" ? "Terbit" : "Draf"}
                                        </Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="news" className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockNews.map((item) => (
                                <Card key={item.id} className="p-4 hover:border-primary transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                                <Newspaper className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">{item.updated_at}</p>
                                            </div>
                                        </div>
                                        <Badge variant={item.status === "PUBLISHED" ? "success" : "outline"}>
                                            {item.status === "PUBLISHED" ? "Terbit" : "Draf"}
                                        </Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="faq" className="pt-4">
                        <Card className="p-8 text-center">
                            <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/40" />
                            <p className="mt-4 text-sm text-muted-foreground">Modul FAQ dalam pengembangan.</p>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="pt-4">
                        <Card className="p-8 text-center">
                            <Settings className="h-10 w-10 mx-auto text-muted-foreground/40" />
                            <p className="mt-4 text-sm text-muted-foreground">Pengaturan CMS dalam pengembangan.</p>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppShell>
    );
}
