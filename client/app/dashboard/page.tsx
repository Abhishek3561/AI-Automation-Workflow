"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, Workflow } from "lucide-react";
import { api, getErrorMessage, type WorkflowSummary } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { inputClass } from "@/lib/styles";
import { AppShell } from "@/components/AppShell";
import { Button, EmptyState, Modal, Spinner, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [workflows, setWorkflows] = useState<WorkflowSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<WorkflowSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get("/workflows")
      .then((res) => setWorkflows(res.data.workflows))
      .catch((err) => {
        toast(getErrorMessage(err, "Could not load workflows"), "error");
        setWorkflows([]);
      });
  }, [toast]);

  async function createWorkflow(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const res = await api.post("/workflows", { name: name.trim() });
      router.push(`/editor/${res.data.workflow.id}`);
    } catch (err) {
      toast(getErrorMessage(err), "error");
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete || deleting) return;
    setDeleting(true);
        try {
      const res = await api.post("/workflows", { name: name.trim() });
      setNewOpen(false);
      setName("");
      router.push(`/editor/${res.data.workflow.id}`);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setCreating(false);
    }
  }

  const visible = (workflows ?? []).filter((w) => w.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell
      title="Workflows"
      subtitle="Build and run your automations."
      actions={
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New workflow
        </Button>
      }
    >
      {workflows === null ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-6 w-6" />
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={<Workflow className="h-6 w-6" />}
          title="Create your first workflow"
          text="Connect a trigger, an AI step, and an approval on the canvas, then run it."
          action={
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" /> New workflow
            </Button>
          }
        />
      ) : (
        <>
          <div className="relative mb-6 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search workflows"
              className={`${inputClass} pl-9`}
            />
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-slate-500">No workflows match your search.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((w) => {
                const last = w.runs?.[0];
                return (
                  <div
                    key={w.id}
                    className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <Link href={`/editor/${w.id}`} className="block">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Workflow className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 truncate font-semibold text-slate-900">{w.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">Updated {timeAgo(w.updatedAt)}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        {last ? (
                          <>
                            <StatusBadge status={last.status} />
                            <span>{timeAgo(last.startedAt)}</span>
                          </>
                        ) : (
                          <span>Never run</span>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => setToDelete(w)}
                      aria-label="Delete workflow"
                      className="absolute right-3 top-3 rounded-lg p-2 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New workflow">
        <form onSubmit={createWorkflow} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Delayed order replies"
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating} disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete workflow?">
        <p className="text-sm text-slate-600">
          &ldquo;{toDelete?.name}&rdquo; and its run history will be permanently deleted.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}