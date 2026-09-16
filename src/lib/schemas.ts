import { z } from "zod";

/** Zones d'une cuisine de restauration commerciale (grille DGAL). */
export const Zone = z.enum([
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
]);
export type Zone = z.infer<typeof Zone>;

export const Severite = z.enum(["mineure", "majeure", "critique"]);
export type Severite = z.infer<typeof Severite>;

/** Les 4 niveaux Alim'confiance (arrêté du 15 décembre 2016). */
export const NoteAlimConfiance = z.enum([
  "tres_satisfaisant",
  "satisfaisant",
  "a_ameliorer",
  "a_corriger_de_maniere_urgente",
]);
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
        localisation: z.string().optional(),
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
  horodatage: z.string().optional(),
  limite_c: z.number().optional(),
  conforme: z.boolean(),
  commentaire: z.string().optional(),
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
    type: z.enum(["photo", "temperature", "audio", "declaratif"]),
    ref: z.string(),
  }),
  action_corrective: z.string(),
  delai: z.enum(["immediat", "24h", "7j", "30j"]),
});
export type NonConformite = z.infer<typeof NonConformite>;

/** Rapport d'inspection simulée complet. */
export const Rapport = z.object({
  note_predite: NoteAlimConfiance,
  justification_note: z.string(),
  synthese_inspecteur: z.string(),
  non_conformites: z.array(NonConformite),
  points_forts: z.array(z.string()),
  risque_fermeture: z.enum(["faible", "modere", "eleve"]),
});
export type Rapport = z.infer<typeof Rapport>;
