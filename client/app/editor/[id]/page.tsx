"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, History, MousePointerClick, Play, Save } from "lucide-react";

import { api, getErrorMessage, publicApiOrigin } from "@/lib/api";
import { NODE_DEFS, type NodeKind, type WFNode } from "@/lib/nodeTypes";
import { buttonClass } from "@/lib/styles";
import WorkflowNode from "@/components/WorkflowNode";
import Sidebar from "@/components/Sidebar";
import SettingsPanel from "@/components/SettingsPanel";
import { Button, FullPageSpinner } from "@/components/ui";
import { useToast } from "@/components/Toast";

const nodeTypes = { workflow: WorkflowNode };

// older nodes get any settings that were added later
function withDefaults(n: WFNode): WFNode {
  const def = NODE_DEFS[n.data.kind];
  if (!def) return n;
  return { ...n, data: { ...n.data, config: { ...def.defaults, ...n.data.config } } };
}

function Editor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<WFNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [name, setName] = useState("");
  const [webhookToken, setWebhookToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const counter = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/workflows/${id}`);
        const wf = res.data.workflow;
        setName(wf.name);
        setNodes((wf.graph?.nodes ?? []).map(withDefaults));
        setEdges(wf.graph?.edges ?? []);
        setWebhookToken(wf.webhookToken ?? "");
      } catch {
        router.push("/dashboard");
        return;
      }
      setLoading(false);
    }
    load();
  }, [id, router, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  function createNode(kind: NodeKind, position: { x: number; y: number }): WFNode {
    counter.current += 1;
    const def = NODE_DEFS[kind];
    return {
      id: `${kind}-${Date.now()}-${counter.current}`,
      type: "workflow",
      position,
      data: { kind, label: def.label, config: { ...def.defaults } },
    };
  }

  function addNodeByClick(kind: NodeKind) {
    const offset = nodes.length * 30;
    setNodes((nds) => [...nds, createNode(kind, { x: 120 + offset, y: 100 + offset })]);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/reactflow") as NodeKind;
    if (!kind || !NODE_DEFS[kind]) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes((nds) => [...nds, createNode(kind, position)]);
  }

  function updateConfig(nodeId: string, key: string, value: string) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, [key]: value } } }
          : n
      )
    );
  }

  function deleteNode(nodeId: string) {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }

  // saves the graph, returns true if it worked
  async function persist(): Promise<boolean> {
    try {
      const cleanNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      }));
      const cleanEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
        animated: true,
      }));
      await api.put(`/workflows/${id}`, {
        name,
        graph: { nodes: cleanNodes, edges: cleanEdges },
      });
      return true;
    } catch (err) {
      toast(getErrorMessage(err, "Save failed"), "error");
      return false;
    }
  }

  async function save() {
    if (saving || running) return;
    setSaving(true);
    try {
      if (await persist()) toast("Workflow saved");
    } finally {
      setSaving(false);
    }
  }

  async function runWorkflow() {
    if (saving || running) return;
    setRunning(true);
    try {
      if (!(await persist())) return;
      const res = await api.post(`/workflows/${id}/run`);
      router.push(`/runs/${res.data.runId}`);
    } catch (err) {
      toast(getErrorMessage(err, "Could not start the run"), "error");
    } finally {
      setRunning(false);
    }
  }

  const selectedNode = nodes.find((n) => n.selected);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/dashboard"
            aria-label="Back to workflows"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Workflow name"
            className="min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1 text-base font-semibold text-slate-900 hover:border-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/editor/${id}/history`} className={buttonClass("ghost", "sm")}>
            <History className="h-4 w-4" /> History
          </Link>
          <Button variant="secondary" size="sm" loading={saving} disabled={running} onClick={save}>
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button size="sm" loading={running} disabled={saving} onClick={runWorkflow}>
            <Play className="h-4 w-4" /> Run
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar onAdd={addNodeByClick} />

        <div className="relative min-w-0 flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background gap={20} size={1.5} color="#cbd5e1" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor="#c7d2fe" maskColor="rgba(241,245,249,0.7)" />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/90 px-8 py-6 text-center shadow-sm">
                <MousePointerClick className="mx-auto h-6 w-6 text-indigo-500" />
                <p className="mt-3 text-sm font-medium text-slate-900">Start building</p>
                <p className="mt-1 text-xs text-slate-500">
                  Drag a node from the left, or click one to add it. Begin with Start.
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedNode && (
          <SettingsPanel
            node={selectedNode}
            webhookUrl={webhookToken ? `${publicApiOrigin()}/api/hooks/${webhookToken}` : ""}
            onChange={updateConfig}
            onDelete={deleteNode}
          />
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <ReactFlowProvider>
        <Editor />
      </ReactFlowProvider>
    </Suspense>
  );
}