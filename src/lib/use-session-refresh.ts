"use client";

import { useEffect, useRef } from "react";

const REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 jam
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 menit
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

/**
 * Auto refresh JWT + auto logout on idle.
 * Uses refs to avoid re-render loops.
 */
export function useSessionRefresh() {
  const mounted = useRef(false);

  useEffect(() => {
    // Skip di login/landing
    const path = window.location.pathname;
    if (path === "/login" || path === "/") return;
    if (mounted.current) return; // prevent double-mount in StrictMode
    mounted.current = true;

    let refreshTimer: ReturnType<typeof setInterval> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    async function refresh() {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (res.status === 401) {
          window.location.href = "/login?reason=expired";
        }
      } catch {
        // network error — skip
      }
    }

    function doLogout() {
      fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
      window.location.href = "/login?reason=idle";
    }

    function resetIdle() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(doLogout, IDLE_TIMEOUT);
    }

    // Initial refresh
    refresh();

    // Periodic refresh
    refreshTimer = setInterval(refresh, REFRESH_INTERVAL);

    // Idle detection
    resetIdle();
    ACTIVITY_EVENTS.forEach((ev) =>
      document.addEventListener(ev, resetIdle, { passive: true })
    );

    return () => {
      mounted.current = false;
      if (refreshTimer) clearInterval(refreshTimer);
      if (idleTimer) clearTimeout(idleTimer);
      ACTIVITY_EVENTS.forEach((ev) =>
        document.removeEventListener(ev, resetIdle)
      );
    };
  }, []); // empty deps — run once
}
