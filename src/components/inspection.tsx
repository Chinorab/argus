"use client";

import { useRef, useState } from "react";
import { CaptureForm, type CaptureDraft } from "./capture-form";
import { Timeline } from "./timeline";
import { Report } from "./report";
import { inspect } from "@/lib/client/sse";
import type { InspectionEvent } from "@/lib/pipeline/run";
import type { JudgeResult } from "@/lib/pipeline/judge";
import type { ReleveTemperature } from "@/lib/schemas";

type Phase = "capture" | "running" | "report";

/** Écran unique : capture → timeline agentique → rapport. */
export function Inspection() {
  const [phase, setPhase] = useState<Phase>("capture");
  const [draft, setDraft] = useState<CaptureDraft | null>(null);
  const [events, setEvents] = useState<InspectionEvent[]>([]);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [temperatures, setTemperatures] = useState<ReleveTemperature[]>([]);
  const [totalMs, setTotalMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  async function start(d: CaptureDraft) {
    setDraft(d);
    setEvents([]);
    setResult(null);
    setError(null);
    setPhase("running");
    abort.current?.abort();
    abort.current = new AbortController();
    try {
      for await (const e of inspect(
        {
          etablissement: d.etablissement,
          photos: d.photos.map((p) => ({ ref: p.ref, dataUrl: p.dataUrl, hint: p.hint || undefined })),
          temperatures: d.temperatures,
          declaratif: d.declaratif,
        },
        abort.current.signal,
      )) {
        setEvents((list) => [...list, e]);
        if (e.type === "temperatures:done") setTemperatures(e.releves);
        if (e.type === "judge:done") setResult(e.result);
        if (e.type === "error") setError(e.message);
        if (e.type === "end") setTotalMs(e.totalMs);
      }
      setPhase((p) => (p === "running" ? "report" : p));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function reset() {
    abort.current?.abort();
    setPhase("capture");
    setEvents([]);
    setResult(null);
    setError(null);
  }

  if (phase === "capture") return <CaptureForm onSubmit={start} />;

  if (phase === "report" && result && draft)
    return <Report etablissement={draft.etablissement} result={result} photos={draft.photos} temperatures={temperatures} totalMs={totalMs} onReset={reset} />;

  return (
    <>
      <Timeline events={events} photos={draft?.photos ?? []} hasTemperatures={Boolean(draft?.temperatures.trim())} />
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="rounded-lg border border-n4/40 bg-n4/10 p-4 text-sm">
            <p className="font-medium text-n4">L&apos;inspection a échoué</p>
            <p className="mt-1 text-ink-2">{error}</p>
            <button onClick={reset} className="mt-3 rounded-full border border-line bg-paper-2 px-4 py-1.5 text-sm hover:bg-paper-3">
              Revenir à la capture
            </button>
          </div>
        </div>
      )}
    </>
  );
}
