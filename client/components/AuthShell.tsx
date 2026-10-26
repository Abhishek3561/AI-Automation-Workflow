import Link from "next/link";
import type { ReactNode } from "react";
import { Bot, FileSearch, UserCheck } from "lucide-react";
import { LogoLink } from "@/components/Logo";

const points = [
  { icon: Bot, text: "Agents that plan and use tools" },
  { icon: FileSearch, text: "Answers grounded in your documents" },
  { icon: UserCheck, text: "A person approves before anything ships" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-white text-slate-900 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <LogoLink href="/" />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </div>

      <div className="hidden flex-col justify-center bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white lg:flex">
        <h2 className="max-w-md text-3xl font-semibold leading-tight">
          Workflows that think, retrieve, and ask before they act.
        </h2>
        <ul className="mt-10 space-y-5">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.text} className="flex items-center gap-3 text-indigo-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                {p.text}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}