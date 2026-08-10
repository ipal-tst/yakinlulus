import { api } from "@/lib/api";

export interface Payout {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  user_name: string;
  bank_account: string;
  paid_at?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_email: string;
  user_name: string;
  package_name: string;
  amount: number;
  status: string;
  started_at: string;
  created_at: string;
}

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export const financeService = {
  async listPayouts(params?: { status?: string }): Promise<Payout[]> {
    return api<Payout[]>("/finance/payouts", { params });
  },

  async approvePayout(id: string): Promise<{ status: string }> {
    return api<{ status: string }>(`/finance/payouts/${id}/approve`, { method: "POST" });
  },

  async listTransactions(params?: { page?: number; limit?: number }): Promise<TransactionsResponse> {
    return api<TransactionsResponse>("/finance/transactions", { params });
  },
};
