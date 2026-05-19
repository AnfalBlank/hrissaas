"use client";

import { useEffect, useRef } from "react";

const REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 jam

/**
 * Hook yang secara silent refresh JWT setiap 6 jam.
 * Jika gagal (401), redirect ke login.
 */
export function useSessionRefresh() {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (res.status === 401) {
          // Session expired — redirect ke login
          window.location.href = "/login";
        }
      } catch {
        // Network error — skip, coba lagi nanti
      }
    }

    // Refresh segera saat mount (untuk update branchId/shiftId di JWT)
    refresh();

    timer.current = setInterval(refresh, REFRESH_INTERVAL);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);
}
