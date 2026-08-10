// src/services/subscription.service.ts
import { api } from "@/lib/api";

export interface SubscriptionStats {
  mrr: number;
  active_subs: number;
  total_plans: number;
  [key: string]: unknown;
}
export interface UserSubscription {
  id: string;
  user_id?: string;
  user_name?: string;
  email?: string;
  package_name?: string;
  plan_name?: string;
  price?: number;
  status?: string;
  started_at?: string;
  ends_at?: string;
  created_at?: string;
  [key: string]: unknown;
}
export const subscriptionService = {
  async getStats(): Promise<SubscriptionStats> {
    return api<SubscriptionStats>("/subscriptions/stats");
  },
  async listUsers(params?: { page?: number; limit?: number }): Promise<unknown> {
    return api<unknown>("/subscriptions/users", { params });
  },
};