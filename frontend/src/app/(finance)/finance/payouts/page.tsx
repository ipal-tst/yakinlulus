"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { financeService } from "@/services/finance.service";
import { Banknote, CheckCircle2, Clock, Send, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinancePayoutsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const queryClient = useQueryClient();

  const payoutsQuery = useQuery({
    queryKey: ["finance-payouts", statusFilter],
    queryFn: () => financeService.listPayouts({ status: statusFilter }),
  });

  const approveMutation = useMutation({
    mutationFn: financeService.approvePayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-payouts", statusFilter] });
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="default" className="gap-1.5">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="secondary" className="gap-1.5">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "PAID":
        return (
          <Badge variant="success" className="gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive" className="gap-1.5">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1.5">
            {status}
          </Badge>
        );
    }
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Manajemen Payout & Royalti Guru</h1>
        <p className="text-sm text-muted-foreground">Proses pengajuan pencairan komisi dan royalti pembuat soal/materi.</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={statusFilter === "PENDING" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("PENDING")}
          className="rounded-xl"
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === "PAID" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("PAID")}
          className="rounded-xl"
        >
          Paid
        </Button>
        <Button
          variant={statusFilter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("")}
          className="rounded-xl"
        >
          Semua
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-border p-4 bg-card/50 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan payout dengan status: <span className="font-medium text-foreground">{statusFilter || "Semua"}</span>
          </div>
        </div>
        
        <div className="p-4">
          {payoutsQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : payoutsQuery.isError ? (
            <div className="p-8 text-center text-muted-foreground">
              Gagal memuat data payout. Silakan coba lagi.
            </div>
          ) : payoutsQuery.data && payoutsQuery.data.length > 0 ? (
            <div className="divide-y divide-border">
              {payoutsQuery.data.map((p) => (
                <div key={p.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(p.status)}
                      <span className="text-xs text-muted-foreground font-mono">{p.bank_account}</span>
                    </div>
                    <h3 className="font-heading font-bold text-base">{p.user_name}</h3>
                    <p className="text-xs text-muted-foreground">Diajukan: {new Date(p.created_at).toLocaleDateString("id-ID")}</p>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <span className="font-heading font-bold text-lg text-primary">{formatCurrency(p.amount)}</span>
                    {p.status === "PENDING" && (
                      <Button
                        onClick={() => handleApprove(p.id)}
                        size="sm"
                        className="rounded-xl gap-1.5 font-bold"
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <>
                            <Clock className="h-3.5 w-3.5 animate-spin" /> Memproses...
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" /> Transfer Payout
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Banknote className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Belum ada komisi payout</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tidak ada komisi yang perlu diproses dengan status: <span className="font-medium">{statusFilter || "Semua"}</span>
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
