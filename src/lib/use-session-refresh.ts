"use client";

import { useCallback, useEffect, useRef } from "react";

const REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 jam — silent refresh JWT
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 menit tanpa aktivitas → auto logout
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

/**
 * Hook gabungan:
 * 1. **Auto refresh** — silent refresh JWT setiap 6 jam (keep session alive).
 * 2. **Auto logout** — jika user idle 30 menit tanpa interaksi, logout otomatis.
 *
 * Jika refresh gagal 401, redirect ke login.
 * Jika idle timeout tercapai, call logout API lalu redirect.
 */
export function useSessionRefresh() {
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivity = useRef(Date.now());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/login?reason=expired";
        return;
      }
    } catch {
      // Network error — skip
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    window.location.href = "/login?reason=idle";
  }, []);

  const resetIdleTimer = useCallback(() => {
    lastActivity.current = Date.now();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    // Skip di halaman login/landing
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/login" || path === "/") return;
    }

    // Initial refresh (update JWT payload — branchId, shiftId, dll)
    refresh();

    // Auto refresh setiap 6 jam
    refreshTimer.current = setInterval(refresh, REFRESH_INTERVAL);

    // Idle detection
    resetIdleTimer();
    ACTIVITY_EVENTS.forEach((ev) =>
      document.addEventListener(ev, resetIdleTimer, { passive: true })
    );

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      ACTIVITY_EVENTS.forEach((ev) =>
        document.removeEventListener(ev, resetIdleTimer)
      );
    };
  }, [refresh, resetIdleTimer]);
}
