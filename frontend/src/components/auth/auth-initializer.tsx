"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

export function AuthInitializer() {
    const initAuth = useAuthStore((state) => state.initAuth);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    return null;
}
