"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Search, Newspaper, HelpCircle, Settings, AlertCircle } from "lucide-react";
import { notificationService, NotificationTemplate } from "@/services/notification.service";

export default function AdminCmsPage() {
    const [search, setSearch] = useState("");

    const { data: templates = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ["cms-templates"],
        queryFn: async () => {
            try {
                const res = await notificationService.listTemplates();
                return Array.isArray(res) ? res : [];
            } catch {
                return [];
            }
        },
    });

    const filteredTemplates = templates.filter(
        (t) =>
            t.title?.toLowerCase().includes(search.toLowerCase()) ||
            t.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (

            <div className="space-y-6">
                <PageHeader
                    title="Manajemen Konten (CMS)"
                    description="Kelola template notifikasi, pengumuman, dan konten publik platform."
                    actions={
                        <Button className="rounded-xl gap-2 font-medium shadow-xs">
                            <Plus className="h-4 w-4" /> Buat Konten
                        </Button>
                    }
                />

                {isError && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error instanceof Error ? error.message : "Gagal memuat data konten dari server."}</span>
                        <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                            Coba Lagi
                        </Button>
                    </div>
                )}

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari konten atau template..."
                        className="h-10 pl-9 rounded-xl"
                    />
                </div>

                <Tabs defaultValue="pages" className="w-full">
                    <TabsList className="grid w-full max-w-lg grid-cols-4">
                        <TabsTrigger value="pages">Halaman &amp; Template</TabsTrigger>
                        <TabsTrigger value="news">Pengumuman</TabsTrigger>
                        <TabsTrigger value="faq">FAQ</TabsTrigger>
                        <TabsTrigger value="settings">Pengaturan</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pages" className="pt-4">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                                ))}
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <Card className="p-12 text-center text-muted-foreground rounded-2xl">
                                <FileText className="h-10 w-10 mx-auto text-muted-foreground/40" />
                                <p className="mt-4 font-semibold text-sm">Belum ada template / halaman di database.</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Klik tombol &quot;Buat Konten&quot; untuk menambahkan data CMS baru.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTemplates.map((item: NotificationTemplate) => (
                                    <Card key={item.id} className="p-4 hover:border-primary transition-colors rounded-2xl">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm line-clamp-1">{item.title || item.name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.created_at || "Aktif"}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">
                                                {item.channel || "Notifikasi"}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="news" className="pt-4">
                        <Card className="p-12 text-center text-muted-foreground rounded-2xl">
                            <Newspaper className="h-10 w-10 mx-auto text-muted-foreground/40" />
                            <p className="mt-4 font-semibold text-sm">Belum ada pengumuman terpublikasi.</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Pengumuman dan berita terbaru akan muncul di sini setelah dibuat.
                            </p>
                        </Card>
                    </TabsContent>

                    <TabsContent value="faq" className="pt-4">
                        <Card className="p-12 text-center text-muted-foreground rounded-2xl">
                            <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/40" />
                            <p className="mt-4 font-semibold text-sm">Modul FAQ (Pertanyaan Umum)</p>
                            <p className="text-xs text-muted-foreground mt-1">Belum ada entri FAQ terdaftar.</p>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="pt-4">
                        <Card className="p-12 text-center text-muted-foreground rounded-2xl">
                            <Settings className="h-10 w-10 mx-auto text-muted-foreground/40" />
                            <p className="mt-4 font-semibold text-sm">Pengaturan Konten CMS</p>
                            <p className="text-xs text-muted-foreground mt-1">Konfigurasi publikasi dan SEO platform.</p>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

    );
}
