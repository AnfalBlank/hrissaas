import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-ink-100 text-ink-700",
  success: "bg-success-500/10 text-success-600",
  warning: "bg-warning-500/15 text-warning-600",
  danger: "bg-danger-500/10 text-danger-600",
  brand: "bg-brand-500/10 text-brand-700",
  outline: "border border-ink-200 text-ink-600",
} as const;

export function Badge({
  className,
  variant = "default",
  ...p
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...p}
    />
  );
}
