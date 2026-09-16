import { readFile } from "node:fs/promises";
import path from "node:path";
import { MODELS, nebius, extractJson } from "@/lib/nebius";
import { Rapport, type Observation, type ReleveTemperature } from "@/lib/schemas";
import type { AudioNote } from "./perceive";

export interface Dossier {
  etablissement: { nom: string; type: "restauration_commerciale" };
  photos: { ref: string; hint?: string; observation: Observation }[];
  temperatures: ReleveTemperature[];
  notesVocales: AudioNote[];
  /** Déclaratif du gérant : PMS existant ? formation ? etc. */
  declaratif?: string;
}

let referentielCache: string | undefined;
export async function loadReferentiel(): Promise<string> {
  if (!referentielCache) {
    referentielCache = await readFile(
      path.join(process.cwd(), "src/lib/referentiel/restauration-commerciale.md"),
      "utf8",
    );
  }
  return referentielCache;
}

function buildSystem(referentiel: string): string {
  return `Tu es un inspecteur sanitaire expérimenté de la DDPP, en mission d'inspection dans un
établissement de restauration commerciale. Tu appliques STRICTEMENT le référentiel ci-dessous.
Tu ne retiens que des non-conformités étayées par une preuve du dossier (photo, relevé,
note vocale, déclaratif). Tu ne DÉDUIS jamais une non-conformité d'une absence de preuve :
ce qui n'a pas été observé ni déclaré va dans "points_a_verifier" (ce que tu contrôlerais
sur place), jamais dans "non_conformites" ni dans "points_forts". Chaque non-conformité cite le point de la grille (ex. B3) et le
texte (ex. CE 852/2004 annexe II chap. IX). Tu qualifies la sévérité selon le barème § 4 et
tu prédis la note Alim'confiance en appliquant les règles § 4 à la lettre. Tu rédiges la
synthèse comme dans un vrai rapport d'inspection : factuel, précis, sans jugement de valeur.

=== RÉFÉRENTIEL ===
${referentiel}
=== FIN DU RÉFÉRENTIEL ===

Réponds UNIQUEMENT avec un objet JSON :
{
  "note_predite": "tres_satisfaisant|satisfaisant|a_ameliorer|a_corriger_de_maniere_urgente",
  "justification_note": "règle § 4 appliquée et décompte des non-conformités par sévérité",
  "synthese_inspecteur": "8-12 lignes, style rapport officiel",
  "non_conformites": [{
    "id": "NC-01",
    "titre": "court",
    "zone": "reception|stockage_sec|stockage_froid|legumerie|preparation_froide|preparation_chaude|cuisson|plonge|dechets|vestiaires_sanitaires|salle|exterieur|inconnue (inconnue pour les non-conformités documentaires ou générales)",
    "severite": "mineure|majeure|critique",
    "constat": "ce qui a été observé, précis",
    "reference_reglementaire": "point de grille + texte",
    "risque": "danger pour le consommateur",
    "preuve": {"type": "photo|temperature|audio|declaratif", "ref": "identifiant de la preuve"},
    "action_corrective": "action concrète",
    "delai": "immediat|24h|7j|30j (valeur exacte)"
  }],
  "points_forts": ["uniquement ce qui est observé ou déclaré"],
  "points_a_verifier": ["contrôles à faire sur place, sans preuve dans le dossier"],
  "risque_fermeture": "faible|modere|eleve"
}`;
}

function buildDossierText(d: Dossier): string {
  const lines: string[] = [];
  lines.push(`# Dossier d'inspection — ${d.etablissement.nom} (restauration commerciale)`);
  lines.push("\n## Photos analysées");
  for (const p of d.photos) {
    lines.push(`\n### Preuve ${p.ref}${p.hint ? ` — contexte : ${p.hint}` : ""}`);
    lines.push(`Zone : ${p.observation.zone}`);
    lines.push(`Description : ${p.observation.description}`);
    if (p.observation.equipements.length)
      lines.push(`Équipements : ${p.observation.equipements.join(", ")}`);
    for (const a of p.observation.anomalies)
      lines.push(
        `- Anomalie (confiance ${a.confiance.toFixed(2)}) : ${a.constat}${a.localisation ? ` [${a.localisation}]` : ""}`,
      );
    for (const pp of p.observation.points_positifs) lines.push(`- Point positif : ${pp}`);
  }
  lines.push("\n## Relevés de température");
  if (!d.temperatures.length) lines.push("Aucun relevé fourni (absence d'enregistrement à signaler, C3).");
  d.temperatures.forEach((t, i) =>
    lines.push(
      `- T-${String(i + 1).padStart(2, "0")} ${t.equipement} (${t.type}) : ${t.valeur_c} °C${t.horodatage ? ` le ${t.horodatage}` : ""}, limite ${t.limite_c ?? "?"} °C → ${t.conforme ? "conforme" : "NON CONFORME"}${t.commentaire ? ` — ${t.commentaire}` : ""}`,
    ),
  );
  lines.push("\n## Notes vocales du gérant");
  if (!d.notesVocales.length) lines.push("Aucune.");
  d.notesVocales.forEach((n, i) => {
    lines.push(`- A-${String(i + 1).padStart(2, "0")} « ${n.transcription} »`);
    n.faits.forEach((f) => lines.push(`  · fait : ${f}`));
  });
  lines.push("\n## Déclaratif");
  lines.push(d.declaratif?.trim() || "Aucune information sur le PMS, la formation ou la traçabilité.");
  return lines.join("\n");
}

export interface JudgeResult {
  rapport: Rapport;
  modele: string;
  dureeMs: number;
  dossierTexte: string;
  /** Chaîne de raisonnement renvoyée par Nemotron (champ `reasoning`), pour la timeline. */
  raisonnement?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/** Étape 3 — jugement réglementaire par Nemotron Ultra, repli sur Super. */
export async function judge(
  dossier: Dossier,
  onEvent?: (e: { type: "start" | "fallback" | "done"; modele: string; ms?: number }) => void,
): Promise<JudgeResult> {
  const referentiel = await loadReferentiel();
  const system = buildSystem(referentiel);
  const dossierTexte = buildDossierText(dossier);

  const attempt = async (modele: string) => {
    const t0 = Date.now();
    onEvent?.({ type: "start", modele });
    const res = await nebius.chat.completions.create({
      model: modele,
      temperature: 0.1,
      max_tokens: 16000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: dossierTexte },
      ],
    });
    const msg = res.choices[0]?.message as { content?: string | null; reasoning?: string } | undefined;
    if (res.choices[0]?.finish_reason === "length")
      throw new Error(`réponse tronquée (max_tokens), ${res.usage?.completion_tokens} tokens générés`);
    const rapport = Rapport.parse(extractJson(msg?.content ?? ""));
    const ms = Date.now() - t0;
    onEvent?.({ type: "done", modele, ms });
    return { rapport, modele, dureeMs: ms, dossierTexte, raisonnement: msg?.reasoning, usage: res.usage };
  };

  try {
    return await attempt(MODELS.judge);
  } catch (err) {
    onEvent?.({ type: "fallback", modele: MODELS.judgeFallback });
    console.warn(`[argus] ${MODELS.judge} a échoué (${(err as Error).message}), repli sur ${MODELS.judgeFallback}`);
    return await attempt(MODELS.judgeFallback);
  }
}
