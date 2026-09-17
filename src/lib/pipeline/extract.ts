import { MODELS, TIMEOUTS, nebius, extractJson } from "@/lib/nebius";
import type { TemperatureReading } from "@/lib/schemas";
import { qualify, type RawReading } from "@/lib/rules/temperatures";
import { z } from "zod";

/**
 * Step 2 — temperature log transcription by Nemotron Nano 30B.
 * The model issues NO verdict: it transcribes (equipment, kind, foodstuff, value, timestamp).
 * Limits and compliance are computed by `rules/temperatures.ts`.
 */
const SYSTEM = `You transcribe professional-kitchen temperature logs into JSON.
Input: raw text (CSV, pasted table, notes, sentences), possibly in French. One reading = one value.
Compute NOTHING, judge NOTHING: transcribe every value as written, in the order of the text.

For each reading:
- "equipment": name as written (e.g. "Fridge 2 (meat)").
- "kind": chilled (fridge, walk-in, cold display), frozen (freezer), hot_holding (bain-marie,
  hot cabinet, hot service), cooling (blast chiller, rapid cooling), other.
- "foodstuff": minced_meat, meat, fish, cooked_dish, perishable (dairy, eggs, deli, vegetables),
  or unknown if the text does not say.
- "value_c": number (negative for freezers, e.g. -18.5).
- "timestamp": date/time as written, or null.
- Cooling batches ("blast chiller, beef stew: 68 °C at 14:10 to 8 °C at 15:45") are ONE reading:
  "kind": "cooling", "value_c" = the FINAL temperature (8), "start_c" = the starting temperature (68),
  "duration_min" = minutes between the two times if both are given (95), else null.

Reply ONLY in JSON: {"readings": [{"equipment": "...", "kind": "...", "foodstuff": "...", "value_c": 0, "timestamp": null, "start_c": null, "duration_min": null}]}`;

const Raw = z.object({
  equipment: z.string(),
  kind: z.enum(["chilled", "frozen", "hot_holding", "cooling", "other"]).catch("other"),
  foodstuff: z.enum(["minced_meat", "meat", "fish", "cooked_dish", "perishable", "unknown"]).nullish().catch("unknown"),
  value_c: z.coerce.number(),
  timestamp: z.string().nullish(),
  start_c: z.coerce.number().nullish(),
  duration_min: z.coerce.number().nullish(),
});
const Out = z.object({ readings: z.array(Raw) });

export async function extractTemperatures(rawText: string): Promise<TemperatureReading[]> {
  if (!rawText.trim()) return [];
  const res = await nebius.chat.completions.create({
    model: MODELS.fast,
    temperature: 0,
    max_tokens: 4000,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: rawText },
    ],
    // Deterministic transcription: Nemotron's reasoning mode aggregates tabular data, so we turn it off.
    // @ts-expect-error vLLM parameter passed through by Token Factory
    chat_template_kwargs: { enable_thinking: false },
  }, { timeout: TIMEOUTS.fast, maxRetries: 1 });
  const text = res.choices[0]?.message?.content ?? "";
  const readings: RawReading[] = Out.parse(extractJson(text)).readings;
  return qualify(readings);
}
