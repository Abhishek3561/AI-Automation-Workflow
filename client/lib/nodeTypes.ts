import type { Node } from "@xyflow/react";
import {
  Bot,
  FileSearch,
  Flag,
  GitBranch,
  Globe,
  Play,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

export type NodeKind =
  | "trigger"
  | "llm"
  | "http"
  | "condition"
  | "rag"
  | "agent"
  | "approval"
  | "output";

export type NodeGroup = "Triggers" | "AI" | "Logic" | "Actions";
export const NODE_GROUPS: NodeGroup[] = ["Triggers", "AI", "Logic", "Actions"];

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  hint?: string;
  // only show this field when another field has a given value
  showWhen?: { key: string; equals: string };
};

export type NodeDef = {
  kind: NodeKind;
  label: string;
  description: string;
  group: NodeGroup;
  icon: LucideIcon;
  tile: string; // colors for the icon tile
  hasInput: boolean;
  hasOutput: boolean;
  outputs?: { id: string; label: string }[];
  fields: FieldDef[];
  defaults: Record<string, string>;
};

export const NODE_DEFS: Record<NodeKind, NodeDef> = {
  trigger: {
    kind: "trigger",
    label: "Start",
    description: "How the workflow starts",
    group: "Triggers",
    icon: Play,
    tile: "bg-emerald-100 text-emerald-700",
    hasInput: false,
    hasOutput: true,
    fields: [
      {
        key: "triggerType",
        label: "How does this workflow start?",
        type: "select",
        options: ["manual", "webhook", "schedule"],
      },
      {
        key: "inputText",
        label: "Starting text",
        type: "textarea",
        placeholder: "Text this workflow starts with",
        hint: "Used by the Run button and by schedules. Webhooks send their own data instead.",
      },
      {
        key: "cron",
        label: "Schedule (cron)",
        type: "text",
        placeholder: "0 9 * * *",
        hint: "For example 0 9 * * * runs every day at 9:00.",
        showWhen: { key: "triggerType", equals: "schedule" },
      },
      {
        key: "timezone",
        label: "Timezone",
        type: "text",
        placeholder: "e.g. Asia/Kolkata or UTC",
        showWhen: { key: "triggerType", equals: "schedule" },
      },
    ],
    defaults: { triggerType: "manual", inputText: "", cron: "0 9 * * *", timezone: "UTC" },
  },
  llm: {
    kind: "llm",
    label: "AI Prompt",
    description: "Ask the language model",
    group: "AI",
    icon: Sparkles,
    tile: "bg-indigo-100 text-indigo-700",
    hasInput: true,
    hasOutput: true,
    fields: [
      {
        key: "prompt",
        label: "Prompt",
        type: "textarea",
        placeholder: "Summarize this: {{previous}}",
        hint: "Use {{previous}} to insert the result of the step before this one.",
      },
    ],
    defaults: { prompt: "" },
  },
  rag: {
    kind: "rag",
    label: "Search Documents",
    description: "Answer from your files",
    group: "AI",
    icon: FileSearch,
    tile: "bg-teal-100 text-teal-700",
    hasInput: true,
    hasOutput: true,
    fields: [
      {
        key: "question",
        label: "Question",
        type: "textarea",
        placeholder: "Leave empty to use the previous result",
        hint: "Leave empty to use the previous step's result as the question.",
      },
      { key: "topK", label: "Passages to retrieve", type: "select", options: ["3", "4", "6", "8"] },
    ],
    defaults: { question: "", topK: "4" },
  },
  agent: {
    kind: "agent",
    label: "AI Agent",
    description: "Plans and uses tools",
    group: "AI",
    icon: Bot,
    tile: "bg-fuchsia-100 text-fuchsia-700",
    hasInput: true,
    hasOutput: true,
    fields: [
      {
        key: "goal",
        label: "Goal",
        type: "textarea",
        placeholder: "What should the agent figure out?",
        hint: "The agent can search your documents, query the sample database, and call public APIs.",
      },
      { key: "maxSteps", label: "Max steps", type: "select", options: ["3", "5", "8"] },
    ],
    defaults: { goal: "", maxSteps: "5" },
  },
  condition: {
    kind: "condition",
    label: "If / Else",
    description: "Branch on a condition",
    group: "Logic",
    icon: GitBranch,
    tile: "bg-violet-100 text-violet-700",
    hasInput: true,
    hasOutput: true,
    outputs: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
    fields: [
      {
        key: "operator",
        label: "If the previous result",
        type: "select",
        options: ["contains", "does not contain", "equals", "is empty", "is not empty"],
      },
      { key: "value", label: "Value", type: "text", placeholder: "e.g. yes" },
    ],
    defaults: { operator: "contains", value: "" },
  },
  approval: {
    kind: "approval",
    label: "Human Approval",
    description: "Pause until a person approves",
    group: "Logic",
    icon: UserCheck,
    tile: "bg-amber-100 text-amber-700",
    hasInput: true,
    hasOutput: true,
    fields: [
      {
        key: "instructions",
        label: "Instructions for the reviewer",
        type: "textarea",
        placeholder: "e.g. Check this draft reply before it continues",
      },
    ],
    defaults: { instructions: "" },
  },
  http: {
    kind: "http",
    label: "HTTP Request",
    description: "Call an API",
    group: "Actions",
    icon: Globe,
    tile: "bg-sky-100 text-sky-700",
    hasInput: true,
    hasOutput: true,
    fields: [
      { key: "method", label: "Method", type: "select", options: ["GET", "POST"] },
      {
        key: "url",
        label: "URL",
        type: "text",
        placeholder: "https://api.example.com/data",
        hint: "{{previous}} works here too.",
      },
    ],
    defaults: { method: "GET", url: "" },
  },
  output: {
    kind: "output",
    label: "Show Result",
    description: "Final output",
    group: "Actions",
    icon: Flag,
    tile: "bg-rose-100 text-rose-700",
    hasInput: true,
    hasOutput: false,
    fields: [],
    defaults: {},
  },
};

export type WFNodeData = {
  kind: NodeKind;
  label: string;
  config: Record<string, string>;
  [key: string]: unknown;
};

export type WFNode = Node<WFNodeData, "workflow">;