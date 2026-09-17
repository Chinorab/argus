"use client";

import { useState } from "react";
import { Download, RotateCcw, ChevronDown, Camera, Thermometer, MessageSquareText, FileText, Printer, ShieldCheck, Loader2 } from "lucide-react";
import type { JudgeResult } from "@/lib/pipeline/judge";
import type { PmsResult } from "@/lib/pipeline/pms";
import { PmsView } from "./pms";
import { ZoneMap } from "./zone-map";
import { EvidenceGallery } from "./evidence";
import type { Finding, Observation, TemperatureReading } from "@/lib/schemas";
import type { PhotoDraft } from "./capture-form";
import { GRADE_COLOR, GRADE_ORDER, SEVERITY_COLOR, SEVERITY_ORDER, shortModel, useLang, useT } from "@/lib/i18n";

interface Props {
  establishment: string;
  result: JudgeResult;
  photos: PhotoDraft[];
  observations: Record<string, Observation>;
  temperatures: TemperatureReading[];
  totalMs: number;
  onReset: () => void;
}

export function Report({ establishment, result, photos, observations, temperatures, totalMs, onReset }: Props) {
  const t = useT();
  const { lang } = useLang();
  const r = result.report;
  const counts = SEVERITY_ORDER.map((s) => [s, r.findings.filter((f) => f.severity === s).length] as const);
  const [pms, setPms] = useState<PmsResult | null>(null);
  const [pmsBusy, setPmsBusy] = useState(false);
  const [pmsError, setPmsError] = useState<string | null>(null);

  async function generatePms() {
    setPmsBusy(true);
    setPmsError(null);
    try {
      const res = await fetch("/api/pms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ establishment, caseText: result.caseText, report: r, lang }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setPms(body as PmsResult);
    } catch (err) {
      setPmsError((err as Error).message);
    } finally {
      setPmsBusy(false);
    }
  }
  const date = new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  function download() {
    const blob = new Blob([JSON.stringify({ establishment, date: new Date().toISOString(), ...result, pms: pms?.pms }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `argus-${(establishment || "inspection").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <article className="print-root mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pb-24 pt-6 sm:pt-10">
      {/* Header and verdict */}
      <header className="argus-rise flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">{t.reportTitle}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{establishment || t.establishment}</h1>
          </div>
          <p className="text-sm text-ink-3">
            {date} · {(totalMs / 1000).toFixed(0)} s · {t.judgedBy} {shortModel(result.model)}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-paper-2">
          <div className={`${GRADE_COLOR[r.predicted_grade]} px-5 py-6 text-white`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">{t.predictedGrade}</p>
            <p className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">{t.grade[r.predicted_grade]}</p>
            <p className="mt-2 text-sm opacity-90">
              {t.closureRisk}: {t.closure[r.closure_risk]}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-px bg-line">
            {GRADE_ORDER.map((g) => {
              const active = g === r.predicted_grade;
              return (
                <div key={g} className={`flex flex-col items-center gap-1.5 bg-paper-2 px-1 py-2.5 text-center text-[10px] leading-tight sm:text-xs ${active ? "text-ink" : "text-ink-3"}`}>
                  <span className={`h-1.5 w-full rounded-full ${GRADE_COLOR[g]} ${active ? "" : "opacity-25"}`} />
                  {t.grade[g]}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-5 py-3 text-sm">
            {counts.map(([s, n]) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${SEVERITY_COLOR[s]}`} />
                <strong className="tabular-nums">{n}</strong> {t.severityPlural[s]}
              </span>
            ))}
            <span className="ml-auto text-xs text-ink-3">{r.grade_rationale}</span>
          </div>
        </div>
      </header>

      {/* Summary */}
      <section className="argus-rise flex flex-col gap-2" style={{ animationDelay: "60ms" }}>
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">{t.summary}</h2>
        <p className="whitespace-pre-line border-l-2 border-accent pl-4 text-[15px] leading-relaxed">{r.inspector_summary}</p>
      </section>

      <ZoneMap findings={r.findings} />
      <EvidenceGallery photos={photos} observations={observations} findings={r.findings} />

      {/* Findings */}
      {SEVERITY_ORDER.map((sev) => {
        const list = r.findings.filter((f) => f.severity === sev);
        if (!list.length) return null;
        return (
          <section key={sev} className="argus-rise flex flex-col gap-3" style={{ animationDelay: "120ms" }}>
            <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-ink-3">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${SEVERITY_COLOR[sev]}`} />
              {t.findingsOf(t.severityPlural[sev])}
            </h2>
            <ul className="flex flex-col gap-3">
              {list.map((f) => (
                <FindingCard key={f.id} finding={f} photos={photos} />
              ))}
            </ul>
          </section>
        );
      })}

      {/* Strengths and to-verify */}
      <div className="grid gap-8 sm:grid-cols-2">
        {r.strengths.length > 0 && (
          <section className="argus-rise flex flex-col gap-2" style={{ animationDelay: "180ms" }}>
            <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">{t.strengths}</h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              {r.strengths.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-n1" />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}
        {r.to_verify.length > 0 && (
          <section className="argus-rise flex flex-col gap-2" style={{ animationDelay: "180ms" }}>
            <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">{t.toVerify}</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
              {r.to_verify.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-3.5 w-3.5 flex-none rounded-sm border border-line" />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Readings */}
      {temperatures.length > 0 && (
        <section className="argus-rise flex flex-col gap-2" style={{ animationDelay: "220ms" }}>
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">{t.readings}</h2>
          <div className="overflow-x-auto rounded-lg border border-line bg-paper-2">
            <table className="w-full whitespace-nowrap text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-3">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 font-medium">{t.equipment}</th>
                  <th className="px-3 py-2 font-medium">{t.date}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.reading}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.limit}</th>
                  <th className="px-3 py-2 font-medium">{t.verdict}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {temperatures.map((x, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="max-w-[12rem] truncate px-3 py-1.5" title={x.equipment}>{x.equipment}</td>
                    <td className="px-3 py-1.5 text-ink-3">{x.timestamp ?? "—"}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${x.compliant ? "" : "text-n4"}`}>{x.value_c} °C</td>
                    <td className="px-3 py-1.5 text-right font-mono text-ink-3">
                      {x.kind === "hot_holding" ? "≥" : "≤"} {x.limit_c} °C
                    </td>
                    <td className="px-3 py-1.5 text-xs">
                      {x.compliant ? <span className="text-n1">{t.compliant}</span> : <span className="text-n4">{x.persistent_drift ? t.persistentDrift : t.outOfRange}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Reasoning */}
      {result.reasoning && (
        <div className="print-hidden">
          <Reasoning text={result.reasoning} model={result.model} usage={result.usage} />
        </div>
      )}

      {/* Food safety plan */}
      {pms ? (
        <PmsView result={pms} />
      ) : (
        <section className="print-hidden flex flex-col items-start gap-2 rounded-xl border border-dashed border-line p-5">
          <button
            onClick={generatePms}
            disabled={pmsBusy}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition enabled:hover:opacity-90 disabled:opacity-60"
          >
            {pmsBusy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {pmsBusy ? t.generatingPms : t.generatePms}
          </button>
          {pmsError && <p className="text-sm text-n4">{pmsError}</p>}
        </section>
      )}

      <p className="hidden text-xs text-ink-3 print-visible">{t.printedBy}</p>

      <footer className="print-hidden flex flex-wrap items-center gap-3">
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-full border border-line bg-paper-2 px-4 py-2 text-sm hover:bg-paper-3" title={t.pdfHint}>
          <Printer size={15} /> {t.downloadPdf}
        </button>
        <button onClick={download} className="flex items-center gap-2 rounded-full border border-line bg-paper-2 px-4 py-2 text-sm hover:bg-paper-3">
          <Download size={15} /> {t.download}
        </button>
        <button onClick={onReset} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink-2 hover:bg-paper-3">
          <RotateCcw size={15} /> {t.newOne}
        </button>
      </footer>
    </article>
  );
}



function FindingCard({ finding: f, photos }: { finding: Finding; photos: PhotoDraft[] }) {
  const t = useT();
  const photo = f.evidence.type === "photo" ? photos.find((p) => f.evidence.ref.includes(p.ref)) : undefined;
  const EvidenceIcon = f.evidence.type === "photo" ? Camera : f.evidence.type === "temperature" ? Thermometer : f.evidence.type === "audio" ? MessageSquareText : FileText;
  return (
    <li className="flex gap-4 rounded-lg border border-line bg-paper-2 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-ink-3">{f.id}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white ${SEVERITY_COLOR[f.severity]}`}>{t.severity[f.severity]}</span>
          <span className="text-[11px] text-ink-3">{t.zone[f.zone]}</span>
        </div>
        <h3 className="font-medium leading-snug">{f.title}</h3>
        <p className="text-sm text-ink-2">{f.observation}</p>
        <p className="font-mono text-[11px] text-ink-3">{f.regulatory_reference}</p>
        <div className="mt-1 rounded-md bg-paper-3 p-3 text-sm">
          <p>
            <span className="font-medium">{t.action}:</span> {f.corrective_action}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-2">
            <span>
              <span className="text-ink-3">{t.deadline}</span> {t.deadlineLabel[f.deadline] ?? f.deadline}
            </span>
            <span>
              <span className="text-ink-3">{t.risk}</span> {f.risk}
            </span>
          </p>
        </div>
      </div>
      <div className="flex w-20 flex-none flex-col items-center gap-1 text-[10px] text-ink-3 sm:w-24">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.dataUrl} alt={photo.hint} className="aspect-[4/3] w-full rounded-md object-cover" />
        ) : (
          <span className="flex aspect-[4/3] w-full items-center justify-center rounded-md bg-paper-3">
            <EvidenceIcon size={18} />
          </span>
        )}
        <span className="truncate text-center">{f.evidence.ref}</span>
      </div>
    </li>
  );
}

function Reasoning({ text, model, usage }: { text: string; model: string; usage?: JudgeResult["usage"] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-lg border border-line bg-paper-2">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm">
        <span>
          <span className="font-medium">{t.reasoningOf(shortModel(model))}</span>
          {usage && <span className="ml-2 text-xs text-ink-3">{t.tokens(usage.completion_tokens)}</span>}
        </span>
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t border-line px-4 py-3 font-mono text-xs leading-relaxed text-ink-2">{text}</pre>}
    </section>
  );
}
