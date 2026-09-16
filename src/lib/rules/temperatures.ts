import type { ReleveTemperature } from "@/lib/schemas";

/**
 * Règles déterministes de conformité des températures (arrêté du 21 décembre 2009).
 * Le modèle ne fait qu'extraire ; c'est ici que la limite et le verdict sont décidés.
 */

export type TypeEnceinte = ReleveTemperature["type"];

/** Sous-catégorie de froid positif : la limite dépend de la denrée. */
export type Denree =
  | "viande_hachee"
  | "viande"
  | "poisson"
  | "plat_cuisine"
  | "denree_perissable"
  | "inconnue";

export interface ReleveBrut {
  equipement: string;
  type: TypeEnceinte;
  denree?: Denree | null;
  valeur_c: number;
  horodatage?: string | null;
}

export interface Limite {
  limite_c: number;
  /** "max" : la valeur doit être ≤ limite ; "min" : ≥ limite. */
  sens: "max" | "min";
  libelle: string;
}

export function limitePour(type: TypeEnceinte, denree: Denree = "inconnue"): Limite {
  switch (type) {
    case "froid_positif":
      switch (denree) {
        case "viande_hachee":
          return { limite_c: 2, sens: "max", libelle: "viandes hachées ≤ +2 °C" };
        case "poisson":
          return { limite_c: 2, sens: "max", libelle: "poissons frais 0 à +2 °C" };
        case "plat_cuisine":
          return { limite_c: 3, sens: "max", libelle: "plats cuisinés liaison froide ≤ +3 °C" };
        case "viande":
        case "denree_perissable":
        case "inconnue":
        default:
          return { limite_c: 4, sens: "max", libelle: "denrées périssables ≤ +4 °C" };
      }
    case "froid_negatif":
      return { limite_c: -18, sens: "max", libelle: "surgelés ≤ −18 °C" };
    case "chaud":
      return { limite_c: 63, sens: "min", libelle: "liaison chaude ≥ +63 °C" };
    case "refroidissement":
      return { limite_c: 10, sens: "max", libelle: "refroidissement rapide : ≤ +10 °C en moins de 2 h" };
    case "autre":
    default:
      return { limite_c: 4, sens: "max", libelle: "denrées périssables ≤ +4 °C (par défaut)" };
  }
}

/** Tolérance d'ouverture de porte sur froid positif (référentiel § 2) : +2 °C ponctuels. */
const TOLERANCE_FROID_POSITIF = 2;

export function estConforme(valeur: number, limite: Limite): boolean {
  return limite.sens === "max" ? valeur <= limite.limite_c : valeur >= limite.limite_c;
}

/** Applique limites, verdicts et détection de dérive persistante (≥ 2 relevés consécutifs hors limite). */
export function qualifier(bruts: ReleveBrut[]): ReleveTemperature[] {
  const out: ReleveTemperature[] = bruts.map((b) => {
    const limite = limitePour(b.type, b.denree ?? "inconnue");
    const conforme = estConforme(b.valeur_c, limite);
    let commentaire: string | undefined;
    if (!conforme) {
      const ecart = limite.sens === "max" ? b.valeur_c - limite.limite_c : limite.limite_c - b.valeur_c;
      const tolerable = b.type === "froid_positif" && ecart <= TOLERANCE_FROID_POSITIF;
      commentaire = `écart de ${ecart.toFixed(1)} °C par rapport à la limite (${limite.libelle})${tolerable ? ", dans la tolérance ponctuelle d'ouverture de porte si isolé et documenté" : ""}`;
    }
    return {
      equipement: b.equipement,
      type: b.type,
      valeur_c: b.valeur_c,
      horodatage: b.horodatage ?? undefined,
      limite_c: limite.limite_c,
      conforme,
      commentaire,
    };
  });

  // Dérive persistante par équipement, dans l'ordre fourni (supposé chronologique).
  const parEquipement = new Map<string, ReleveTemperature[]>();
  for (const r of out) {
    const k = r.equipement.trim().toLowerCase();
    parEquipement.set(k, [...(parEquipement.get(k) ?? []), r]);
  }
  for (const releves of parEquipement.values()) {
    let serie = 0;
    for (const r of releves) {
      serie = r.conforme ? 0 : serie + 1;
      if (serie >= 2) {
        r.commentaire = `${r.commentaire ?? ""} — DÉRIVE PERSISTANTE : ${serie} relevés consécutifs hors limite, rupture de la chaîne du froid/chaud à retenir`.replace(/^ — /, "");
      }
    }
    const nc = releves.filter((r) => !r.conforme).length;
    if (nc >= 2 && releves.length >= 3 && nc / releves.length >= 0.5) {
      const last = releves[releves.length - 1];
      if (!/DÉRIVE PERSISTANTE/.test(last.commentaire ?? ""))
        last.commentaire = `${last.commentaire ?? ""} — ${nc}/${releves.length} relevés hors limite sur la période`.replace(/^ — /, "");
    }
  }
  return out;
}
