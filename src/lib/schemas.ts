import { z } from "zod";

/** Normalises a free-form model value into an enum key: lowercase, no accents, underscores. */
const slug = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/** Lenient enum: accepts spelling variants and aliases, otherwise falls back to `fallback`. */
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

/** Kitchen zones of a commercial restaurant (DGAL inspection grid). */
const ZONES = [
  "receiving",
  "dry_storage",
  "cold_storage",
  "vegetable_prep",
  "cold_prep",
  "hot_prep",
  "cooking",
  "dishwashing",
  "waste",
  "staff_facilities",
  "dining_room",
  "outdoor",
  "general",
] as const;
export const ZONE_VALUES = ZONES;
export const Zone = lenientEnum(ZONES, "general", {
  reception: "receiving",
  delivery: "receiving",
  stockage_sec: "dry_storage",
  pantry: "dry_storage",
  storeroom: "dry_storage",
  stockage_froid: "cold_storage",
  walk_in: "cold_storage",
  fridge: "cold_storage",
  freezer: "cold_storage",
  chambre_froide: "cold_storage",
  legumerie: "vegetable_prep",
  preparation_froide: "cold_prep",
  preparation_chaude: "hot_prep",
  kitchen: "hot_prep",
  cuisson: "cooking",
  plonge: "dishwashing",
  dechets: "waste",
  garbage: "waste",
  vestiaires_sanitaires: "staff_facilities",
  restrooms: "staff_facilities",
  salle: "dining_room",
  exterieur: "outdoor",
  documentation: "general",
  documents: "general",
  staff: "general",
  personnel: "general",
  inconnue: "general",
  unknown: "general",
});
export type Zone = z.infer<typeof Zone>;

export const Severity = lenientEnum(["minor", "major", "critical"], "major", {
  mineure: "minor",
  majeure: "major",
  moyenne: "major",
  medium: "major",
  critique: "critical",
});
export type Severity = z.infer<typeof Severity>;

/** The four Alim'confiance levels published by the French State (order of 15 December 2016). */
export const Grade = lenientEnum(
  ["very_satisfactory", "satisfactory", "to_improve", "urgent_correction"],
  "to_improve",
  {
    tres_satisfaisant: "very_satisfactory",
    satisfaisant: "satisfactory",
    a_ameliorer: "to_improve",
    needs_improvement: "to_improve",
    a_corriger_de_maniere_urgente: "urgent_correction",
    to_correct_urgently: "urgent_correction",
    urgent: "urgent_correction",
  },
);
export type Grade = z.infer<typeof Grade>;

/** Output of step 1 (photo perception). */
export const Observation = z.object({
  zone: Zone,
  description: z.string(),
  equipment: z.array(z.string()).default([]),
  anomalies: z
    .array(
      z.object({
        finding: z.string(),
        location: z.string().nullish(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .default([]),
  positives: z.array(z.string()).default([]),
});
export type Observation = z.infer<typeof Observation>;

/** Normalised temperature reading (step 2 + rule engine). */
export const TemperatureReading = z.object({
  equipment: z.string(),
  kind: z.enum(["chilled", "frozen", "hot_holding", "cooling", "other"]),
  value_c: z.number(),
  timestamp: z.string().nullish(),
  limit_c: z.number().nullish(),
  compliant: z.boolean(),
  note: z.string().nullish(),
  /** Set by the rule engine when ≥ 2 consecutive readings are out of range. */
  persistent_drift: z.boolean().default(false),
});
export type TemperatureReading = z.infer<typeof TemperatureReading>;

/** A non-compliance qualified by the judge (step 3). */
export const Finding = z.object({
  id: z.string(),
  title: z.string(),
  zone: Zone,
  severity: Severity,
  observation: z.string(),
  regulatory_reference: z.string(),
  risk: z.string(),
  evidence: z.object({
    type: lenientEnum(["photo", "temperature", "audio", "declared"], "declared", {
      releve: "temperature",
      reading: "temperature",
      voice: "audio",
      voice_note: "audio",
      declaratif: "declared",
      statement: "declared",
    }),
    ref: z.string(),
  }),
  corrective_action: z.string(),
  deadline: lenientEnum(["immediate", "24h", "7d", "30d"], "7d", {
    immediat: "immediate",
    now: "immediate",
    "24_h": "24h",
    "1d": "24h",
    "1_day": "24h",
    "7j": "7d",
    "7_days": "7d",
    "1_week": "7d",
    "30j": "30d",
    "30_days": "30d",
    "1_month": "30d",
  }),
});
export type Finding = z.infer<typeof Finding>;

/** Full simulated inspection report. */
export const Report = z.object({
  predicted_grade: Grade,
  grade_rationale: z.string(),
  inspector_summary: z.string(),
  findings: z.array(Finding),
  strengths: z.array(z.string()),
  /** Items the inspector would check on site, for which the file holds no evidence. */
  to_verify: z.array(z.string()).default([]),
  closure_risk: lenientEnum(["low", "moderate", "high"], "moderate", { faible: "low", modere: "moderate", eleve: "high", medium: "moderate" }),
});
export type Report = z.infer<typeof Report>;
