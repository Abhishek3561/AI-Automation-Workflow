"use client";

import { LoaderCircle, X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClass, type Size, type Variant } from "@/lib/styles";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button {...props} disabled={disabled || loading} className={`${buttonClass(variant, size)} ${className}`}>
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

const statusMap: Record<string, { label: string; chip: string; dot: string }> = {
  PENDING: { label: "Queued", chip: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  RUNNING: { label: "Running", chip: "bg-blue-50 text-blue-700", dot: "bg-blue-500 animate-pulse" },
  COMPLETED: { label: "Completed", chip: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  FAILED: { label: "Failed", chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
  WAITING_APPROVAL: { label: "Needs approval", chip: "bg-amber-50 text-amber-700", dot: "bg-amber-500 animate-pulse" },
  SKIPPED: { label: "Skipped", chip: "bg-slate-100 text-slate-500", dot: "bg-slate-300" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? statusMap.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <LoaderCircle className={`animate-spin text-indigo-600 ${className}`} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}