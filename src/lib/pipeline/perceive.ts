import { MODELS, nebius, extractJson } from "@/lib/nebius";
import { Observation } from "@/lib/schemas";

const SYSTEM = `Tu es un inspecteur sanitaire (DDPP) spécialisé en restauration commerciale.
On te montre une photo prise dans un établissement. Tu décris ce que tu VOIS, sans inventer.
Cherche activement : denrées au sol, cartons dans les enceintes froides, produits non filmés,
cru et cuit mélangés, absence d'étiquetage, joints de porte sales ou abîmés, givre, carrelage
cassé, peinture écaillée, moisissures, graisse accumulée, poubelles ouvertes, lave-mains
encombré ou absent, planches en bois brut, ustensiles détériorés, traces de nuisibles,
produits d'entretien près des denrées, tenue du personnel, fenêtres ouvertes sans moustiquaire.
Note aussi les points positifs (propreté, rangement, affichages).

Réponds UNIQUEMENT avec un objet JSON de cette forme :
{
  "zone": "reception|stockage_sec|stockage_froid|legumerie|preparation_froide|preparation_chaude|cuisson|plonge|dechets|vestiaires_sanitaires|salle|exterieur|inconnue",
  "description": "2-3 phrases factuelles",
  "equipements": ["..."],
  "anomalies": [{"constat": "...", "localisation": "où dans l'image", "confiance": 0.0-1.0}],
  "points_positifs": ["..."]
}`;

export interface PerceiveInput {
  /** Data URL (data:image/jpeg;base64,...) ou URL https publique. */
  image: string;
  /** Contexte libre fourni par le gérant (ex. « chambre froide n°2 »). */
  hint?: string;
}

/** Étape 1 — perception d'une photo par Nemotron Nano Omni. */
export async function perceiveImage(input: PerceiveInput): Promise<Observation> {
  const res = await nebius.chat.completions.create({
    model: MODELS.perception,
    temperature: 0.2,
    max_tokens: 1200,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: input.image } },
          {
            type: "text",
            text: input.hint
              ? `Contexte donné par le gérant : ${input.hint}. Analyse la photo.`
              : "Analyse la photo.",
          },
        ],
      },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "";
  return Observation.parse(extractJson(text));
}

const SYSTEM_AUDIO = `Tu écoutes une note vocale d'un restaurateur qui décrit un problème ou une
situation dans sa cuisine. Transcris fidèlement en français puis extrais les faits utiles à une
inspection sanitaire (équipement concerné, température, durée, pratique décrite).
Réponds UNIQUEMENT en JSON : {"transcription": "...", "faits": ["..."]}`;

export interface AudioNote {
  transcription: string;
  faits: string[];
}

/** Étape 1 bis — note vocale transcrite et structurée par Nemotron Nano Omni. */
export async function perceiveAudio(
  audioBase64: string,
  format: "wav" | "mp3",
): Promise<AudioNote> {
  const res = await nebius.chat.completions.create({
    model: MODELS.perception,
    temperature: 0.1,
    max_tokens: 800,
    messages: [
      { role: "system", content: SYSTEM_AUDIO },
      {
        role: "user",
        content: [
          { type: "input_audio", input_audio: { data: audioBase64, format } },
          { type: "text", text: "Transcris et structure cette note vocale." },
        ],
      },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "";
  return extractJson<AudioNote>(text);
}
