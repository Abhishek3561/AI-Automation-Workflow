"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { NODE_DEFS, NODE_GROUPS, type NodeKind } from "@/lib/nodeTypes";
import { inputClass } from "@/lib/styles";

export default function Sidebar({ onAdd }: { onAdd: (kind: NodeKind) => void }) {
  const [query, setQuery] = useState("");

  function onDragStart(e: React.DragEvent, kind: NodeKind) {
    e.dataTransfer.setData("application/reactflow", kind);
    e.dataTransfer.effectAllowed = "move";
  }

  const q = query.trim().toLowerCase();
  const defs = Object.values(NODE_DEFS).filter(
    (d) => !q || d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <h2 className="text-sm font-semibold text-slate-900">Nodes</h2>
        <p className="mt-0.5 text-xs text-slate-500">Drag onto the canvas, or click to add.</p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {NODE_GROUPS.map((group) => {
          const items = defs.filter((d) => d.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group}</p>
              <div className="space-y-2">
                {items.map((def) => {
                  const Icon = def.icon;
                  return (
                    <div
                      key={def.kind}
                      draggable
                      onDragStart={(e) => onDragStart(e, def.kind)}
                      onClick={() => onAdd(def.kind)}
                      className="flex cursor-grab items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-indigo-300 hover:bg-indigo-50/40 active:cursor-grabbing"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${def.tile}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{def.label}</p>
                        <p className="truncate text-xs text-slate-500">{def.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {defs.length === 0 && <p className="text-sm text-slate-500">No nodes match your search.</p>}
      </div>
    </aside>
  );
}