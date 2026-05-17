"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  sheetOnMobile = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  sheetOnMobile?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeMap = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  } as const;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex bg-ink-900/50 backdrop-blur-sm",
        sheetOnMobile
          ? "items-end justify-center md:items-center"
          : "items-center justify-center"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full overflow-hidden bg-white shadow-card animate-slide-up",
          sheetOnMobile
            ? "rounded-t-[2rem] md:rounded-3xl"
            : "rounded-3xl",
          sizeMap[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-start gap-3 border-b border-ink-100 p-5">
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold">{title}</p>
              {description && (
                <p className="mt-0.5 text-xs text-ink-500">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl text-ink-500 hover:bg-ink-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
