import { MODELS, nebius, extractJson } from "@/lib/nebius";
import type { ReleveTemperature } from "@/lib/schemas";
import { qualifier, type ReleveBrut } from "@/lib/rules/temperatures";
import { z } from "zod";

/**
 * Étape 2 — extraction des relevés par Nemotron Nano 30B.
 * Le modèle n'émet AUCUN verdict : il transcrit (équipement, type, denrée, valeur, date).
 * Les limites et la conformité sont calculées par `rules/temperatures.ts`.
 */
const SYSTEM = `Tu transcris des relevés de température de cuisine professionnelle en JSON.
Entrée : texte brut (CSV, tableau collé, notes, phrases). Un relevé = une valeur.
Ne calcule RIEN, ne juge RIEN : transcris chaque valeur telle quelle, dans l'ordre du texte.

Pour chaque relevé :
- "equipement" : nom tel qu'écrit (ex. "Frigo 2 (viandes)").
- "type" : froid_positif (frigo, chambre froide, vitrine réfrigérée), froid_negatif (congélateur,
  surgélateur), chaud (bain-marie, maintien au chaud, armoire chauffante, service chaud),
  refroidissement (cellule, refroidissement rapide), autre.
- "denree" : viande_hachee, viande, poisson, plat_cuisine, denree_perissable (laitier, œufs,
  charcuterie, légumes), ou inconnue si le texte ne le dit pas.
- "valeur_c" : nombre (négatif pour les congélateurs, ex. -18.5).
- "horodatage" : date/heure telle qu'écrite, ou null.

Réponds UNIQUEMENT en JSON : {"releves": [{"equipement": "...", "type": "...", "denree": "...", "valeur_c": 0, "horodatage": null}]}`;

const Brut = z.object({
  equipement: z.string(),
  type: z.enum(["froid_positif", "froid_negatif", "chaud", "refroidissement", "autre"]).catch("autre"),
  denree: z
    .enum(["viande_hachee", "viande", "poisson", "plat_cuisine", "denree_perissable", "inconnue"])
    .nullish()
    .catch("inconnue"),
  valeur_c: z.coerce.number(),
  horodatage: z.string().nullish(),
});
const Out = z.object({ releves: z.array(Brut) });

export async function extractTemperatures(raw: string): Promise<ReleveTemperature[]> {
  if (!raw.trim()) return [];
  const res = await nebius.chat.completions.create({
    model: MODELS.fast,
    temperature: 0,
    max_tokens: 4000,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: raw },
    ],
    // Transcription déterministe : le mode raisonnement de Nemotron agrège les relevés, on le coupe.
    // @ts-expect-error paramètre vLLM transmis tel quel par Token Factory
    chat_template_kwargs: { enable_thinking: false },
  });
  const text = res.choices[0]?.message?.content ?? "";
  const bruts: ReleveBrut[] = Out.parse(extractJson(text)).releves;
  return qualifier(bruts);
}
