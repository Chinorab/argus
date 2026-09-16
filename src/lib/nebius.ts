import OpenAI from "openai";

/**
 * Client unique vers Nebius Token Factory (API compatible OpenAI).
 * Tous les appels de modèles d'Argus passent par ici.
 */
export const nebius = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY,
  baseURL: process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1/",
});

export const MODELS = {
  /** MiniCPM-V 4.5 — perception photo (aucun Nemotron de Token Factory n accepte d image à ce jour). */
  perception:
    process.env.ARGUS_MODEL_PERCEPTION ??
    "openbmb/MiniCPM-V-4_5",
  /** Nemotron 3 Nano 30B — extraction structurée, appels rapides. */
  fast: process.env.ARGUS_MODEL_FAST ?? "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  /** Nemotron 3 Ultra 550B — jugement réglementaire lourd. */
  judge: process.env.ARGUS_MODEL_JUDGE ?? "nvidia/Nemotron-3-Ultra-550b-a55b",
  /** Nemotron 3 Super 120B — repli si Ultra sature. */
  judgeFallback:
    process.env.ARGUS_MODEL_JUDGE_FALLBACK ??
    "nvidia/nemotron-3-super-120b-a12b",
} as const;

/** Extrait le premier bloc JSON d'une réponse (tolère le texte de raisonnement autour). */
export function extractJson<T = unknown>(text: string): T {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : cleaned;
  const start = candidate.search(/[{[]/);
  if (start === -1) throw new Error("Aucun JSON dans la réponse du modèle");
  const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
