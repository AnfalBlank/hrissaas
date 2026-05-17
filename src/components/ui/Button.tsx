import { forwardRef, ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-glow",
        secondary:
          "bg-white text-ink-800 border border-ink-200 hover:bg-ink-50",
        ghost: "text-ink-700 hover:bg-ink-100",
        danger: "bg-danger-500 text-white hover:bg-danger-600",
        soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        xl: "h-14 px-6 text-base",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  }
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>;

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant, size, block, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(button({ variant, size, block }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
