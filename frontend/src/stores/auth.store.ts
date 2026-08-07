import { create } from "zustand";
import { User } from "@/types";
import { authStorage } from "@/lib/auth";

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setAuth: (user: User, token: string) => void;
    updateUser: (user: Partial<User>) => void;
    logout: () => void;
    initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    setAuth: (user: User, token: string) => {
        authStorage.setToken(token);
        authStorage.setUser(user);
        set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
        });
    },

    updateUser: (updatedFields: Partial<User>) => {
        set((state) => {
            if (!state.user) return state;
            const updatedUser = { ...state.user, ...updatedFields };
            authStorage.setUser(updatedUser);
            return { user: updatedUser };
        });
    },

    logout: () => {
        authStorage.clear();
        set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });
    },

    initAuth: () => {
        const token = authStorage.getToken();
        const user = authStorage.getUser();
        if (token && user) {
            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } else {
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },
}));
