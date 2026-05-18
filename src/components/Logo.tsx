"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Company logo component. Uses /public/logo.png.
 * Renders at the given size with optional className.
 */
export function Logo({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Manggala"
      width={size}
      height={size}
      className={cn("rounded-xl object-contain", className)}
      priority
    />
  );
}
