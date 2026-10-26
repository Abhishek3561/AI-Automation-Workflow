"use client";

import { useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { NODE_DEFS, type WFNode } from "@/lib/nodeTypes";
import { inputClass } from "@/lib/styles";
import { Button } from "@/components/ui";

type Props = {
  node: WFNode;
  webhookUrl: string;
  onChange: (nodeId: string, key: string, value: string) => void;
  onDelete: (nodeId: string) => void;
};

export default function SettingsPanel({ node, webhookUrl, onChange, onDelete }: Props) {
  const def = NODE_DEFS[node.data.kind];
  const Icon = def.icon;
  const [copied, setCopied] = useState(false);

  const visibleFields = def.fields.filter(
    (f) => !f.showWhen || node.data.config[f.showWhen.key] === f.showWhen.equals
  );
  const isWebhook = node.data.kind === "trigger" && node.data.config.triggerType === "webhook";

  async function copyUrl() {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 p-4">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${def.tile}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{def.label}</h2>
          <p className="text-xs text-slate-500">{def.description}</p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {visibleFields.length === 0 && (
          <p className="text-sm text-slate-500">This node has no settings. It shows whatever reaches it.</p>
        )}

        {visibleFields.map((field) => {
          const value = node.data.config[field.key] ?? "";
          return (
            <div key={field.key}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}</label>
              {field.type === "textarea" && (
                <textarea
                  rows={5}
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(e) => onChange(node.id, field.key, e.target.value)}
                  className={inputClass}
                />
              )}
              {field.type === "text" && (
                <input
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(e) => onChange(node.id, field.key, e.target.value)}
                  className={inputClass}
                />
              )}
              {field.type === "select" && (
                <select
                  value={value}
                  onChange={(e) => onChange(node.id, field.key, e.target.value)}
                  className={inputClass}
                >
                  {field.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
              {field.hint && <p className="mt-1.5 text-xs text-slate-500">{field.hint}</p>}
            </div>
          );
        })}

        {isWebhook && webhookUrl && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-800">Webhook URL</p>
            <p className="mt-1.5 break-all rounded-md bg-white p-2 font-mono text-xs text-slate-700">
              {webhookUrl}
            </p>
            <button
              onClick={copyUrl}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy URL"}
            </button>
            <p className="mt-2 text-xs text-slate-600">
              Save first. A POST to this URL starts the workflow, and the request body becomes the output of
              this node. Keep the URL secret.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-4">
        <Button variant="danger" className="w-full" onClick={() => onDelete(node.id)}>
          <Trash2 className="h-4 w-4" /> Delete node
        </Button>
      </div>
    </aside>
  );
}