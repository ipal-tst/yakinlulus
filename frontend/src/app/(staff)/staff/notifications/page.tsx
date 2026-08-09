// src/app/(staff)/staff/notifications/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { BroadcastForm } from "@/components/admin/notifications/BroadcastForm";
import { TemplateTable } from "@/components/admin/notifications/TemplateTable";
import { TemplateFormDialog } from "@/components/admin/notifications/TemplateFormDialog";
import { notificationService, NotificationTemplate } from "@/services/notification.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertCircle } from "lucide-react";

export default function StaffNotificationsPage() {
    const qc = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<NotificationTemplate | null>(null);

    const { data: templates = [], isLoading, error, refetch } = useQuery({
        queryKey: ["admin-notification-templates"],
        queryFn: () => notificationService.listTemplates(),
    });

    const createMutation = useMutation({
        mutationFn: notificationService.createTemplate,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-notification-templates"] });
            setFormOpen(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: notificationService.deleteTemplate,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-notification-templates"] });
            setDeleteTarget(null);
        },
    });

    return (

            <div className="space-y-6">
                <PageHeader
                    title="Broadcast & Notifikasi Sistem"
                    description="Kirim broadcast massal kepada audiens tertentu atau kelola templat notifikasi transaksional sistem."
                />

                <Tabs defaultValue="broadcast" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="broadcast">Kirim Pengumuman</TabsTrigger>
                        <TabsTrigger value="templates">Templat Notifikasi</TabsTrigger>
                    </TabsList>

                    <TabsContent value="broadcast" className="mt-0">
                        <BroadcastForm />
                    </TabsContent>

                    <TabsContent value="templates" className="mt-0 space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Templat Aktif</h3>
                                <p className="text-xs text-muted-foreground">Daftar templat notifikasi otomatis sistem (OTP, Welcome, Reset Password).</p>
                            </div>
                            <Button onClick={() => setFormOpen(true)} size="sm" className="rounded-xl gap-2 font-medium">
                                <Plus className="h-4 w-4" /> Tambah Templat
                            </Button>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error instanceof Error ? error.message : "Gagal memuat templat"}</span>
                                <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                                    Coba lagi
                                </Button>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <TemplateTable templates={templates} onDelete={(t) => setDeleteTarget(t)} />
                        )}
                    </TabsContent>
                </Tabs>

                <TemplateFormDialog
                    open={formOpen}
                    loading={createMutation.isPending}
                    onClose={() => setFormOpen(false)}
                    onSubmit={(v) => createMutation.mutate(v)}
                />

                <ConfirmDialog
                    open={Boolean(deleteTarget)}
                    title="Hapus templat notifikasi?"
                    description={`Templat "${deleteTarget?.name}" akan dihapus. Ini dapat menyebabkan proses otomatis sistem yang bergantung pada templat ini error.`}
                    confirmLabel="Hapus"
                    variant="destructive"
                    loading={deleteMutation.isPending}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                />
            </div>

    );
}