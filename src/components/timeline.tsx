"use client";

import { useEffect, useState } from "react";
import { Check, Eye, Thermometer, Scale, AlertTriangle, Loader2 } from "lucide-react";
import type { InspectionEvent } from "@/lib/pipeline/run";
import type { PhotoDraft } from "./capture-form";
import { shortModel } from "@/lib/labels";

interface Props {
  events: InspectionEvent[];
  photos: PhotoDraft[];
  hasTemperatures: boolean;
}

type Status = "pending" | "running" | "done" | "error";

/** Horloge de rendu : évite Date.now() pendant le rendu (règle de pureté React). */
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

/** Timeline agentique : ce que chaque modèle fait, en direct. */
export function Timeline({ events, photos, hasTemperatures }: Props) {
  const ended = events.some((e) => e.type === "end");
  const now = useNow(!ended);
  const startAt = events.find((e) => e.type === "start")?.at ?? now;

  const photoState = new Map<string, { status: Status; ms?: number; anomalies?: number; modele?: string; message?: string }>();
  for (const p of photos) photoState.set(p.ref, { status: "pending" });
  let tempState: { status: Status; ms?: number; n?: number; nc?: number; modele?: string; message?: string } = { status: hasTemperatures ? "pending" : "done", n: 0, nc: 0 };
  let judgeState: { status: Status; modele?: string; ms?: number; fallback?: string; startedAt?: number; message?: string } = { status: "pending" };

  for (const e of events) {
    switch (e.type) {
      case "photo:start":
        photoState.set(e.ref, { status: "running", modele: e.modele });
        break;
      case "photo:done":
        photoState.set(e.ref, { status: "done", ms: e.ms, anomalies: e.observation.anomalies.length, modele: photoState.get(e.ref)?.modele });
        break;
      case "photo:error":
        photoState.set(e.ref, { status: "error", message: e.message });
        break;
      case "temperatures:start":
        tempState = { status: "running", modele: e.modele };
        break;
      case "temperatures:done":
        tempState = { status: "done", ms: e.ms, n: e.releves.length, nc: e.releves.filter((r) => !r.conforme).length, modele: tempState.modele };
        break;
      case "temperatures:error":
        tempState = { status: "error", message: e.message };
        break;
      case "judge:start":
        judgeState = { ...judgeState, status: "running", modele: e.modele, startedAt: judgeState.startedAt ?? e.at };
        break;
      case "judge:fallback":
        judgeState = { ...judgeState, status: "running", fallback: e.modele, modele: e.modele };
        break;
      case "judge:done":
        judgeState = { ...judgeState, status: "done", ms: e.result.dureeMs, modele: e.result.modele };
        break;
      case "error":
        judgeState = { status: "error", message: e.message };
        break;
    }
  }

  const perceptionModel = [...photoState.values()].find((s) => s.modele)?.modele;
  const endEvent = events.find((e) => e.type === "end");
  const elapsed = now === 0 ? 0 : Math.max(0, (endEvent ? endEvent.totalMs : now - startAt) / 1000);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 sm:pt-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">Inspection en cours</p>
          <h1 className="text-2xl font-semibold tracking-tight">L&apos;agent travaille</h1>
        </div>
        <span className="font-mono text-sm tabular-nums text-ink-2">{elapsed.toFixed(1)} s</span>
      </header>

      <ol className="relative flex flex-col gap-5 border-l border-line pl-6">
        <Step icon={<Eye size={16} />} title="Perception des photos" model={perceptionModel ? shortModel(perceptionModel) : undefined}
          status={aggregate([...photoState.values()].map((s) => s.status))}>
          <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {photos.map((p) => {
              const s = photoState.get(p.ref)!;
              return (
                <li key={p.ref} className="flex items-center gap-2 rounded-md border border-line bg-paper-2 p-1.5 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataUrl} alt="" className="h-9 w-12 flex-none rounded object-cover" />
                  <span className="font-mono text-[10px] text-ink-3">{p.ref}</span>
                  <span className="flex-1 truncate text-ink-2">{p.hint || p.name}</span>
                  <StatusDot status={s.status} />
                  <span className="w-28 flex-none whitespace-nowrap text-right tabular-nums text-ink-3">
                    {s.status === "done" && `${s.anomalies} anomalie${s.anomalies === 1 ? "" : "s"} · ${((s.ms ?? 0) / 1000).toFixed(1)} s`}
                    {s.status === "running" && "analyse…"}
                    {s.status === "error" && "erreur"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Step>

        <Step icon={<Thermometer size={16} />} title="Lecture des relevés de température" model={tempState.modele ? shortModel(tempState.modele) : undefined} status={tempState.status}>
          <p className="mt-1 text-sm text-ink-2">
            {!hasTemperatures && "Aucun relevé fourni — l'absence d'enregistrement sera signalée."}
            {hasTemperatures && tempState.status === "pending" && "En attente."}
            {hasTemperatures && tempState.status === "running" && "Transcription des relevés, puis application des limites de l'arrêté du 21/12/2009 par le moteur de règles."}
            {hasTemperatures && tempState.status === "done" && `${tempState.n} relevés lus, ${tempState.nc} hors limite · ${((tempState.ms ?? 0) / 1000).toFixed(1)} s`}
            {tempState.status === "error" && `Erreur : ${tempState.message}`}
          </p>
        </Step>

        <Step icon={<Scale size={16} />} title="Jugement réglementaire" model={judgeState.modele ? shortModel(judgeState.modele) : "Nemotron 3 Ultra 550B"} status={judgeState.status}>
          <p className="mt-1 text-sm text-ink-2">
            {judgeState.status === "pending" && "Attend la fin de la perception pour constituer le dossier."}
            {judgeState.status === "running" && (
              <>
                Confronte chaque constat à la grille DGAL et aux textes (CE 852/2004, AM 21/12/2009), qualifie les sévérités, prédit la note.{" "}
                <span className="tabular-nums text-ink-3">{(now === 0 ? 0 : Math.max(0, (now - (judgeState.startedAt ?? now)) / 1000)).toFixed(0)} s</span>
              </>
            )}
            {judgeState.status === "done" && `Rapport rendu en ${((judgeState.ms ?? 0) / 1000).toFixed(0)} s.`}
            {judgeState.status === "error" && `Erreur : ${judgeState.message}`}
          </p>
          {judgeState.fallback && (
            <p className="mt-1 flex items-center gap-1 text-xs text-sev-majeure">
              <AlertTriangle size={12} /> Ultra indisponible, repli sur {shortModel(judgeState.fallback)}.
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
