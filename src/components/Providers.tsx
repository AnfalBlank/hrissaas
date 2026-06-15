"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useSessionRefresh } from "@/lib/use-session-refresh";
import { ToastProvider } from "@/components/ui/Toast";

declare global {
  interface Window {
    __MAS_FRESH_LOGIN__?: boolean;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });
    // Clear all cache on fresh login to prevent stale user data
    if (typeof window !== "undefined" && window.__MAS_FRESH_LOGIN__) {
      qc.clear();
      window.__MAS_FRESH_LOGIN__ = false;
    }
    return qc;
  });

  // Silent JWT refresh setiap 6 jam + saat mount (update branchId/shiftId)
  useSessionRefresh();

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
