import { Zap } from "lucide-react";
import { APP_NAME } from "@/lib/brand";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <Zap className="h-4 w-4" />
      </span>
      {APP_NAME}
    </span>
  );
}

// a plain link does a full page load, so the page refreshes every time it is clicked
export function LogoLink({ href = "/" }: { href?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href={href} aria-label={`${APP_NAME} home`} className="inline-flex">
      <Logo />
    </a>
  );
}