"use client";

import { useRef, useState } from "react";
import { CaptureForm, type CaptureDraft, type CaptureFormHandle } from "./capture-form";
import { Hero } from "./hero";
import { Footer } from "./footer";
import { Timeline } from "./timeline";
import { Report } from "./report";
import { inspect } from "@/lib/client/sse";
import { useLang, useT } from "@/lib/i18n";
import type { InspectionEvent } from "@/lib/pipeline/run";
import type { JudgeResult } from "@/lib/pipeline/judge";
import type { Observation, TemperatureReading } from "@/lib/schemas";

type Phase = "capture" | "running" | "report";

/** Single screen flow: capture → agentic timeline → report. */
export function Inspection() {
  const t = useT();
  const { lang } = useLang();
  const [phase, setPhase] = useState<Phase>("capture");
  const [draft, setDraft] = useState<CaptureDraft | null>(null);
  const [events, setEvents] = useState<InspectionEvent[]>([]);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [temperatures, setTemperatures] = useState<TemperatureReading[]>([]);
  const [observations, setObservations] = useState<Record<string, Observation>>({});
  const [totalMs, setTotalMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const form = useRef<CaptureFormHandle>(null);

  async function start(d: CaptureDraft) {
    setDraft(d);
    setEvents([]);
    setResult(null);
    setError(null);
    setObservations({});
    setPhase("running");
    abort.current?.abort();
    abort.current = new AbortController();
    try {
      for await (const e of inspect(
        {
          establishment: d.establishment,
          photos: d.photos.map((p) => ({ ref: p.ref, dataUrl: p.dataUrl, hint: p.hint || undefined })),
          voiceNotes: d.voiceNotes,
          temperatures: d.temperatures,
          statement: d.statement,
          lang,
        },
        abort.current.signal,
      )) {
        setEvents((list) => [...list, e]);
        if (e.type === "photo:done") setObservations((o) => ({ ...o, [e.ref]: e.observation }));
        if (e.type === "temperatures:done") setTemperatures(e.readings);
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

  if (phase === "capture")
    return (
      <>
        <Hero onStart={() => form.current?.focus()} onDemo={() => form.current?.loadDemo()} />
        <CaptureForm ref={form} onSubmit={start} />
        <Footer />
      </>
    );

  if (phase === "report" && result && draft)
    return (
      <>
        <Report establishment={draft.establishment} result={result} photos={draft.photos} observations={observations} temperatures={temperatures} totalMs={totalMs} onReset={reset} />
        <Footer />
      </>
    );

  return (
    <>
      <Timeline events={events} photos={draft?.photos ?? []} hasTemperatures={Boolean(draft?.temperatures.trim())} noteCount={draft?.voiceNotes.length ?? 0} />
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="rounded-lg border border-n4/40 bg-n4/10 p-4 text-sm">
            <p className="font-medium text-n4">{t.failed}</p>
            <p className="mt-1 text-ink-2">{error}</p>
            <button onClick={reset} className="mt-3 rounded-full border border-line bg-paper-2 px-4 py-1.5 text-sm hover:bg-paper-3">
              {t.backToCapture}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
