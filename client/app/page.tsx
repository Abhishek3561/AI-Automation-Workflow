import Link from "next/link";
import {
  ArrowRight,
  Bot,
  FileSearch,
  Flag,
  GitBranch,
  History,
  UserCheck,
  Webhook,
} from "lucide-react";
import { LogoLink } from "@/components/Logo";
import { APP_NAME } from "@/lib/brand";
import { buttonClass } from "@/lib/styles";

const features = [
  {
    icon: Bot,
    title: "Agents that use tools",
    text: "An agent plans its own steps: it queries data, searches documents, and calls APIs. You see every thought and result.",
  },
  {
    icon: FileSearch,
    title: "Search your documents",
    text: "Upload PDFs and text files. Answers come from your content and cite the source passages.",
  },
  {
    icon: UserCheck,
    title: "Human approval",
    text: "Pause a workflow for review. Edit the draft, approve it, and the run continues from where it stopped.",
  },
  {
    icon: Webhook,
    title: "Webhooks and schedules",
    text: "Start a workflow with an HTTP call or a cron schedule, and pass data straight into the first step.",
  },
  {
    icon: GitBranch,
    title: "Branching logic",
    text: "Route runs with If / Else conditions. Paths that are not taken are skipped and clearly marked.",
  },
  {
    icon: History,
    title: "Full run history",
    text: "Inputs, outputs, errors, and timing for every step of every run, so debugging is simple.",
  },
];

const steps = [
  { n: "1", title: "Draw your workflow", text: "Drag nodes onto a canvas and connect them." },
  { n: "2", title: "Add AI where it helps", text: "Prompts, document search, or a tool-using agent." },
  { n: "3", title: "Run it your way", text: "Click Run, call a webhook, or set a schedule." },
];

const mock = [
  { icon: Webhook, title: "Start", sub: "Webhook received", tile: "bg-emerald-100 text-emerald-700" },
  { icon: Bot, title: "AI Agent", sub: "Queries data, searches docs", tile: "bg-fuchsia-100 text-fuchsia-700" },
  { icon: UserCheck, title: "Human Approval", sub: "Review and edit the draft", tile: "bg-orange-100 text-orange-700" },
  { icon: Flag, title: "Show Result", sub: "Reply ready to send", tile: "bg-rose-100 text-rose-700" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <LogoLink href="/" />
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonClass("ghost")}>
            Log in
          </Link>
          <Link href="/register" className={buttonClass("primary")}>
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-12 pt-16 text-center">
        <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          AI workflows with a human in the loop
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          Automate work with AI agents you can supervise
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Build workflows on a visual canvas. Agents search your documents and query your data, and a
          person approves the result before anything goes out.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className={`${buttonClass("primary")} h-11 px-6`}>
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className={`${buttonClass("secondary")} h-11 px-6`}>
            Log in
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xl shadow-slate-200/60">
          <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="ml-3 text-xs text-slate-400">Customer delay workflow</span>
          </div>
          <div className="overflow-x-auto p-8">
            <div className="flex min-w-[720px] items-center justify-center gap-3">
              {mock.map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={m.title} className="flex items-center gap-3">
                    <div className="w-44 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.tile}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium">{m.title}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{m.sub}</p>
                    </div>
                    {i < mock.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Everything a real workflow needs</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-indigo-600 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-semibold tracking-tight">Build your first workflow</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Create an account and have a workflow running in a few minutes.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500">
        {APP_NAME}. Built with Next.js, Express, LangGraph, and pgvector.
      </footer>
    </div>
  );
}