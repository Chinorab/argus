import { z } from "zod";

/** Normalise une valeur libre du modèle vers une clé d'enum : minuscules, sans accents, `_`. */
const slug = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/** Enum tolérant : accepte les variantes d'écriture, sinon retombe sur `fallback`. */
function lenientEnum<const T extends readonly [string, ...string[]]>(values: T, fallback: T[number], aliases: Record<string, T[number]> = {}) {
  const base = z.enum(values);
  return z.preprocess((v) => {
    const s = slug(v);
    if ((values as readonly string[]).includes(s)) return s;
    if (aliases[s]) return aliases[s];
    const hit = values.find((x) => s.startsWith(x) || x.startsWith(s) || s.includes(x));
    return hit ?? fallback;
  }, base);
}

/** Zones d'une cuisine de restauration commerciale (grille DGAL). */
const ZONES = [
  "reception",
  "stockage_sec",
  "stockage_froid",
  "legumerie",
  "preparation_froide",
  "preparation_chaude",
  "cuisson",
  "plonge",
  "dechets",
  "vestiaires_sanitaires",
  "salle",
  "exterieur",
  "inconnue",
] as const;
export const Zone = lenientEnum(ZONES, "inconnue", {
  chambre_froide: "stockage_froid",
  frigo: "stockage_froid",
  reserve: "stockage_sec",
  economat: "stockage_sec",
  cuisine: "preparation_chaude",
  laverie: "plonge",
  poubelles: "dechets",
  local_dechets: "dechets",
  sanitaires: "vestiaires_sanitaires",
  vestiaires: "vestiaires_sanitaires",
  documentaire: "inconnue",
  documents: "inconnue",
  pms: "inconnue",
  administratif: "inconnue",
  personnel: "inconnue",
  etablissement: "inconnue",
  general: "inconnue",
});
export type Zone = z.infer<typeof Zone>;
export const ZONE_VALUES = ZONES;

export const Severite = lenientEnum(["mineure", "majeure", "critique"], "majeure", { moyenne: "majeure", mineur: "mineure", majeur: "majeure" });
export type Severite = z.infer<typeof Severite>;

/** Les 4 niveaux Alim'confiance (arrêté du 15 décembre 2016). */
export const NoteAlimConfiance = lenientEnum(
  ["tres_satisfaisant", "satisfaisant", "a_ameliorer", "a_corriger_de_maniere_urgente"],
  "a_ameliorer",
  { a_corriger: "a_corriger_de_maniere_urgente", urgent: "a_corriger_de_maniere_urgente" },
);
export type NoteAlimConfiance = z.infer<typeof NoteAlimConfiance>;

/** Sortie de l'étape 1 (perception Omni) pour une photo. */
export const Observation = z.object({
  zone: Zone,
  description: z.string(),
  equipements: z.array(z.string()).default([]),
  anomalies: z
    .array(
      z.object({
        constat: z.string(),
        localisation: z.string().nullish(),
        confiance: z.number().min(0).max(1),
      }),
    )
    .default([]),
  points_positifs: z.array(z.string()).default([]),
});
export type Observation = z.infer<typeof Observation>;

/** Relevé de température normalisé (étape 2). */
export const ReleveTemperature = z.object({
  equipement: z.string(),
  type: z.enum(["froid_positif", "froid_negatif", "chaud", "refroidissement", "autre"]),
  valeur_c: z.number(),
  horodatage: z.string().nullish(),
  limite_c: z.number().nullish(),
  conforme: z.boolean(),
  commentaire: z.string().nullish(),
});
export type ReleveTemperature = z.infer<typeof ReleveTemperature>;

/** Non-conformité qualifiée par le juge (étape 3). */
export const NonConformite = z.object({
  id: z.string(),
  titre: z.string(),
  zone: Zone,
  severite: Severite,
  constat: z.string(),
  reference_reglementaire: z.string(),
  risque: z.string(),
  preuve: z.object({
    type: lenientEnum(["photo", "temperature", "audio", "declaratif"], "declaratif", { releve: "temperature", vocal: "audio", note_vocale: "audio" }),
    ref: z.string(),
  }),
  action_corrective: z.string(),
  delai: lenientEnum(["immediat", "24h", "7j", "30j"], "7j", {
    immediate: "immediat", sans_delai: "immediat", "24_h": "24h", "1j": "24h", "1_jour": "24h", "7_j": "7j", "7_jours": "7j", "1_semaine": "7j", "30_j": "30j", "30_jours": "30j", "1_mois": "30j",
  }),
});
export type NonConformite = z.infer<typeof NonConformite>;

/** Rapport d'inspection simulée complet. */
export const Rapport = z.object({
  note_predite: NoteAlimConfiance,
  justification_note: z.string(),
  synthese_inspecteur: z.string(),
  non_conformites: z.array(NonConformite),
  points_forts: z.array(z.string()),
  /** Points que l'inspecteur voudra vérifier sur place, faute de preuve dans le dossier. */
  points_a_verifier: z.array(z.string()).default([]),
  risque_fermeture: lenientEnum(["faible", "modere", "eleve"], "modere"),
});
export type Rapport = z.infer<typeof Rapport>;
