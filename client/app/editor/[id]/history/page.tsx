"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, History as HistoryIcon, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { buttonClass } from "@/lib/styles";
import { TopBar } from "@/components/TopBar";
import { EmptyState, FullPageSpinner, StatusBadge } from "@/components/ui";

type RunItem = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
};

function History() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [runs, setRuns] = useState<RunItem[] | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/workflows/${id}`), api.get(`/workflows/${id}/runs`)])
      .then(([wf, list]) => {
        setName(wf.data.workflow.name);
        setRuns(list.data.runs);
      })
      .catch(() => router.push("/dashboard"));
  }, [id, router]);

  if (!runs) return <FullPageSpinner />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        backHref={`/editor/${id}`}
        backLabel="Editor"
        title={`${name || "Workflow"}: run history`}
        right={
          <Link href={`/editor/${id}`} className={buttonClass("secondary", "sm")}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        }
      />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {runs.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon className="h-6 w-6" />}
            title="No runs yet"
            text="Click Run in the editor, call the webhook, or set a schedule, and runs will show up here."
          />
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {runs.map((r) => {
              const secs = r.finishedAt
                ? ((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000).toFixed(1)
                : null;
              return (
                <li key={r.id}>
                  <Link
                    href={`/runs/${r.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{new Date(r.startedAt).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">
                        {timeAgo(r.startedAt)}
                        {secs ? ` · took ${secs}s` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={r.status} />
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <History />
    </Suspense>
  );
}