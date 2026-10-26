import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function TopBar({
  backHref,
  backLabel,
  title,
  right,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>
          <span className="h-5 w-px bg-slate-200" />
          <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
        </div>
        {right}
      </div>
    </header>
  );
}