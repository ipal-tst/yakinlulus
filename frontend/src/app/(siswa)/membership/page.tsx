// frontend/src/app/(siswa)/membership/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/siswa/EmptyState";
import { SectionHeader } from "@/components/siswa/SectionHeader";
import { membershipService } from "@/services/membership.service";
import {
    formatIDR,
    MembershipLevel,
    MembershipOrder,
    MembershipOrderHistory,
    MembershipPlan,
    MembershipStatus,
    MyMembership,
} from "@/types/siswa";
import {
    AlertCircle,
    ArrowRight,
    BadgeCheck,
    CalendarDays,
    Check,
    Clock,
    CreditCard,
    Crown,
    FileText,
    Gem,
    ReceiptText,
    RefreshCw,
    Rocket,
    Sparkles,
    type LucideIcon,
} from "lucide-react";

const LEVEL_ORDER: Record<MembershipLevel, number> = {
    basic: 1,
    premium: 2,
    pro: 3,
    enterprise: 4,
};

const LEVEL_META: Record<MembershipLevel, { label: string; icon: LucideIcon }> = {
    basic: { label: "Basic", icon: Check },
    premium: { label: "Premium", icon: Sparkles },
    pro: { label: "Pro", icon: Rocket },
    enterprise: { label: "Enterprise", icon: Crown },
};

const STATUS_META: Record<
    MembershipStatus,
    { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
    ACTIVE: { label: "Aktif", variant: "success" },
    TRIAL: { label: "Masa Percobaan", variant: "secondary" },
    INACTIVE: { label: "Belum Berlangganan", variant: "outline" },
    EXPIRED: { label: "Kadaluarsa", variant: "destructive" },
    CANCELLED: { label: "Dibatalkan", variant: "outline" },
};

const INVOICE_STATUS: Record<
    string,
    { label: string; variant: NonNullable<BadgeProps["variant"]> }
> = {
    UNPAID: { label: "Belum Bayar", variant: "warning" },
    PENDING: { label: "Menunggu", variant: "secondary" },
    PAID: { label: "Lunas", variant: "success" },
    CANCELLED: { label: "Dibatalkan", variant: "outline" },
    EXPIRED: { label: "Kadaluarsa", variant: "outline" },
};

function sortPlans(a: MembershipPlan, b: MembershipPlan): number {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99);
}

function effectivePrice(plan: MembershipPlan): number {
    return plan.discount_price ?? plan.price;
}

function discountAmount(plan: MembershipPlan): number {
    return plan.discount_price ? Math.max(0, plan.price - plan.discount_price) : 0;
}

function durationLabel(days?: number): string {
    if (!days || days <= 0) return "-";
    if (days >= 365 && days % 365 === 0) {
        const years = days / 365;
        return years === 1 ? "1 tahun" : `${years} tahun`;
    }
    if (days >= 30 && days % 30 === 0) {
        const months = days / 30;
        return months === 1 ? "1 bulan" : `${months} bulan`;
    }
    return `${days} hari`;
}

