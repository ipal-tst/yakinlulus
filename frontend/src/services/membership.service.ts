// src/services/membership.service.ts
import { api } from "@/lib/api";
import {
    MyMembership,
    MembershipPlan,
    MembershipOrder,
    MembershipOrderHistory,
} from "@/types/siswa";

export const membershipService = {
    // GET /membership/me
    async getMyMembership(): Promise<MyMembership> {
        return api<MyMembership>("/membership/me");
    },

    // GET /membership/plans
    async getPlans(): Promise<MembershipPlan[]> {
        const res = await api<MembershipPlan[] | { items: MembershipPlan[] }>("/membership/plans");
        return Array.isArray(res) ? res : (res?.items ?? []);
    },

    // POST /membership/orders
    async createOrder(payload: { plan_id: string; duration?: number; method?: string }): Promise<MembershipOrder> {
        return api<MembershipOrder>("/membership/orders", {
            method: "POST",
            body: payload,
        });
    },

    // PATCH /membership/me/auto-renew
    async setAutoRenew(auto_renew: boolean): Promise<{ message: string }> {
        return api<{ message: string }>("/membership/me/auto-renew", {
            method: "PATCH",
            body: { auto_renew },
        });
    },

    // GET /membership/orders
    async getOrderHistory(params?: { page?: number; limit?: number }): Promise<MembershipOrderHistory[]> {
        const res = await api<MembershipOrderHistory[] | { items: MembershipOrderHistory[] }>("/membership/orders", { params });
        return Array.isArray(res) ? res : (res?.items ?? []);
    },
};