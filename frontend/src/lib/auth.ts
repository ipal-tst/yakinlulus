import { User } from "@/types";

const TOKEN_KEY = "yl_token";
const USER_KEY = "yl_user";

export const authStorage = {
    getToken(): string | null {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token: string): void {
        if (typeof window === "undefined") return;
        localStorage.setItem(TOKEN_KEY, token);
    },

    removeToken(): void {
        if (typeof window === "undefined") return;
        localStorage.removeItem(TOKEN_KEY);
    },

    getUser(): User | null {
        if (typeof window === "undefined") return null;
        const data = localStorage.getItem(USER_KEY);
        if (!data) return null;
        try {
            return JSON.parse(data) as User;
        } catch {
            return null;
        }
    },

    setUser(user: User): void {
        if (typeof window === "undefined") return;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    removeUser(): void {
        if (typeof window === "undefined") return;
        localStorage.removeItem(USER_KEY);
    },

    clear(): void {
        this.removeToken();
        this.removeUser();
    },
};
