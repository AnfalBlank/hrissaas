"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  back = "/app",
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 bg-ink-50/80 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={back}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white border border-ink-100 shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-display font-bold leading-tight">{title}</p>
            {subtitle && <p className="text-[11px] text-ink-500">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}
