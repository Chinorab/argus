"use client";

import { useEffect, useState } from "react";
import { Eye, Thermometer, Scale, ShieldCheck, Camera, Mic, FileText, ArrowDown } from "lucide-react";
import { GRADE_COLOR, GRADE_ORDER, useT } from "@/lib/i18n";

/** Landing hero shown above the capture form: what Argus does, how, and what you get. */
export function Hero({ onStart, onDemo, busy }: { onStart: () => void; onDemo: (caseId: "clean" | "problem") => void; busy?: boolean }) {
  const t = useT();
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-14 px-4 pb-6 pt-10 sm:pt-16">
      {/* Headline + verdict preview */}
      <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">{t.heroKicker}</p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            {t.heroA} <span className="text-accent">{t.heroB}</span>
          </h1>
          <p className="max-w-xl text-lg text-ink-2">{t.heroText}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={onStart} className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition hover:opacity-90">
              {t.startInspection}
            </button>
            <div className="flex overflow-hidden rounded-full border border-line bg-paper-2 text-sm">
              <button onClick={() => onDemo("clean")} disabled={busy} className="flex items-center gap-1.5 px-4 py-2.5 transition hover:bg-paper-3 disabled:opacity-50">
                <span className="h-2 w-2 rounded-full bg-n2" /> {t.tryDemoClean}
              </button>
              <span className="w-px bg-line" />
              <button onClick={() => onDemo("problem")} disabled={busy} className="flex items-center gap-1.5 px-4 py-2.5 transition hover:bg-paper-3 disabled:opacity-50">
                <span className="h-2 w-2 rounded-full bg-n4" /> {t.tryDemoProblem}
              </button>
            </div>
          </div>
          <p className="text-xs text-ink-3">{t.demoHint}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-3">
            <li className="flex items-center gap-1.5">
              <Camera size={13} /> {t.inputPhotos}
            </li>
            <li className="flex items-center gap-1.5">
              <Mic size={13} /> {t.inputVoice}
            </li>
            <li className="flex items-center gap-1.5">
              <Thermometer size={13} /> {t.inputLogs}
            </li>
            <li className="flex items-center gap-1.5">
              <FileText size={13} /> {t.inputStatement}
            </li>
          </ul>
        </div>

        <VerdictPreview />
      </div>

      {/* How it works */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">{t.howItWorks}</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          <StepCard n={1} icon={<Eye size={18} />} title={t.step1Title} text={t.step1Text} model="MiniCPM-V 4.5" />
          <StepCard n={2} icon={<Thermometer size={18} />} title={t.step2Title} text={t.step2Text} model="Nemotron 3 Nano 30B + rules" />
          <StepCard n={3} icon={<Scale size={18} />} title={t.step3Title} text={t.step3Text} model="Nemotron 3 Ultra 550B" />
        </ol>
      </div>

      {/* What you get */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">{t.whatYouGet}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <GetCard title={t.get1Title} text={t.get1Text}>
            <div className="flex gap-1">
              {["bg-n1", "bg-n2", "bg-n3", "bg-n4"].map((c, i) => (
                <span key={c} className={`h-2 flex-1 rounded-full ${c} ${i === 3 ? "" : "opacity-30"}`} />
              ))}
            </div>
          </GetCard>
          <GetCard title={t.get2Title} text={t.get2Text}>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded bg-sev-critical px-1.5 py-0.5 font-medium uppercase tracking-wider text-white">Critical</span>
              <span className="font-mono text-ink-3">B2 · AM 21/12/2009</span>
              <span className="ml-auto font-mono text-ink-3">T-07</span>
            </div>
          </GetCard>
          <GetCard title={t.get3Title} text={t.get3Text}>
            <div className="flex items-center gap-2 text-[11px] text-ink-3">
              <ShieldCheck size={14} className="text-accent" /> HACCP · CCP · records · 30-day plan
            </div>
          </GetCard>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-ink-3">
        <ArrowDown size={14} /> {t.scrollToForm}
      </div>
    </section>
  );
}

/** Miniature of the report verdict, cycling through the four grades. */
function VerdictPreview() {
  const t = useT();
  const [i, setI] = useState(3);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % 4), 2600);
    return () => clearInterval(id);
  }, []);
  const grade = GRADE_ORDER[i];
  return (
    <div className="argus-rise relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-accent-soft/60 blur-2xl" aria-hidden />
      <div className="overflow-hidden rounded-xl border border-line bg-paper-2 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]">
        <div className={`${GRADE_COLOR[grade]} px-5 py-5 text-white`}>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">{t.predictedGrade}</p>
          <p key={grade} className="argus-rise mt-1 text-xl font-semibold leading-tight">{t.grade[grade]}</p>
        </div>
        <div className="grid grid-cols-4 gap-px bg-line">
          {GRADE_ORDER.map((g) => (
            <div key={g} className="bg-paper-2 px-1 py-2">
              <span className={`block h-1.5 w-full rounded-full transition-opacity duration-300 ${GRADE_COLOR[g]} ${g === grade ? "" : "opacity-25"}`} />
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-2 p-4 text-xs">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 flex-none rounded-full bg-sev-critical" /> <span className="truncate">Fridge 2 (meat) — cold chain failure, 5 readings 6.5–7.4 °C</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 flex-none rounded-full bg-sev-major" /> <span className="truncate">Bain-marie at 58 °C (≥ 63 °C required)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 flex-none rounded-full bg-sev-minor" /> <span className="truncate">Blast chiller gasket — grease build-up</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StepCard({ n, icon, title, text, model }: { n: number; icon: React.ReactNode; title: string; text: string; model: string }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line bg-paper-2 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">{icon}</span>
        <span className="font-mono text-xs text-ink-3">0{n}</span>
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-ink-2">{text}</p>
      <span className="mt-auto w-fit rounded bg-paper-3 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-2">{model}</span>
    </li>
  );
}

function GetCard({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper-2 p-4">
      <div className="rounded-md bg-paper-3 p-3">{children}</div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-ink-2">{text}</p>
    </div>
  );
}
