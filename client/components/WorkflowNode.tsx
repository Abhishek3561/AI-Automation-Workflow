"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NODE_DEFS, type WFNode, type WFNodeData } from "@/lib/nodeTypes";

function previewText(data: WFNodeData): string {
  const c = data.config;
  switch (data.kind) {
    case "trigger":
      if (c.triggerType === "webhook") return "Starts from a webhook";
      if (c.triggerType === "schedule") return `Schedule: ${c.cron ?? ""}`;
      return c.inputText?.trim() || "Starts when you click Run";
    case "condition":
      return `${c.operator ?? "contains"} "${c.value ?? ""}"`;
    default: {
      const def = NODE_DEFS[data.kind];
      const field = def.fields.find((f) => f.type !== "select" && c[f.key]?.trim());
      return field ? c[field.key] : "";
    }
  }
}

export default function WorkflowNode({ data, selected }: NodeProps<WFNode>) {
  const def = NODE_DEFS[data.kind];
  const Icon = def.icon;
  const preview = previewText(data);

  return (
    <div
      className={`relative w-56 rounded-xl border bg-white p-3 shadow-sm transition ${
        selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {def.hasInput && <Handle type="target" position={Position.Left} />}

      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${def.tile}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-sm font-semibold text-slate-900">{def.label}</span>
      </div>

      <p className="mt-2 line-clamp-2 break-words text-xs leading-5 text-slate-500">
        {preview || def.description}
      </p>

      {def.outputs ? (
        <div className="mt-2 space-y-0.5">
          {def.outputs.map((o) => (
            <div
              key={o.id}
              className="relative -mx-3 flex items-center justify-end px-3 py-1.5 text-[11px] font-medium text-slate-500"
            >
              {o.label}
              <Handle id={o.id} type="source" position={Position.Right} />
            </div>
          ))}
        </div>
      ) : (
        def.hasOutput && <Handle type="source" position={Position.Right} />
      )}
    </div>
  );
}