function formatDate(value?: string): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${date.getFullYear()}`;
}

function invoiceStatusMeta(raw: string): { label: string; variant: NonNullable<BadgeProps["variant"]> } {
    return INVOICE_STATUS[raw] ?? { label: raw, variant: "outline" };
}

function planFromMembership(plan: NonNullable<MyMembership["plan"]>): MembershipPlan {
    return {
        id: plan.id,
        name: plan.name,
        level: plan.level,
        price: plan.price,
        duration_days: plan.duration_days,
        features: plan.features,
        sort_order: LEVEL_ORDER[plan.level] ?? 0,
    };
}

export default function MembershipPage() {
    const [membership, setMembership] = useState<MyMembership | null>(null);
    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [orderHistory, setOrderHistory] = useState<MembershipOrderHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [plansUnavailable, setPlansUnavailable] = useState(false);
    const [historyUnavailable, setHistoryUnavailable] = useState(false);

    const [autoRenewLoading, setAutoRenewLoading] = useState(false);
    const [autoRenewError, setAutoRenewError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [orderResult, setOrderResult] = useState<MembershipOrder | null>(null);

    async function refresh() {
        setLoading(true);
        setPlansUnavailable(false);
        setHistoryUnavailable(false);

        const [membershipRes, plansRes, historyRes] = await Promise.allSettled([
            membershipService.getMyMembership(),
            membershipService.getPlans(),
            membershipService.getOrderHistory(),
        ]);

        if (membershipRes.status === "fulfilled") {
            setMembership(membershipRes.value);
        }
        if (plansRes.status === "fulfilled") {
            setPlans(plansRes.value);
        } else {
            setPlansUnavailable(true);
        }
        if (historyRes.status === "fulfilled") {
            setOrderHistory(historyRes.value);
        } else {
            setHistoryUnavailable(true);
        }
        setLoading(false);
    }

    useEffect(() => {
        let cancelled = false;
        async function load() {
            await Promise.resolve();
            if (cancelled) return;
            await refresh();
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const sortedPlans = [...plans].sort(sortPlans);
    const activePlan = membership && membership.has_membership && membership.plan ? membership.plan : undefined;
    const renewPlan = activePlan ? planFromMembership(activePlan) : undefined;
    const currentPlanId = activePlan?.id;
    const currentLevel = activePlan?.level;

    const nextPlan = sortedPlans.find(
        (p) => currentLevel != null && LEVEL_ORDER[p.level] === LEVEL_ORDER[currentLevel] + 1
    );

    const isRenew = !!selectedPlan && selectedPlan.id === currentPlanId;

    function scrollToPlans() {
        document.getElementById("paket-membership")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function openOrderDialog(plan: MembershipPlan) {
        setSelectedPlan(plan);
        setOrderResult(null);
        setOrderError(null);
        setDialogOpen(true);
    }

    function closeOrderDialog() {
        setDialogOpen(false);
        setSelectedPlan(null);
        setOrderResult(null);
        setOrderError(null);
    }

    async function handleAutoRenewChange(checked: boolean) {
        if (!membership) return;
        setAutoRenewLoading(true);
        setAutoRenewError(null);
        const prev = membership.auto_renew;
        setMembership({ ...membership, auto_renew: checked });
        try {
            await membershipService.setAutoRenew(checked);
        } catch {
            setMembership({ ...membership, auto_renew: prev });
            setAutoRenewError("Gagal memperbarui auto-renew. Coba lagi.");
        } finally {
            setAutoRenewLoading(false);
        }
    }

    async function handleCreateOrder() {
        if (!selectedPlan) return;
        setOrderLoading(true);
        setOrderError(null);
        try {
            const res = await membershipService.createOrder({
                plan_id: selectedPlan.id,
                duration: selectedPlan.duration_days,
            });
            setOrderResult(res);
        } catch (err) {
            setOrderError(
                err instanceof Error ? err.message : "Gagal membuat pesanan. Hubungi admin untuk info pembayaran."
            );
        } finally {
            setOrderLoading(false);
        }
    }

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Membership</h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola status keanggotaan, perpanjang, atau tingkatkan paketmu.
                    </p>
                </div>

                {/* Status Keanggotaan */}
                {loading ? (
                    <Card className="p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-44" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Skeleton className="h-14 rounded-xl" />
                            <Skeleton className="h-14 rounded-xl" />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Skeleton className="h-9 w-44 rounded-xl" />
                            <Skeleton className="h-9 w-40 rounded-xl" />
                        </div>
                    </Card>
                ) : activePlan ? (
                    <Card className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Gem className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Paket Aktif</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-heading font-bold text-lg">{activePlan.name}</p>
                                                <Badge variant="outline">{LEVEL_META[activePlan.level].label}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 sm:ml-auto">
                                        <Badge variant={STATUS_META[membership!.status].variant}>
                                            {STATUS_META[membership!.status].label}
                                        </Badge>
                                        {typeof membership!.remaining_day === "number" && (
                                            <Badge variant="outline" className="gap-1">
                                                <Clock className="h-3 w-3" />
                                                {membership!.remaining_day! > 0
                                                    ? `Sisa ${membership!.remaining_day} hari`
                                                    : "Hari terakhir"}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {membership!.status === "EXPIRED" && (
                                    <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <p>Membership kamu telah berakhir. Perpanjang untuk mengaktifkan kembali aksesmu.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                                        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">Aktif sejak:</span>
                                        <span className="font-medium">{formatDate(membership!.active_from)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                                        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">Berakhir:</span>
                                        <span className="font-medium">{formatDate(membership!.expired_at)}</span>
                                    </div>
                                </div>

                                {membership!.status !== "INACTIVE" && membership!.status !== "EXPIRED" && (
                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
                                        <div>
                                            <p className="text-sm font-medium">Auto-renew</p>
                                            <p className="text-xs text-muted-foreground">
                                                Perpanjang otomatis saat masa aktif berakhir
                                            </p>
                                        </div>
                                        <Switch
                                            checked={membership!.auto_renew ?? false}
                                            onCheckedChange={handleAutoRenewChange}
                                            disabled={autoRenewLoading}
                                            aria-label="Aktifkan auto-renew"
                                        />
                                    </div>
                                )}
                                {autoRenewError && (
                                    <p className="text-xs text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" /> {autoRenewError}
                                    </p>
                                )}

                                {membership!.limits_used && membership!.limits_used.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-muted-foreground">Pemakaian Paket</p>
                                            <p className="text-xs text-muted-foreground">per periode aktif</p>
                                        </div>
                                        {membership!.limits_used.map((lim) => {
                                            const hasMax = typeof lim.max === "number";
                                            const used = lim.used ?? 0;
                                            const pct =
                                                hasMax && lim.max! > 0
                                                    ? Math.min(100, Math.max(0, Math.round((used / lim.max!) * 100)))
                                                    : 0;
                                            return (
                                                <div key={lim.feature_name} className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-medium">{lim.feature_name}</span>
                                                        {hasMax ? (
                                                            <span className="text-muted-foreground">
                                                                {used}/{lim.max}
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                                                                <Check className="h-3 w-3" /> Bebas
                                                            </span>
                                                        )}
                                                    </div>
                                                    {hasMax && (
                                                        <Progress
                                                            value={pct}
                                                            className="h-2"
                                                            indicatorClassName={pct >= 100 ? "bg-destructive" : undefined}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-stretch lg:pl-4 lg:border-l lg:border-border">
                                <Button className="rounded-xl" onClick={() => renewPlan && openOrderDialog(renewPlan)}>
                                    <RefreshCw className="h-4 w-4" />
                                    Perpanjang {activePlan.name}
                                </Button>
                                {nextPlan && (
                                    <Button variant="outline" className="rounded-xl" onClick={() => openOrderDialog(nextPlan)}>
                                        <ArrowRight className="h-4 w-4" />
                                        Upgrade ke {LEVEL_META[nextPlan.level].label}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="p-6">
                        <EmptyState
                            icon={Gem}
                            title="Belum Berlangganan"
                            description="Aktifkan membership untuk akses penuh tryout, materi premium, dan fitur eksklusif YakinLulus.id."
                            actionLabel="Lihat Paket"
                            onAction={scrollToPlans}
                        />
                    </Card>
                )}

                {/* Katalog Paket */}
                <section id="paket-membership" className="scroll-mt-24 space-y-4">
                    <SectionHeader
                        icon={CreditCard}
                        title="Pilih Paket Membership"
                        subtitle="Bandingkan paket Basic hingga Enterprise, lalu pilih yang paling sesuai."
                    />

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="flex flex-col p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-8 w-36" />
                                    <Skeleton className="h-3 w-16" />
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4].map((j) => (
                                            <Skeleton key={j} className="h-3 w-full" />
                                        ))}
                                    </div>
                                    <Skeleton className="h-9 w-full rounded-xl" />
                                </Card>
                            ))}
                        </div>
                    ) : plansUnavailable || sortedPlans.length === 0 ? (
                        <EmptyState
                            icon={CreditCard}
                            title="Katalog paket belum tersedia"
                            description="Layanan membership ini masih dalam pengembangan (DRAFT). Coba lagi nanti atau hubungi admin untuk info paket."
                            actionLabel="Muat Ulang"
                            onAction={refresh}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {sortedPlans.map((plan) => {
                                const levelMeta = LEVEL_META[plan.level];
                                const LevelIcon = levelMeta.icon;
                                const isCurrent = plan.id === currentPlanId;
                                const finalPrice = effectivePrice(plan);
                                const discount = discountAmount(plan);
                                return (
                                    <Card
                                        key={plan.id}
                                        className={
                                            plan.is_featured || isCurrent
                                                ? "relative flex flex-col border-primary/40 shadow-md"
                                                : "relative flex flex-col"
                                        }
                                    >
                                        {isCurrent && (
                                            <Badge className="absolute top-4 right-4">Paket Aktif</Badge>
                                        )}
                                        {!isCurrent && plan.is_featured && (
                                            <Badge variant="warning" className="absolute top-4 right-4">
                                                Populer
                                            </Badge>
                                        )}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-10 w-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center">
                                                <LevelIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-heading font-bold">{plan.name}</p>
                                                <Badge variant="outline" className="mt-0.5">
                                                    {levelMeta.label}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-baseline gap-2">
                                            <p className="font-heading text-2xl font-extrabold text-foreground">
                                                {formatIDR(finalPrice)}
                                            </p>
                                            {discount > 0 && (
                                                <p className="text-sm text-muted-foreground line-through">
                                                    {formatIDR(plan.price)}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            {durationLabel(plan.duration_days)}
                                        </p>

                                        <ul className="space-y-2 mb-6 flex-1">
                                            {plan.features.map((feature) => (
                                                <li key={feature.name} className="flex items-start gap-2 text-xs text-foreground">
                                                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                                                        <Check className="h-3 w-3" />
                                                    </span>
                                                    <span>
                                                        {feature.name}
                                                        {feature.is_unlimited
                                                            ? " (bebas)"
                                                            : typeof feature.value === "number"
                                                              ? ` (${feature.value})`
                                                              : ""}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            className="w-full rounded-xl"
                                            variant={isCurrent ? "secondary" : "default"}
                                            onClick={() => openOrderDialog(plan)}
                                        >
                                            {isCurrent ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4" /> Perpanjang
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowRight className="h-4 w-4" /> Pilih
                                                </>
                                            )}
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Riwayat Invoice */}
                <section className="space-y-4">
                    <SectionHeader
                        icon={ReceiptText}
                        title="Riwayat Invoice"
                        subtitle="Daftar order membership yang pernah dibuat."
                    />

                    {loading ? (
                        <Card className="p-0 overflow-hidden">
                            <div className="space-y-2 p-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-10 w-full" />
                                ))}
                            </div>
                        </Card>
                    ) : historyUnavailable ? (
                        <Card className="p-6">
                            <EmptyState
                                icon={FileText}
                                title="Riwayat invoice belum tersedia"
                                description="Fitur ini masih dalam pengembangan (DRAFT). Nanti invoice akan otomatis muncul di sini."
                                compact
                            />
                        </Card>
                    ) : orderHistory.length === 0 ? (
                        <Card className="p-6">
                            <EmptyState
                                icon={FileText}
                                title="Belum ada transaksi"
                                description="Order membership yang berhasil dibuat akan muncul di sini."
                                actionLabel="Lihat Paket"
                                onAction={scrollToPlans}
                                compact
                            />
                        </Card>
                    ) : (
                        <Card className="p-0 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Invoice</TableHead>
                                        <TableHead>Paket</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Diterbitkan</TableHead>
                                        <TableHead>Dibayar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderHistory.map((item) => {
                                        const status = invoiceStatusMeta(item.status);
                                        return (
                                            <TableRow key={item.invoice_number}>
                                                <TableCell className="font-mono text-xs">{item.invoice_number}</TableCell>
                                                <TableCell className="font-medium">{item.plan_name}</TableCell>
                                                <TableCell>{formatIDR(item.total)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={status.variant}>{status.label}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{formatDate(item.issued_at)}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {item.paid_at ? formatDate(item.paid_at) : "-"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </section>
            </div>

            {/* Dialog Order (Renew / Upgrade) */}
            <Dialog open={dialogOpen} onOpenChange={(open) => (!open ? closeOrderDialog() : undefined)}>
                <DialogContent className="sm:max-w-md">
                    {selectedPlan && !orderResult ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {isRenew ? `Perpanjang ${selectedPlan.name}` : `Upgrade ke ${selectedPlan.name}`}
                                </DialogTitle>
                                <DialogDescription>
                                    Buat pesanan {isRenew ? "perpanjangan" : "upgrade"} paket {selectedPlan.name}.
                                    Pesanan akan ditinjau oleh admin sebelum aktif.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Paket</span>
                                    <span className="font-medium">{selectedPlan.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Durasi</span>
                                    <span className="font-medium">{durationLabel(selectedPlan.duration_days)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatIDR(selectedPlan.price)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Diskon</span>
                                    <span>{discountAmount(selectedPlan) > 0 ? `- ${formatIDR(discountAmount(selectedPlan))}` : "-"}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-border pt-3 font-heading font-bold">
                                    <span>Total</span>
                                    <span>{formatIDR(effectivePrice(selectedPlan))}</span>
                                </div>
                            </div>

                            <p className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                Metode pembayaran akan ditampilkan setelah pesanan dibuat.
                            </p>

                            {orderError && (
                                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <p>{orderError}</p>
                                </div>
                            )}

                            <DialogFooter>
                                <DialogClose
                                    render={<Button variant="outline" className="rounded-xl" disabled={orderLoading}>Batal</Button>}
                                />
                                <Button onClick={handleCreateOrder} disabled={orderLoading} className="rounded-xl">
                                    {orderLoading ? "Membuat Pesanan..." : "Buat Pesanan"}
                                </Button>
                            </DialogFooter>
                        </>
                    ) : orderResult ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Pesanan Dibuat</DialogTitle>
                            </DialogHeader>

                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                                    <BadgeCheck className="h-6 w-6" />
                                </div>
                                <p className="font-heading font-semibold">Order berhasil dibuat</p>
                                <p className="text-xs text-muted-foreground">
                                    Invoice{" "}
                                    <span className="font-mono font-medium text-foreground">{orderResult.invoice_number}</span>{" "}
                                    telah diterbitkan dan menunggu pembayaran.
                                </p>
                            </div>

                            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatIDR(orderResult.subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Diskon</span>
                                    <span>{orderResult.discount > 0 ? `- ${formatIDR(orderResult.discount)}` : "-"}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-border pt-3 font-heading font-bold">
                                    <span>Total</span>
                                    <span>{formatIDR(orderResult.total)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={invoiceStatusMeta(orderResult.status).variant}>
                                        {invoiceStatusMeta(orderResult.status).label}
                                    </Badge>
                                </div>
                                <div className="flex flex-col gap-1.5 pt-1">
                                    <span className="text-muted-foreground">Metode Pembayaran</span>
                                    <div className="flex flex-wrap gap-2">
                                        {orderResult.payment_methods.length > 0 ? (
                                            orderResult.payment_methods.map((method) => (
                                                <Badge key={method} variant="outline" className="text-xs">
                                                    {method}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Belum ada metode pembayaran</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                Pembayaran diverifikasi oleh admin. Simpan nomor invoice untuk referensi konfirmasi.
                            </p>

                            <DialogFooter>
                                <Button onClick={closeOrderDialog} className="w-full rounded-xl">
                                    Selesai
                                </Button>
                            </DialogFooter>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppShell>
    );
}