"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

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
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
