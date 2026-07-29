"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
    useSubscriptionStats,
    useSubscriptionPlans,
    useCreateSubscriptionPlan,
    useUpdateSubscriptionPlan,
    useDeleteSubscriptionPlan,
    useUserSubscriptions
} from "@/lib/api";
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    ArrowUpRight,
    Search,
    Download,
    CheckCircle2,
    Clock,
    Plus,
    Trash2,
    Edit3,
    Eye,
    X,
    Loader2
} from "lucide-react";

interface Plan {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    duration_days: number;
    features?: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface UserSubscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    started_at: string;
    expires_at?: string;
    payment_method?: string;
    payment_proof?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    plan_name?: string;
    user_email?: string;
    user_fullname?: string;
}

export default function SubscriptionsPage() {
    const [search, setSearch] = React.useState("");
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null);
    const [deletingPlan, setDeletingPlan] = React.useState<Plan | null>(null);

    const [planForm, setPlanForm] = React.useState({
        name: "",
        slug: "",
        description: "",
        price: 0,
        duration_days: 30,
        features: [] as string[]
    });

    const { data: statsData, isLoading: statsLoading } = useSubscriptionStats() as any;
    const { data: plansResponse, isLoading: plansLoading, refetch: refetchPlans } = useSubscriptionPlans() as any;
    const { data: subsResponse } = useUserSubscriptions() as any;
    const createMutation = useCreateSubscriptionPlan();
    const updateMutation = useUpdateSubscriptionPlan();
    const deleteMutation = useDeleteSubscriptionPlan();

    const plans: Plan[] = React.useMemo(() => {
        if (!plansResponse) return [];
        if (Array.isArray(plansResponse)) return plansResponse;
        if (Array.isArray(plansResponse.data)) return plansResponse.data;
        return [];
    }, [plansResponse]);

    const subs: UserSubscription[] = React.useMemo(() => {
        if (!subsResponse) return [];
        if (Array.isArray(subsResponse)) return subsResponse;
        if (Array.isArray(subsResponse.data)) return subsResponse.data;
        return [];
    }, [subsResponse]);

    const filteredPlans = plans.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
    );

    const stats = React.useMemo(() => {
        if (!statsData?.data) return { mrr: 0, active_subs: 0, total_plans: 0 };
        return statsData.data;
    }, [statsData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
    };

    const resetPlanForm = () => {
        setPlanForm({ name: "", slug: "", description: "", price: 0, duration_days: 30, features: [] });
    };

    const handleOpenCreate = () => {
        resetPlanForm();
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (plan: Plan) => {
        setPlanForm({
            name: plan.name,
            slug: plan.slug,
            description: plan.description || "",
            price: plan.price,
            duration_days: plan.duration_days,
            features: plan.features || []
        });
        setEditingPlan(plan);
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                name: planForm.name,
                slug: planForm.slug,
                description: planForm.description || undefined,
                price: planForm.price,
                duration_days: planForm.duration_days,
                features: planForm.features
            };
            if (!payload.slug) payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

            if (editingPlan) {
                await updateMutation.mutateAsync({ id: editingPlan.id, data: payload });
                setEditingPlan(null);
            } else {
                await createMutation.mutateAsync(payload);
                setIsCreateOpen(false);
            }
            refetchPlans();
        } catch (err: any) {
            alert(err?.message || "Gagal menyimpan paket");
        }
    };

    const handleDeletePlan = async () => {
        if (!deletingPlan) return;
        try {
            await deleteMutation.mutateAsync(deletingPlan.id);
            setDeletingPlan(null);
            refetchPlans();
        } catch (err: any) {
            alert(err?.message || "Gagal menghapus paket");
        }
    };

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">REVENUE & SAAS</Badge>
                        <span className="text-xs text-muted-foreground">MRR & Billing Analytics</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Paket Belajar & Langganan</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Monitoring pendapatan bulanan (MRR), paket langganan aktif, dan riwayat transaksi.
                    </p>
                </div>

                <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20 cursor-pointer" onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah Paket Baru
                </Button>
            </div>

            {/* Financial Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 space-y-2">
                    <span className="text-xs text-muted-foreground font-semibold">Monthly Recurring Revenue (MRR)</span>
                    <div className="text-3xl font-black text-primary">{formatCurrency(stats.mrr)}</div>
                    <span className="text-xs text-success font-semibold flex items-center gap-1">
                        <ArrowUpRight className="h-3.5 w-3.5" /> +18.2% vs bulan lalu
                    </span>
                </Card>

                <Card className="p-5 space-y-2">
                    <span className="text-xs text-muted-foreground font-semibold">Siswa Berlangganan</span>
                    <div className="text-3xl font-black text-indigo-500">{stats.active_subs}</div>
                    <span className="text-xs text-muted-foreground font-medium">Sedang aktif</span>
                </Card>

                <Card className="p-5 space-y-2">
                    <span className="text-xs text-muted-foreground font-semibold">Total Paket</span>
                    <div className="text-3xl font-black text-success">{stats.total_plans}</div>
                    <span className="text-xs text-muted-foreground font-medium">Paket aktif tersedia</span>
                </Card>
            </div>

            {/* Subscriptions Stats */}
            <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Ringkasan Langganan Aktif
                    </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-muted/40 border">
                        <span className="text-muted-foreground block">Total Subscribers</span>
                        <span className="font-extrabold">{subs.length}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border">
                        <span className="text-muted-foreground block">Dalam Masa Berlaku</span>
                        <span className="font-extrabold text-success">
                            {subs.filter(s => new Date(s.started_at) <= new Date() && (!s.expires_at || new Date(s.expires_at) > new Date())).length}
                        </span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border">
                        <span className="text-muted-foreground block">Hampir Expired (7 hari)</span>
                        <span className="font-extrabold text-warning">
                            {subs.filter(s => s.expires_at && new Date(s.expires_at) <= new Date(Date.now() + 7*24*60*60*1000) && new Date(s.expires_at) > new Date()).length}
                        </span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 border">
                        <span className="text-muted-foreground block">Total Revenue (MTD)</span>
                        <span className="font-extrabold text-indigo-500">{formatCurrency(subs.reduce((sum, s) => {
                            const plan = plans.find(p => p.id === s.plan_id);
                            return sum + (plan?.price || 0);
                        }, 0))}</span>
                    </div>
                </div>
            </Card>

            {/* Plans Management */}
            <Card className="overflow-hidden space-y-4 p-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="font-bold text-base">Manajemen Paket Langganan</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari paket..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                            <tr>
                                <th className="p-3">Nama Paket</th>
                                <th className="p-3">Harga</th>
                                <th className="p-3">Durasi</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Features</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {plansLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        <span className="text-muted-foreground">Memuat paket...</span>
                                    </td>
                                </tr>
                            ) : filteredPlans.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        Belum ada paket langganan
                                    </td>
                                </tr>
                            ) : (
                                filteredPlans.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <div className="font-bold">{plan.name}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">/{plan.slug}</div>
                                        </td>
                                        <td className="p-3 font-extrabold">{formatCurrency(plan.price)}</td>
                                        <td className="p-3 text-muted-foreground">{plan.duration_days} hari</td>
                                        <td className="p-3">
                                            <Badge variant={plan.is_active ? "success" : "secondary"} className="text-[10px]">
                                                {plan.is_active ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </td>
                                        <td className="p-3">
                                            {plan.features && plan.features.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {plan.features.slice(0, 2).map((f, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 rounded bg-muted text-[9px] text-muted-foreground">
                                                            {f}
                                                        </span>
                                                    ))}
                                                    {plan.features.length > 2 && (
                                                        <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] text-muted-foreground">
                                                            +{plan.features.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground italic">-</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    onClick={() => handleOpenEdit(plan)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    onClick={() => setDeletingPlan(plan)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create/Edit Plan Modal */}
            <Dialog
                isOpen={isCreateOpen || editingPlan !== null}
                onClose={() => { setIsCreateOpen(false); setEditingPlan(null); }}
                title={editingPlan ? "Edit Paket Langganan" : "Paket Baru"}
                description="Buat atau edit paket langganan baru untuk pelanggan."
            >
                <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
                    <div>
                        <label className="font-semibold block mb-1">Nama Paket *</label>
                        <input
                            type="text"
                            required
                            value={planForm.name}
                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="font-semibold block mb-1">Slug (URL-friendly)</label>
                        <input
                            type="text"
                            required
                            value={planForm.slug}
                            onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-background font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Contoh: pejuang-ptn-pro</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-semibold block mb-1">Harga (Rp) *</label>
                            <input
                                type="number"
                                min={0}
                                required
                                value={planForm.price}
                                onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="font-semibold block mb-1">Durasi (hari) *</label>
                            <input
                                type="number"
                                min={1}
                                required
                                value={planForm.duration_days}
                                onChange={(e) => setPlanForm({ ...planForm, duration_days: Number(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold block mb-1">Deskripsi</label>
                        <textarea
                            rows={3}
                            value={planForm.description}
                            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="font-semibold block mb-1">Fitur (pisah dengan koma)</label>
                        <input
                            type="text"
                            placeholder="Akses video, Bank soal, Tryout, dll"
                            value={planForm.features.join(", ")}
                            onChange={(e) => setPlanForm({ ...planForm, features: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                            className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { setIsCreateOpen(false); setEditingPlan(null); }}
                            className="cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="font-bold cursor-pointer"
                        >
                            {(createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            )}
                            {editingPlan ? "Simpan Perubahan" : "Buat Paket"}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Delete Modal */}
            <Dialog
                isOpen={deletingPlan !== null}
                onClose={() => setDeletingPlan(null)}
                title="Hapus Paket"
                description="Apakah Anda yakin ingin menghapus paket ini? Ini akan menghapus data terkait."
            >
                <div className="space-y-4 text-xs">
                    {deletingPlan && (
                        <div className="p-3 border rounded-lg bg-destructive/5 text-destructive font-semibold">
                            {deletingPlan.name}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" onClick={() => setDeletingPlan(null)} className="cursor-pointer">
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteMutation.isPending}
                            onClick={handleDeletePlan}
                            className="font-bold cursor-pointer"
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Hapus Permanen
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Recent Subscriptions */}
            <Card className="overflow-hidden space-y-4 p-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Langganan Terbaru
                    </h3>
                    <Badge variant="outline" className="text-xs">{subs.length} total</Badge>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                            <tr>
                                <th className="p-3">Pelanggan</th>
                                <th className="p-3">Paket</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Dibuat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {subs.slice(0, 5).map((sub) => (
                                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-3">
                                        <div className="font-semibold">{sub.user_fullname || sub.user_email || "-"}</div>
                                        <div className="text-[10px] text-muted-foreground">{sub.user_email || "-"}</div>
                                    </td>
                                    <td className="p-3 font-medium">{sub.plan_name || "-"}</td>
                                    <td className="p-3">
                                        <Badge variant={sub.status === "ACTIVE" ? "success" : "warning"} className="text-[10px]">
                                            {sub.status}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-muted-foreground font-mono">
                                        {new Date(sub.created_at).toLocaleDateString("id-ID")}
                                    </td>
                                </tr>
                            ))}
                            {subs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        Belum ada langganan aktif
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
