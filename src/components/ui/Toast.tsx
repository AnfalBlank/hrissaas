"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  show: (t: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback ke alert jika provider tidak ada (safety)
    return {
      show: (t: Omit<Toast, "id">) => alert(`${t.title}\n${t.message ?? ""}`),
      success: (title: string, message?: string) =>
        console.log("[toast:success]", title, message),
      error: (title: string, message?: string) => alert(`${title}\n${message ?? ""}`),
      info: (title: string, message?: string) =>
        console.log("[toast:info]", title, message),
      warning: (title: string, message?: string) =>
        console.log("[toast:warning]", title, message),
    } as ToastContextValue;
  }
  return ctx;
}

const ICON: Record<ToastType, any> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLE: Record<ToastType, string> = {
  success: "from-emerald-500 to-teal-600",
  error: "from-rose-500 to-red-600",
  info: "from-brand-500 to-accent-600",
  warning: "from-amber-500 to-orange-600",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const api: ToastContextValue = {
    show,
    success: (title, message) => show({ type: "success", title, message }),
    error: (title, message) => show({ type: "error", title, message }),
    info: (title, message) => show({ type: "info", title, message }),
    warning: (title, message) => show({ type: "warning", title, message }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast container */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const Icon = ICON[t.type];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white p-3 shadow-card border border-ink-100 animate-slide-up"
            >
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${STYLE[t.type]} text-white`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-bold text-ink-800">{t.title}</p>
                {t.message && (
                  <p className="mt-0.5 text-xs text-ink-500">{t.message}</p>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="rounded-lg p-1 text-ink-400 hover:bg-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
