"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

async function getConfig() {
  const res = await fetch("/api/realtime/config", { credentials: "include" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.ok ? json.data : null;
}

export async function ensureSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;
  const cfg = await getConfig();
  if (!cfg) return null;
  if (socket) socket.disconnect();
  socket = io({
    path: cfg.path || "/api/socket",
    auth: {
      companyId: cfg.companyId,
      role: cfg.role,
      userId: cfg.userId,
      employeeId: cfg.employeeId,
    },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
  return socket;
}

export function useRealtime<T = any>(event: string, handler: (data: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    let s: Socket | null = null;
    const cb = (d: T) => handlerRef.current(d);
    (async () => {
      s = await ensureSocket();
      if (!s || !active) return;
      setConnected(s.connected);
      s.on("connect", () => setConnected(true));
      s.on("disconnect", () => setConnected(false));
      s.on(event, cb);
    })();
    return () => {
      active = false;
      s?.off(event, cb);
    };
  }, [event]);

  return { connected };
}
