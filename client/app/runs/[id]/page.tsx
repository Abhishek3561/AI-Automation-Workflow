"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Circle, CircleCheck, CircleX, Clock, LoaderCircle, SkipForward, Wrench } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { NODE_DEFS, type NodeKind } from "@/lib/nodeTypes";
import { buttonClass, inputClass } from "@/lib/styles";
import { TopBar } from "@/components/TopBar";
import { Button, FullPageSpinner, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";

type TraceItem = {
  step: number;
  thought: string;
  action: string;
  input: string;
  observation?: string;
};

type Step = {
  id: string;
  nodeId: string;
  nodeType: string;
  status: string;
  input: { previous?: string; instructions?: string } | null;
  output: { text?: string; branch?: string; trace?: TraceItem[]; approved?: boolean } | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

type Run = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  workflow: { id: string; name: string };
  steps: Step[];
};

function seconds(start: string | null, end: string | null) {
  if (!start || !end) return null;
  return ((new Date(end).getTime() - new Date(start).getTime()) / 1000).toFixed(1);
}

function StepIcon({ status }: { status: string }) {
  const base = "h-6 w-6";
  switch (status) {
    case "COMPLETED":
      return <CircleCheck className={`${base} text-emerald-500`} />;
    case "FAILED":
      return <CircleX className={`${base} text-red-500`} />;
    case "RUNNING":
      return <LoaderCircle className={`${base} animate-spin text-blue-500`} />;
    case "WAITING_APPROVAL":
      return <Clock className={`${base} text-amber-500`} />;
    case "SKIPPED":
      return <SkipForward className={`${base} text-slate-300`} />;
    default:
      return <Circle className={`${base} text-slate-300`} />;
  }
}

function AgentTrace({ trace }: { trace: TraceItem[] }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Agent reasoning</p>
      <ol className="space-y-3">
        {trace.map((t) => (
          <li key={t.step} className="rounded-lg border border-fuchsia-100 bg-fuchsia-50/40 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-[11px] font-semibold text-white">
                {t.step}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.action === "finish" ? "bg-emerald-100 text-emerald-700" : "bg-fuchsia-100 text-fuchsia-700"
                }`}
              >
                {t.action !== "finish" && <Wrench className="h-3 w-3" />}
                {t.action}
              </span>
            </div>
            <p className="mt-2 text-sm italic text-slate-700">{t.thought}</p>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2.5 font-mono text-xs text-slate-800">
              {t.input}
            </pre>
            {t.observation !== undefined && (
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs text-slate-600">
                {t.observation}
              </pre>
            )}
            {t.action !== "finish" && t.observation === undefined && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-600">
                <LoaderCircle className="h-3 w-3 animate-spin" /> Running tool...
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ApprovalBox({ runId, step, onDone }: { runId: string; step: Step; onDone: () => void }) {
  const toast = useToast();
  const [text, setText] = useState(step.input?.previous ?? "");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  async function decide(decision: "approve" | "reject") {
    if (busy) return;
    setBusy(decision);
    try {
      await api.post(`/runs/${runId}/steps/${step.id}/decision`, { decision, text });
      toast(decision === "approve" ? "Approved. The run continues." : "Rejected. The run was stopped.");
      onDone();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">This step needs your approval</p>
      {step.input?.instructions && <p className="mt-1 text-sm text-slate-700">{step.input.instructions}</p>}
      <label className="mt-3 block text-xs font-medium text-slate-600">You can edit this before approving</label>
      <textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`${inputClass} mt-1.5`}
      />
      <div className="mt-3 flex gap-2">
        <Button loading={busy === "approve"} disabled={busy !== null} onClick={() => decide("approve")}>
          Approve and continue
        </Button>
        <Button variant="danger" loading={busy === "reject"} disabled={busy !== null} onClick={() => decide("reject")}>
          Reject
        </Button>
      </div>
    </div>
  );
}

function RunView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get(`/runs/${id}`);
        if (cancelled) return;
        setRun(res.data.run);
        if (["PENDING", "RUNNING", "WAITING_APPROVAL"].includes(res.data.run.status)) {
          timer = setTimeout(load, 1500);
        }
      } catch {
        if (!cancelled) router.push("/dashboard");
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, router, tick]);

  if (!run) return <FullPageSpinner />;

  const total = seconds(run.startedAt, run.finishedAt);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        backHref={`/editor/${run.workflow.id}`}
        backLabel="Editor"
        title={run.workflow.name}
        right={
          <div className="flex shrink-0 items-center gap-3">
            {total && <span className="text-sm text-slate-500">{total}s</span>}
            <StatusBadge status={run.status} />
          </div>
        }
      />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {run.steps.map((step, i) => {
          const def = NODE_DEFS[step.nodeType as NodeKind];
          const Icon = def?.icon;
          const label = def?.label ?? step.nodeType;
          const took = seconds(step.startedAt, step.finishedAt);
          const skipped = step.status === "SKIPPED";
          const waiting = step.status === "WAITING_APPROVAL";
          const text = step.output?.text;
          const showOutput =
            text !== undefined && !step.output?.branch && (step.status === "COMPLETED" || text !== "");

          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center">
                  <StepIcon status={step.status} />
                </div>
                {i < run.steps.length - 1 && <div className="mt-1 w-px flex-1 bg-slate-200" />}
              </div>

              <div
                className={`mb-6 min-w-0 flex-1 rounded-xl border bg-white p-4 shadow-sm ${
                  waiting ? "border-amber-300" : "border-slate-200"
                } ${skipped ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {Icon && (
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${def.tile}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <p className="truncate font-medium text-slate-900">{label}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                    {took && !skipped && !waiting && <span>{took}s</span>}
                    <StatusBadge status={step.status} />
                  </div>
                </div>

                {skipped && (
                  <p className="mt-2 text-xs text-slate-500">This branch was not taken, so the step did not run.</p>
                )}

                {step.output?.branch && (
                  <p className="mt-3 text-sm text-slate-700">
                    Condition result:{" "}
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                      {step.output.branch.toUpperCase()}
                    </span>
                  </p>
                )}

                {step.input?.previous && !waiting && (
                  <details className="group mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800">
                      Input
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2.5 font-mono text-xs text-slate-600">
                      {step.input.previous}
                    </pre>
                  </details>
                )}

                {step.output?.trace && step.output.trace.length > 0 && <AgentTrace trace={step.output.trace} />}

                {waiting && <ApprovalBox runId={run.id} step={step} onDone={() => setTick((t) => t + 1)} />}

                {step.output?.approved && (
                  <p className="mt-3 text-xs font-medium text-emerald-700">Approved by a reviewer.</p>
                )}

                {showOutput && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Output</p>
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-emerald-50/60 p-3 font-sans text-sm leading-6 text-slate-900">
                      {text || "(empty)"}
                    </pre>
                  </div>
                )}

                {step.error && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{step.error}</p>
                )}
              </div>
            </div>
          );
        })}

        <div className="mt-2">
          <Link href={`/editor/${run.workflow.id}/history`} className={buttonClass("secondary", "sm")}>
            View all runs
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function RunPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <RunView />
    </Suspense>
  );
}