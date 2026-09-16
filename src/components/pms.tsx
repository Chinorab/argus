"use client";

import { ShieldCheck } from "lucide-react";
import type { PmsResult } from "@/lib/pipeline/pms";
import { shortModel, useT } from "@/lib/i18n";

/** Food Safety Management Plan (PMS) rendered from the structured output of Nemotron Super. */
export function PmsView({ result }: { result: PmsResult }) {
  const t = useT();
  const p = result.pms;
  const profile = p.establishment_profile;

  return (
    <section className="argus-rise flex flex-col gap-8 print-break-before" aria-labelledby="pms-title">
      <header className="flex flex-col gap-1 border-t border-line pt-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">{t.pmsSubtitle}</p>
        <h2 id="pms-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldCheck size={22} className="text-accent" /> {t.pmsTitle}
        </h2>
        <p className="text-sm text-ink-3">{t.pmsWrittenBy(shortModel(result.model), (result.durationMs / 1000).toFixed(0))}</p>
      </header>

      {/* Profile */}
      <Block title={t.profile}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row k={t.activity} v={profile.activity} />
          <Row k={t.capacity} v={profile.capacity} />
          <Row k={t.staffLabel} v={profile.staff} />
          <Row k={t.productFamilies} v={profile.product_families.join(", ")} />
        </dl>
      </Block>

      {/* Priority actions first: it is what the operator needs on Monday morning */}
      {p.priority_actions.length > 0 && (
        <Block title={t.priorityActions}>
          <ol className="flex flex-col gap-2">
            {p.priority_actions.map((a, i) => (
              <li key={i} className="flex gap-3 rounded-md border border-line bg-paper-2 p-3 text-sm">
                <span className="mt-0.5 h-fit flex-none rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] uppercase text-paper">{t.deadlineLabel[a.deadline] ?? a.deadline}</span>
                <span className="flex-1">
                  {a.action}
                  {a.addresses && <span className="ml-2 font-mono text-[11px] text-ink-3">· {t.addresses} {a.addresses}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Block>
      )}

      {/* Good hygiene practices */}
      <Block title={t.ghp}>
        <div className="grid gap-3 sm:grid-cols-2">
          {p.good_hygiene_practices.map((g, i) => (
            <article key={i} className="flex flex-col gap-2 rounded-md border border-line bg-paper-2 p-3 text-sm print-avoid-break">
              <h4 className="font-medium">{g.theme}</h4>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-ink-2">
                {g.rules.map((r, j) => (
                  <li key={j}>{r}</li>
                ))}
              </ul>
              <p className="mt-auto flex flex-wrap gap-x-3 pt-1 text-xs text-ink-3">
                {g.responsible && (
                  <span>
                    {t.responsible}: <span className="text-ink-2">{g.responsible}</span>
                  </span>
                )}
                {g.frequency && (
                  <span>
                    {t.frequency}: <span className="text-ink-2">{g.frequency}</span>
                  </span>
                )}
                {g.record && (
                  <span>
                    {t.record}: <span className="text-ink-2">{g.record}</span>
                  </span>
                )}
              </p>
            </article>
          ))}
        </div>
      </Block>

      {/* HACCP */}
      <Block title={t.haccp}>
        <ol className="relative flex flex-col gap-2 border-l border-line pl-5">
          {p.process_flow.map((s, i) => (
            <li key={i} className="relative print-avoid-break">
              <span className={`absolute -left-[26px] top-1 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-semibold ${s.is_ccp ? "border-n4 bg-n4 text-white" : "border-line bg-paper text-ink-3"}`}>{i + 1}</span>
              <div className="rounded-md border border-line bg-paper-2 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-medium">{s.step}</h4>
                  {s.is_ccp && <span className="rounded bg-n4 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">{t.ccp}</span>}
                </div>
                {s.hazards.length > 0 && (
                  <p className="mt-1 text-xs text-ink-2">
                    <span className="text-ink-3">{t.hazards}:</span> {s.hazards.join(" · ")}
                  </p>
                )}
                {s.is_ccp && s.ccp && (
                  <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 rounded bg-paper-3 p-2.5 text-xs sm:grid-cols-2">
                    <Row k={t.criticalLimit} v={s.ccp.critical_limit} />
                    <Row k={t.monitoring} v={s.ccp.monitoring} />
                    <Row k={t.correctiveAction} v={s.ccp.corrective_action} />
                    <Row k={t.record} v={s.ccp.record} />
                  </dl>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Block>

      {/* Records */}
      {p.records.length > 0 && (
        <Block title={t.recordsTitle}>
          <div className="overflow-x-auto rounded-lg border border-line bg-paper-2">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-3">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 font-medium">{t.record}</th>
                  <th className="px-3 py-2 font-medium">{t.frequency}</th>
                  <th className="px-3 py-2 font-medium">{t.holder}</th>
                </tr>
              </thead>
              <tbody>
                {p.records.map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-3 py-1.5">{r.name}</td>
                    <td className="px-3 py-1.5 text-ink-2">{r.frequency}</td>
                    <td className="px-3 py-1.5 text-ink-2">{r.holder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      )}

      <div className="grid gap-8 sm:grid-cols-2">
        <ListBlock title={t.traceability} items={p.traceability} />
        <ListBlock title={t.nonconformity} items={p.nonconformity_procedure} />
        <ListBlock title={t.recall} items={p.recall_procedure} />
        <ListBlock title={t.training} items={p.training_plan} />
      </div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium uppercase tracking-wider text-ink-3">{title}</h3>
      {children}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Block title={title}>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-ink-2">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ol>
    </Block>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="flex flex-col">
      <dt className="text-ink-3">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
