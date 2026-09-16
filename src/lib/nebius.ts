import OpenAI from "openai";

/**
 * Single client for Nebius Token Factory (OpenAI-compatible API).
 * Every model call in Argus goes through here.
 */
export const nebius = new OpenAI({
  apiKey: process.env.NEBIUS_API_KEY,
  baseURL: process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1/",
});

export const MODELS = {
  /** MiniCPM-V 4.5 — photo perception (no Nemotron on Token Factory accepts image input yet). */
  perception: process.env.ARGUS_MODEL_PERCEPTION ?? "openbmb/MiniCPM-V-4_5",
  /** Nemotron 3 Nano 30B — structured extraction, fast calls. */
  fast: process.env.ARGUS_MODEL_FAST ?? "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  /** Nemotron 3 Ultra 550B — heavy regulatory reasoning. */
  judge: process.env.ARGUS_MODEL_JUDGE ?? "nvidia/Nemotron-3-Ultra-550b-a55b",
  /** Nemotron 3 Super 120B — fallback when Ultra is saturated. */
  judgeFallback: process.env.ARGUS_MODEL_JUDGE_FALLBACK ?? "nvidia/nemotron-3-super-120b-a12b",
} as const;

/** Extracts the first JSON block from a model reply (tolerates surrounding reasoning text). */
export function extractJson<T = unknown>(text: string): T {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : cleaned;
  const start = candidate.search(/[{[]/);
  if (start === -1) throw new Error("No JSON found in the model reply");
  const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

/** Output language requested from the models. */
export type Lang = "en" | "fr";

export function languageInstruction(lang: Lang): string {
  return lang === "fr"
    ? "Write every free-text field in French."
    : "Write every free-text field in English (regulatory references may keep their official French names).";
}
