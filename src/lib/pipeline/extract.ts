import { MODELS, nebius, extractJson } from "@/lib/nebius";
import { ReleveTemperature } from "@/lib/schemas";
import { z } from "zod";

const SYSTEM = `Tu normalises des relevés de température de cuisine professionnelle (France).
Entrée : texte brut (CSV, tableau collé, notes manuscrites transcrites, phrases).
Pour chaque relevé, détermine le type d'enceinte et applique la limite réglementaire
(arrêté du 21 décembre 2009) :
- froid_positif : ≤ +4 °C (≤ +3 °C pour plats cuisinés en liaison froide, ≤ +2 °C viande hachée)
- froid_negatif : ≤ −18 °C (surgelés) ou ≤ −12 °C (congelés)
- chaud : ≥ +63 °C
- refroidissement : +63 → +10 °C en < 2 h
Un relevé est non conforme si la valeur dépasse la limite. Signale les dérives persistantes
(plusieurs relevés consécutifs hors limite sur le même équipement) dans "commentaire".
Réponds UNIQUEMENT en JSON : {"releves": [ {equipement, type, valeur_c, horodatage?, limite_c, conforme, commentaire?} ]}`;

const Out = z.object({ releves: z.array(ReleveTemperature) });

/** Étape 2 — extraction structurée des relevés par Nemotron Nano 30B. */
export async function extractTemperatures(raw: string): Promise<ReleveTemperature[]> {
  if (!raw.trim()) return [];
  const res = await nebius.chat.completions.create({
    model: MODELS.fast,
    temperature: 0,
    max_tokens: 2000,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: raw },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "";
  return Out.parse(extractJson(text)).releves;
}
