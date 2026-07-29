"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 5, // 5 minutes cache
                        gcTime: 1000 * 60 * 15,    // 15 minutes garbage collection
                        refetchOnWindowFocus: false,
                        retry: (failureCount, error: any) => {
                            if (error?.message?.includes("404") || error?.message?.includes("401") || error?.message?.includes("403")) {
                                return false;
                            }
                            return failureCount < 1;
                        },
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
