import { z } from "zod";
import { MODELS, nebius, extractJson, languageInstruction } from "@/lib/nebius";
import type { Lang } from "@/lib/lang";

/**
 * Step 1b — operator voice notes.
 * Speech-to-text happens in the browser (Web Speech API); Nemotron Nano 30B then turns the raw
 * transcripts into inspection facts (equipment, temperature, duration, practice) the judge can use.
 */

export interface VoiceNote {
  ref: string;
  transcript: string;
  facts: string[];
}

const SYSTEM = `You read voice notes dictated by a restaurant operator during a self-inspection of their
kitchen. Transcripts come from speech recognition: fix obvious recognition errors, keep the meaning.
For each note, extract the facts useful to a food-safety inspection: equipment concerned,
temperatures and durations, practices described, anything declared about records, training,
pests, cleaning or equipment failures. Do not invent facts that are not in the note.
Reply ONLY in JSON: {"notes": [{"ref": "A-01", "transcript": "cleaned transcript", "facts": ["..."]}]}`;

const Out = z.object({
  notes: z.array(
    z.object({
      ref: z.string(),
      transcript: z.string(),
      facts: z.array(z.string()).default([]),
    }),
  ),
});

export async function structureVoiceNotes(transcripts: string[], lang: Lang): Promise<VoiceNote[]> {
  const clean = transcripts.map((t) => t.trim()).filter(Boolean);
  if (!clean.length) return [];
  const numbered = clean.map((t, i) => `A-${String(i + 1).padStart(2, "0")}: ${t}`).join("\n");
  const res = await nebius.chat.completions.create({
    model: MODELS.fast,
    temperature: 0,
    max_tokens: 2000,
    messages: [
      { role: "system", content: `${SYSTEM}\n${languageInstruction(lang)}` },
      { role: "user", content: numbered },
    ],
    // @ts-expect-error vLLM parameter passed through by Token Factory
    chat_template_kwargs: { enable_thinking: false },
  });
  const parsed = Out.parse(extractJson(res.choices[0]?.message?.content ?? ""));
  // Keep the client-side numbering even if the model renumbers.
  return parsed.notes.map((n, i) => ({ ...n, ref: `A-${String(i + 1).padStart(2, "0")}` }));
}
