"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, LogOut, Workflow } from "lucide-react";
import { api, type User } from "@/lib/api";
import { LogoLink } from "@/components/Logo";
import { FullPageSpinner } from "@/components/ui";

const nav = [
  { href: "/dashboard", label: "Workflows", icon: Workflow },
  { href: "/documents", label: "Documents", icon: FileText },
];

function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  async function logout() {
    await api.post("/auth/logout");
    router.push("/login");
  }

  if (!user) return <FullPageSpinner />;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 px-2 pt-1">
          <LogoLink href="/dashboard" />
        </div>
        <Suspense fallback={null}>
          <NavLinks />
        </Suspense>
        <div className="mt-auto flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <LogoLink href="/dashboard" />
          <button onClick={logout} className="text-sm text-slate-600">
            Log out
          </button>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}