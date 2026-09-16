"use client";

import { useState } from "react";
import { Download, RotateCcw, ChevronDown, Camera, Thermometer, MessageSquareText, FileText } from "lucide-react";
import type { JudgeResult } from "@/lib/pipeline/judge";
import type { NonConformite, ReleveTemperature, Severite } from "@/lib/schemas";
import type { PhotoDraft } from "./capture-form";
import { DELAI_LABEL, NOTE_COLOR, NOTE_INDEX, NOTE_LABEL, RISQUE_LABEL, SEVERITE_COLOR, SEVERITE_LABEL, ZONE_LABEL, shortModel } from "@/lib/labels";

interface Props {
  etablissement: string;
  result: JudgeResult;
  photos: PhotoDraft[];
  temperatures: ReleveTemperature[];
  totalMs: number;
  onReset: () => void;
}

const ORDRE: Severite[] = ["critique", "majeure", "mineure"];

export function Report({ etablissement, result, photos, temperatures, totalMs, onReset }: Props) {
  const r = result.rapport;
  const counts = ORDRE.map((s) => [s, r.non_conformites.filter((n) => n.severite === s).length] as const);
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  function download() {
    const blob = new Blob([JSON.stringify({ etablissement, date: new Date().toISOString(), ...result }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `argus-${(etablissement || "inspection").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pb-24 pt-6 sm:pt-10">
      {/* En-tête et verdict */}
      <header className="argus-rise flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">Rapport d&apos;inspection simulée</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{etablissement || "Établissement"}</h1>
          </div>
          <p className="text-sm text-ink-3">
            {date} · {(totalMs / 1000).toFixed(0)} s · juge {shortModel(result.modele)}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-paper-2">
          <div className={`${NOTE_COLOR[r.note_predite]} px-5 py-6 text-white`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">Note Alim&apos;confiance prédite</p>
            <p className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">{NOTE_LABEL[r.note_predite]}</p>
            <p className="mt-2 text-sm opacity-90">Risque de fermeture administrative : {RISQUE_LABEL[r.risque_fermeture]}</p>
          </div>
          <div className="grid grid-cols-4 gap-px bg-line">
            {(["tres_satisfaisant", "satisfaisant", "a_ameliorer", "a_corriger_de_maniere_urgente"] as const).map((n) => (
              <div key={n} className={`flex flex-col items-center gap-1.5 bg-paper-2 px-1 py-2.5 text-center text-[10px] leading-tight sm:text-xs ${NOTE_INDEX[n] === NOTE_INDEX[r.note_predite] ? "text-ink" : "text-ink-3"}`}>
                <span className={`h-1.5 w-full rounded-full ${NOTE_COLOR[n]} ${NOTE_INDEX[n] === NOTE_INDEX[r.note_predite] ? "" : "opacity-25"}`} />
                {NOTE_LABEL[n]}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-5 py-3 text-sm">
            {counts.map(([s, n]) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${SEVERITE_COLOR[s]}`} />
                <strong className="tabular-nums">{n}</strong> {SEVERITE_LABEL[s].toLowerCase()}{n > 1 ? "s" : ""}
              </span>
            ))}
            <span className="ml-auto text-xs text-ink-3">{r.justification_note}</span>
          </div>
        </div>
      </header>

      {/* Synthèse */}
      <section className="argus-rise flex flex-col gap-2" style={{ animationDelay: "60ms" }}>
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">Synthèse de l&apos;inspecteur</h2>
        <p className="whitespace-pre-line border-l-2 border-accent pl-4 text-[15px] leading-relaxed">{r.synthese_inspecteur}</p>
      </section>

      {/* Non-conformités */}
      {ORDRE.map((sev) => {
        const list = r.non_conformites.filter((n) => n.severite === sev);
        if (!list.length) return null;
        return (
          <section key={sev} className="argus-rise flex flex-col gap-3" style={{ animationDelay: "120ms" }}>
            <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-ink-3">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${SEVERITE_COLOR[sev]}`} />
              Non-conformités {SEVERITE_LABEL[sev].toLowerCase()}s
            </h2>
            <ul className="flex flex-col gap-3">
              {list.map((nc) => (
                <NcCard key={nc.id} nc={nc} photos={photos} />
              ))}
            </ul>
          </section>
        );
      })}

      {/* Points forts et à vérifier */}
      <div className="grid gap-8 sm:grid-cols-2">
        {r.points_forts.length > 0 && (
          <section className="argus-rise flex flex-col gap-2" style={{ animationDelay: "180ms" }}>
            <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">Points forts</h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              {r.points_forts.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-n1" />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}
        {r.points_a_verifier.length > 0 && (
          <section className="argus-rise flex flex-col gap-2" style={{ animationDelay: "180ms" }}>
            <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">L&apos;inspecteur voudra aussi vérifier</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
              {r.points_a_verifier.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-3.5 w-3.5 flex-none rounded-sm border border-line" />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Relevés */}
      {temperatures.length > 0 && (
        <section className="argus-rise flex flex-col gap-2" style={{ animationDelay: "220ms" }}>
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">Relevés de température analysés</h2>
          <div className="overflow-x-auto rounded-lg border border-line bg-paper-2">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-3">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 font-medium">Équipement</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">Relevé</th>
                  <th className="px-3 py-2 text-right font-medium">Limite</th>
                  <th className="px-3 py-2 font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {temperatures.map((t, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-3 py-1.5">{t.equipement}</td>
                    <td className="px-3 py-1.5 text-ink-3">{t.horodatage ?? "—"}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${t.conforme ? "" : "text-n4"}`}>{t.valeur_c} °C</td>
                    <td className="px-3 py-1.5 text-right font-mono text-ink-3">{t.type === "chaud" ? "≥" : "≤"} {t.limite_c} °C</td>
                    <td className="px-3 py-1.5 text-xs">
                      {t.conforme ? <span className="text-n1">conforme</span> : <span className="text-n4">{t.commentaire?.includes("DÉRIVE") ? "dérive persistante" : "hors limite"}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Raisonnement */}
      {result.raisonnement && <Reasoning text={result.raisonnement} modele={result.modele} usage={result.usage} />}

      <footer className="flex flex-wrap gap-3">
        <button onClick={download} className="flex items-center gap-2 rounded-full border border-line bg-paper-2 px-4 py-2 text-sm hover:bg-paper-3">
          <Download size={15} /> Télécharger le rapport (JSON)
        </button>
        <button onClick={onReset} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink-2 hover:bg-paper-3">
          <RotateCcw size={15} /> Nouvelle inspection
        </button>
      </footer>
    </article>
  );
}

function NcCard({ nc, photos }: { nc: NonConformite; photos: PhotoDraft[] }) {
  const photo = nc.preuve.type === "photo" ? photos.find((p) => nc.preuve.ref.includes(p.ref)) : undefined;
  const PreuveIcon = nc.preuve.type === "photo" ? Camera : nc.preuve.type === "temperature" ? Thermometer : nc.preuve.type === "audio" ? MessageSquareText : FileText;
  return (
    <li className="flex gap-4 rounded-lg border border-line bg-paper-2 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-ink-3">{nc.id}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white ${SEVERITE_COLOR[nc.severite]}`}>{SEVERITE_LABEL[nc.severite]}</span>
          <span className="text-[11px] text-ink-3">{ZONE_LABEL[nc.zone]}</span>
        </div>
        <h3 className="font-medium leading-snug">{nc.titre}</h3>
        <p className="text-sm text-ink-2">{nc.constat}</p>
        <p className="font-mono text-[11px] text-ink-3">{nc.reference_reglementaire}</p>
        <div className="mt-1 rounded-md bg-paper-3 p-3 text-sm">
          <p>
            <span className="font-medium">Action :</span> {nc.action_corrective}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-2">
            <span>
              <span className="text-ink-3">Délai</span> {DELAI_LABEL[nc.delai] ?? nc.delai}
            </span>
            <span>
              <span className="text-ink-3">Risque</span> {nc.risque}
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
            <PreuveIcon size={18} />
          </span>
        )}
        <span className="truncate text-center">{nc.preuve.ref}</span>
      </div>
    </li>
  );
}

function Reasoning({ text, modele, usage }: { text: string; modele: string; usage?: JudgeResult["usage"] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-lg border border-line bg-paper-2">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm">
        <span>
          <span className="font-medium">Raisonnement de {shortModel(modele)}</span>
          {usage && <span className="ml-2 text-xs text-ink-3">{usage.completion_tokens} tokens générés</span>}
        </span>
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t border-line px-4 py-3 font-mono text-xs leading-relaxed text-ink-2">{text}</pre>}
    </section>
  );
}
