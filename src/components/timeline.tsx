"use client";

import { useEffect, useState } from "react";
import { Check, Eye, Thermometer, Scale, AlertTriangle, Loader2, MessageSquareText } from "lucide-react";
import type { InspectionEvent } from "@/lib/pipeline/run";
import type { PhotoDraft } from "./capture-form";
import { shortModel, useT } from "@/lib/i18n";

interface Props {
  events: InspectionEvent[];
  photos: PhotoDraft[];
  hasTemperatures: boolean;
  noteCount: number;
}

type Status = "pending" | "running" | "done" | "error";

/** Render clock: avoids Date.now() during render (React purity rule). */
function useNow(active: boolean) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = active ? setInterval(tick, 250) : undefined;
    return () => {
      clearTimeout(first);
      if (id) clearInterval(id);
    };
  }, [active]);
  return now;
}

/** Agentic timeline: what each model is doing, live. */
export function Timeline({ events, photos, hasTemperatures, noteCount }: Props) {
  const t = useT();
  const ended = events.some((e) => e.type === "end");
  const now = useNow(!ended);
  const startAt = events.find((e) => e.type === "start")?.at ?? now;

  const photoState = new Map<string, { status: Status; ms?: number; anomalies?: number; findings?: string[]; zone?: string; model?: string; message?: string }>();
  for (const p of photos) photoState.set(p.ref, { status: "pending" });
  let tempState: { status: Status; ms?: number; n?: number; bad?: number; model?: string; message?: string } = { status: hasTemperatures ? "pending" : "done", n: 0, bad: 0 };
  let judgeState: { status: Status; model?: string; ms?: number; fallback?: string; startedAt?: number; message?: string } = { status: "pending" };
  let notesState: { status: Status; ms?: number; n?: number; facts?: number; model?: string; message?: string } = { status: "pending" };

  for (const e of events) {
    switch (e.type) {
      case "photo:start":
        photoState.set(e.ref, { status: "running", model: e.model });
        break;
      case "photo:done":
        photoState.set(e.ref, {
          status: "done",
          ms: e.ms,
          anomalies: e.observation.anomalies.length,
          findings: e.observation.anomalies.slice(0, 3).map((a) => a.finding),
          zone: e.observation.zone,
          model: photoState.get(e.ref)?.model,
        });
        break;
      case "photo:error":
        photoState.set(e.ref, { status: "error", message: e.message });
        break;
      case "notes:start":
        notesState = { status: "running", model: e.model };
        break;
      case "notes:done":
        notesState = { status: "done", ms: e.ms, n: e.notes.length, facts: e.notes.reduce((a, n) => a + n.facts.length, 0), model: notesState.model };
        break;
      case "notes:error":
        notesState = { status: "error", message: e.message };
        break;
      case "temperatures:start":
        tempState = { status: "running", model: e.model };
        break;
      case "temperatures:done":
        tempState = { status: "done", ms: e.ms, n: e.readings.length, bad: e.readings.filter((r) => !r.compliant).length, model: tempState.model };
        break;
      case "temperatures:error":
        tempState = { status: "error", message: e.message };
        break;
      case "judge:start":
        judgeState = { ...judgeState, status: "running", model: e.model, startedAt: judgeState.startedAt ?? e.at };
        break;
      case "judge:fallback":
        judgeState = { ...judgeState, status: "running", fallback: e.model, model: e.model };
        break;
      case "judge:done":
        judgeState = { ...judgeState, status: "done", ms: e.result.durationMs, model: e.result.model };
        break;
      case "error":
        judgeState = { status: "error", message: e.message };
        break;
    }
  }

  const perceptionModel = [...photoState.values()].find((s) => s.model)?.model;
  const endEvent = events.find((e) => e.type === "end");
  const elapsed = now === 0 ? 0 : Math.max(0, (endEvent ? endEvent.totalMs : now - startAt) / 1000);
  const sec = (ms?: number) => ((ms ?? 0) / 1000).toFixed(1);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 sm:pt-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">{t.inProgress}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t.agentWorking}</h1>
        </div>
        <span className="font-mono text-sm tabular-nums text-ink-2">{elapsed.toFixed(1)} s</span>
      </header>

      <ol className="relative flex flex-col gap-5 border-l border-line pl-6">
        <Step icon={<Eye size={16} />} title={t.perception} model={perceptionModel ? shortModel(perceptionModel) : undefined} status={aggregate([...photoState.values()].map((s) => s.status))}>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {photos.map((p) => {
              const s = photoState.get(p.ref)!;
              return (
                <li key={p.ref} className="overflow-hidden rounded-lg border border-line bg-paper-2 text-xs">
                  <div className="relative aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.dataUrl} alt="" className={`h-full w-full object-cover transition ${s.status === "pending" ? "opacity-50 grayscale" : ""}`} />
                    {s.status === "running" && <span className="argus-scan absolute inset-x-0 h-10" aria-hidden />}
                    <span className="absolute left-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-paper">{p.ref}</span>
                    <span className="absolute right-2 top-2 rounded-full bg-paper-2/90 p-1">
                      <StatusDot status={s.status} />
                    </span>
                    {s.status === "done" && s.zone && (
                      <span className="absolute bottom-2 left-2 rounded bg-paper-2/90 px-1.5 py-0.5 text-[10px] text-ink-2">{t.zone[s.zone as keyof typeof t.zone] ?? s.zone}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 p-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-ink-2">{p.hint || p.name}</span>
                      <span className="flex-none whitespace-nowrap tabular-nums text-ink-3">
                        {s.status === "done" && `${t.anomalies(s.anomalies ?? 0)} · ${sec(s.ms)} s`}
                        {s.status === "running" && t.analysing}
                        {s.status === "error" && t.error}
                      </span>
                    </div>
                    {s.findings && s.findings.length > 0 && (
                      <ul className="flex flex-wrap gap-1">
                        {s.findings.map((f, i) => (
                          <li key={i} className="argus-rise max-w-full truncate rounded-full border border-sev-major/40 bg-sev-major/10 px-2 py-0.5 text-[10px] text-ink" style={{ animationDelay: `${i * 90}ms` }} title={f}>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Step>

        {noteCount > 0 && (
          <Step icon={<MessageSquareText size={16} />} title={t.structuringNotes} model={notesState.model ? shortModel(notesState.model) : undefined} status={notesState.status}>
            <p className="mt-1 text-sm text-ink-2">
              {notesState.status === "pending" && t.waiting}
              {notesState.status === "running" && t.notesRunning}
              {notesState.status === "done" && t.notesDone(notesState.n ?? 0, notesState.facts ?? 0, sec(notesState.ms))}
              {notesState.status === "error" && `${t.error}: ${notesState.message}`}
            </p>
          </Step>
        )}

        <Step icon={<Thermometer size={16} />} title={t.readingLogs} model={tempState.model ? shortModel(tempState.model) : undefined} status={tempState.status}>
          <p className="mt-1 text-sm text-ink-2">
            {!hasTemperatures && t.noLogs}
            {hasTemperatures && tempState.status === "pending" && t.waiting}
            {hasTemperatures && tempState.status === "running" && t.transcribing}
            {hasTemperatures && tempState.status === "done" && t.logsDone(tempState.n ?? 0, tempState.bad ?? 0, sec(tempState.ms))}
            {tempState.status === "error" && `${t.error}: ${tempState.message}`}
          </p>
        </Step>

        <Step icon={<Scale size={16} />} title={t.judgement} model={judgeState.model ? shortModel(judgeState.model) : "Nemotron 3 Ultra 550B"} status={judgeState.status}>
          <p className="mt-1 text-sm text-ink-2">
            {judgeState.status === "pending" && t.judgePending}
            {judgeState.status === "running" && (
              <>
                {t.judgeRunning}{" "}
                <span className="tabular-nums text-ink-3">{(now === 0 ? 0 : Math.max(0, (now - (judgeState.startedAt ?? now)) / 1000)).toFixed(0)} s</span>
              </>
            )}
            {judgeState.status === "done" && t.judgeDone(((judgeState.ms ?? 0) / 1000).toFixed(0))}
            {judgeState.status === "error" && `${t.error}: ${judgeState.message}`}
          </p>
          {judgeState.fallback && (
            <p className="mt-1 flex items-center gap-1 text-xs text-sev-major">
              <AlertTriangle size={12} /> {t.fallback(shortModel(judgeState.fallback))}
            </p>
          )}
        </Step>
      </ol>
    </div>
  );
}

function aggregate(statuses: Status[]): Status {
  if (statuses.some((s) => s === "running")) return "running";
  if (statuses.length && statuses.every((s) => s === "done" || s === "error")) return statuses.every((s) => s === "error") ? "error" : "done";
  if (statuses.some((s) => s === "done")) return "running";
  return "pending";
}

function StatusDot({ status }: { status: Status }) {
  if (status === "done") return <Check size={14} className="text-n1" />;
  if (status === "running") return <Loader2 size={14} className="animate-spin text-accent" />;
  if (status === "error") return <AlertTriangle size={14} className="text-n4" />;
  return <span className="inline-block h-2 w-2 rounded-full bg-line" />;
}

function Step({ icon, title, model, status, children }: { icon: React.ReactNode; title: string; model?: string; status: Status; children: React.ReactNode }) {
  return (
    <li className="relative">
      <span
        className={`absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
          status === "done" ? "border-n1 bg-n1 text-white" : status === "running" ? "argus-pulse border-accent bg-accent text-accent-ink" : status === "error" ? "border-n4 bg-n4 text-white" : "border-line bg-paper text-ink-3"
        }`}
      >
        {status === "done" ? <Check size={12} /> : <span className="scale-75">{icon}</span>}
      </span>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h2 className={`font-medium ${status === "pending" ? "text-ink-3" : ""}`}>{title}</h2>
        {model && <span className="rounded bg-paper-3 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-2">{model}</span>}
      </div>
      {children}
    </li>
  );
}
