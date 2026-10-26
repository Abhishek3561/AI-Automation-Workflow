"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { Button, EmptyState, Modal, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Doc = { id: string; filename: string; chunkCount: number; createdAt: string };

export default function DocumentsPage() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    const res = await api.get("/documents");
    setDocs(res.data.documents);
  }

  useEffect(() => {
    refresh().catch((err) => {
      toast(getErrorMessage(err, "Could not load documents"), "error");
      setDocs([]);
    });
  }, [toast]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post("/documents", form);
      await refresh();
      toast(`${file.name} is ready to search`);
    } catch (err) {
      toast(getErrorMessage(err, "Upload failed"), "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function confirmDelete() {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${toDelete.id}`);
      setDocs((list) => (list ?? []).filter((d) => d.id !== toDelete.id));
      toast("Document deleted");
      setToDelete(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell
      title="Documents"
      subtitle="Files your workflows and agents can search. Answers cite these sources."
    >
      <div className="mb-8 flex flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {uploading ? <Spinner className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
        </div>
        <p className="text-sm font-medium text-slate-900">
          {uploading ? "Reading and indexing your file..." : "Upload a PDF, TXT, or MD file"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {uploading ? "This can take a few seconds." : "Up to 10 MB. Scanned PDFs are not supported yet."}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFile}
          disabled={uploading}
          className="hidden"
        />
        <Button className="mt-5" disabled={uploading} onClick={() => fileRef.current?.click()}>
          Choose file
        </Button>
      </div>

      {docs === null ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No documents yet"
          text="Upload a policy, manual, or notes, then add a Search Documents step to a workflow."
        />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-4 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{d.filename}</p>
                <p className="text-xs text-slate-500">
                  {d.chunkCount} parts &middot; added {timeAgo(d.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setToDelete(d)}
                aria-label="Delete document"
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete document?">
        <p className="text-sm text-slate-600">
          &ldquo;{toDelete?.filename}&rdquo; will be removed and workflows can no longer search it.
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