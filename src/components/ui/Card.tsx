import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white border border-ink-100 shadow-card",
        className
      )}
      {...p}
    />
  );
}

export function CardHeader({
  className,
  ...p
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-2", className)} {...p} />;
}

export function CardBody({
  className,
  ...p
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...p} />;
}

export function CardFooter({
  className,
  ...p
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pt-2 border-t border-ink-100", className)} {...p} />
  );
}
