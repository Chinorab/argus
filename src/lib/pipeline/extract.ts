import { MODELS, nebius, extractJson } from "@/lib/nebius";
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

Reply ONLY in JSON: {"readings": [{"equipment": "...", "kind": "...", "foodstuff": "...", "value_c": 0, "timestamp": null}]}`;

const Raw = z.object({
  equipment: z.string(),
  kind: z.enum(["chilled", "frozen", "hot_holding", "cooling", "other"]).catch("other"),
  foodstuff: z.enum(["minced_meat", "meat", "fish", "cooked_dish", "perishable", "unknown"]).nullish().catch("unknown"),
  value_c: z.coerce.number(),
  timestamp: z.string().nullish(),
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
  });
  const text = res.choices[0]?.message?.content ?? "";
  const readings: RawReading[] = Out.parse(extractJson(text)).readings;
  return qualify(readings);
}
