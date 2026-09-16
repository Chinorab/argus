import type { NoteAlimConfiance, Severite, Zone } from "@/lib/schemas";

export const NOTE_LABEL: Record<NoteAlimConfiance, string> = {
  tres_satisfaisant: "Très satisfaisant",
  satisfaisant: "Satisfaisant",
  a_ameliorer: "À améliorer",
  a_corriger_de_maniere_urgente: "À corriger de manière urgente",
};

/** Classe Tailwind de couleur pour chaque niveau Alim'confiance. */
export const NOTE_COLOR: Record<NoteAlimConfiance, string> = {
  tres_satisfaisant: "bg-n1",
  satisfaisant: "bg-n2",
  a_ameliorer: "bg-n3",
  a_corriger_de_maniere_urgente: "bg-n4",
};

export const NOTE_INDEX: Record<NoteAlimConfiance, number> = {
  tres_satisfaisant: 0,
  satisfaisant: 1,
  a_ameliorer: 2,
  a_corriger_de_maniere_urgente: 3,
};

export const SEVERITE_LABEL: Record<Severite, string> = {
  mineure: "Mineure",
  majeure: "Majeure",
  critique: "Critique",
};

export const SEVERITE_COLOR: Record<Severite, string> = {
  mineure: "bg-sev-mineure",
  majeure: "bg-sev-majeure",
  critique: "bg-sev-critique",
};

export const ZONE_LABEL: Record<Zone, string> = {
  reception: "Réception",
  stockage_sec: "Stockage sec",
  stockage_froid: "Stockage froid",
  legumerie: "Légumerie",
  preparation_froide: "Préparation froide",
  preparation_chaude: "Préparation chaude",
  cuisson: "Cuisson",
  plonge: "Plonge",
  dechets: "Déchets",
  vestiaires_sanitaires: "Vestiaires / sanitaires",
  salle: "Salle",
  exterieur: "Extérieur",
  inconnue: "Général",
};

export const DELAI_LABEL: Record<string, string> = {
  immediat: "Immédiat",
  "24h": "Sous 24 h",
  "7j": "Sous 7 jours",
  "30j": "Sous 30 jours",
};

export const RISQUE_LABEL: Record<string, string> = {
  faible: "faible",
  modere: "modéré",
  eleve: "élevé",
};

/** Nom court d'un modèle pour l'affichage. */
export function shortModel(id: string): string {
  if (/ultra/i.test(id)) return "Nemotron 3 Ultra 550B";
  if (/super/i.test(id)) return "Nemotron 3 Super 120B";
  if (/nano/i.test(id)) return "Nemotron 3 Nano 30B";
  if (/minicpm/i.test(id)) return "MiniCPM-V 4.5";
  return id.split("/").pop() ?? id;
}
