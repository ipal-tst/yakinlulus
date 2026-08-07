// src/components/admin/ai/AiConfigForm.tsx
"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { aiService, AiConfig } from "@/services/ai.service";
import { Settings, CheckCircle2, AlertCircle, Loader2, Zap } from "lucide-react";

const schema = z.object({
    model: z.string().min(1, "Model AI wajib diisi"),
    temperature: z.coerce.number().min(0, "Minimal 0").max(2, "Maksimal 2"),
    max_tokens: z.coerce.number().min(1, "Minimal 1 token").max(128000, "Maksimal 128k token"),
    enabled: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function AiConfigForm() {
    const qc = useQueryClient();

    const configQuery = useQuery<AiConfig>({
        queryKey: ["ai-config"],
        queryFn: () => aiService.getConfig(),
    });

    const updateMutation = useMutation({
        mutationFn: aiService.updateConfig,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-config"] }),
    });

    const testMutation = useMutation({
        mutationFn: aiService.testConnection,
    });

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema as any),
        defaultValues: { model: "gpt-4o-mini", temperature: 0.7, max_tokens: 4096, enabled: "true" },
    });

    React.useEffect(() => {
        if (configQuery.data) {
            reset({
                model: configQuery.data.model || "gpt-4o-mini",
                temperature: configQuery.data.temperature ?? 0.7,
                max_tokens: configQuery.data.max_tokens ?? 4096,
                enabled: configQuery.data.enabled ? "true" : "false",
            });
        }
    }, [configQuery.data, reset]);

    if (configQuery.isLoading) {
        return (
            <Card className="rounded-2xl p-6 shadow-sm border border-border">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                </div>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl p-6 shadow-sm border border-border">
            <CardHeader className="p-0 mb-6">
                <CardTitle className="font-heading text-lg font-bold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" /> Konfigurasi AI Tutor
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Konfigurasi model AI OpenAI yang digunakan untuk sistem AI Tutor otomatis dan rekomendasi belajar siswa.</p>
                {configQuery.data?.api_key_masked && (
                    <p className="text-xs font-mono text-muted-foreground mt-1">API Key aktif: <span className="text-foreground">{configQuery.data.api_key_masked}</span></p>
                )}
            </CardHeader>
            <CardContent className="p-0">
                <form onSubmit={handleSubmit((d) => updateMutation.mutate({ ...d, enabled: d.enabled === "true" }))} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Model</label>
                            <Input {...register("model")} className="h-11" placeholder="gpt-4o-mini" />
                            {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Status</label>
                            <select
                                {...register("enabled")}
                                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="true">Aktif (Enabled)</option>
                                <option value="false">Nonaktif (Disabled)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Temperatur (0-2)</label>
                            <Input type="number" step="0.1" {...register("temperature")} className="h-11" />
                            {errors.temperature && <p className="text-xs text-destructive">{errors.temperature.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Max Tokens</label>
                            <Input type="number" {...register("max_tokens")} className="h-11" />
                            {errors.max_tokens && <p className="text-xs text-destructive">{errors.max_tokens.message}</p>}
                        </div>
                    </div>

                    {updateMutation.isSuccess && (
                        <div className="p-3.5 rounded-xl bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 text-xs flex items-center gap-2 border border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-4 w-4 shrink-0" /> Konfigurasi AI berhasil disimpan!
                        </div>
                    )}
                    {updateMutation.isError && (
                        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200 dark:border-red-800">
                            <AlertCircle className="h-4 w-4 shrink-0" /> Gagal menyimpan: {updateMutation.error instanceof Error ? updateMutation.error.message : "Error"}
                        </div>
                    )}
                    {testMutation.isSuccess && testMutation.data && (
                        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${testMutation.data.ok ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"}`}>
                            {testMutation.data.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                            {testMutation.data.ok ? "Koneksi berhasil!" : testMutation.data.message || "Koneksi gagal"}
                        </div>
                    )}
                    {testMutation.isPending && (
                        <div className="p-3.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-xs flex items-center gap-2 border border-blue-200 dark:border-blue-800">
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> Menguji koneksi...
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <Button type="button" variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending} className="rounded-xl gap-2">
                            <Zap className="h-4 w-4" /> Uji Koneksi
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending} className="rounded-xl gap-2">
                            {updateMutation.isPending ? "Menyimpan..." : "Simpan Konfigurasi"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}