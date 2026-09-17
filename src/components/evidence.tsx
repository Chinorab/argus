"use client";

import type { Finding, Observation } from "@/lib/schemas";
import type { PhotoDraft } from "./capture-form";
import { SEVERITY_COLOR, useT } from "@/lib/i18n";

interface Props {
  photos: PhotoDraft[];
  observations: Record<string, Observation>;
  findings: Finding[];
}

/** Photo evidence: what the vision model saw on each photo and which findings rely on it. */
export function EvidenceGallery({ photos, observations, findings }: Props) {
  const t = useT();
  if (!photos.length) return null;
  return (
    <section className="argus-rise flex flex-col gap-3" style={{ animationDelay: "150ms" }}>
      <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">{t.evidencePhotos}</h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {photos.map((p) => {
          const obs = observations[p.ref];
          const linked = findings.filter((f) => f.evidence.type === "photo" && f.evidence.ref.includes(p.ref));
          return (
            <li key={p.ref} className="print-avoid-break overflow-hidden rounded-lg border border-line bg-paper-2 text-xs">
              <div className="relative aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.dataUrl} alt={p.hint || p.name} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-paper">{p.ref}</span>
                {obs && <span className="absolute bottom-2 left-2 rounded bg-paper-2/90 px-1.5 py-0.5 text-[10px] text-ink-2">{t.zone[obs.zone]}</span>}
                {linked.length > 0 && (
                  <span className="absolute bottom-2 right-2 flex gap-1">
                    {linked.map((f) => (
                      <span key={f.id} className={`rounded px-1.5 py-0.5 font-mono text-[10px] text-white ${SEVERITY_COLOR[f.severity]}`}>
                        {f.id}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-2.5">
                <p className="truncate text-ink-2">{p.hint || p.name}</p>
                {obs && obs.anomalies.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {obs.anomalies.slice(0, 4).map((a, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: `color-mix(in srgb, var(--n4) ${Math.round(a.confidence * 100)}%, var(--ink-3))` }} />
                        <span className="flex-1 leading-snug">{a.finding}</span>
                        <span className="font-mono text-[10px] text-ink-3">{Math.round(a.confidence * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-3">—</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
