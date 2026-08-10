"use client";

import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/data-display/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { financeService, Transaction } from "@/services/finance.service";
import { DollarSign, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  ACTIVE: { label: "Aktif", icon: CheckCircle2, color: "success" },
  PAID: { label: "Lunas", icon: CheckCircle2, color: "success" },
  CANCELLED: { label: "Dibatalkan", icon: XCircle, color: "destructive" },
  PAUSED: { label: "Dijeda", icon: Clock, color: "default" },
  EXPIRED: { label: "Kadaluarsa", icon: Clock, color: "default" },
  FAILED: { label: "Gagal", icon: XCircle, color: "destructive" },
};

export default function FinanceTransactionsPage() {
  const limit = 100;
  
  const transactionsQuery = useQuery({
    queryKey: ["finance-transactions", limit],
    queryFn: () => financeService.listTransactions({ page: 1, limit }),
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  const columns: Column<Transaction>[] = [
    {
      header: "User",
      accessorKey: "user_name",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.user_name}</span>
          <span className="text-xs text-muted-foreground">{row.user_email}</span>
        </div>
      ),
    },
    {
      header: "Paket",
      accessorKey: "package_name",
    },
    {
      header: "Nominal",
      accessorKey: "amount",
      cell: (row) => formatCurrency(row.amount),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const config = statusConfig[row.status as keyof typeof statusConfig];
        const Icon = config?.icon || Clock;
        const colorClass = config?.color === "success" 
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : config?.color === "destructive"
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
        return (
          <Badge className={cn("gap-1.5", colorClass)}>
            <Icon className="h-3 w-3" />
            {config?.label || row.status}
          </Badge>
        );
      },
    },
    {
      header: "Tanggal",
      accessorKey: "created_at",
      cell: (row) => {
        const date = new Date(row.created_at);
        return date.toLocaleDateString("id-ID", { 
          year: "numeric", 
          month: "long", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Riwayat Transaksi & Pembayaran</h1>
        <p className="text-sm text-muted-foreground">Monitoring arus kas masuk dari pembelian paket try out, langganan siswa, dan lisensi B2B.</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4">
          {transactionsQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : transactionsQuery.isError ? (
            <div className="p-8 text-center text-muted-foreground">
              Gagal memuat transaksi. Silakan coba lagi.
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={transactionsQuery.data?.items || []}
                searchPlaceholder="Cari ID transaksi atau nama..."
                pageSize={limit}
                enableExport
              />
              {transactionsQuery.data?.items.length === 0 && (
                <div className="p-12 text-center">
                  <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">Belum ada transaksi</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Transaksi pembayaran akan muncul di sini setelah siswa melakukan pembayaran.</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
