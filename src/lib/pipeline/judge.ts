import { readFile } from "node:fs/promises";
import path from "node:path";
import { MODELS, nebius, extractJson, languageInstruction } from "@/lib/nebius";
import type { Lang } from "@/lib/lang";
import { Report, type Observation, type TemperatureReading } from "@/lib/schemas";
import type { VoiceNote } from "./perceive";

export interface CaseFile {
  establishment: { name: string; type: "commercial_restaurant" };
  photos: { ref: string; hint?: string; observation: Observation }[];
  temperatures: TemperatureReading[];
  voiceNotes: VoiceNote[];
  /** Operator's statement: existing PMS? training? etc. */
  statement?: string;
  lang: Lang;
}

let referenceCache: string | undefined;
export async function loadReference(): Promise<string> {
  if (!referenceCache) {
    referenceCache = await readFile(path.join(process.cwd(), "src/lib/reference/commercial-restaurant.md"), "utf8");
  }
  return referenceCache;
}

function buildSystem(reference: string, lang: Lang): string {
  return `You are an experienced food-safety inspector of the French DDPP, on an inspection visit in a
commercial restaurant. You apply the reference below STRICTLY.
You only retain non-compliances backed by evidence in the case file (photo, temperature reading,
voice note, operator statement). You NEVER infer a non-compliance from a lack of evidence:
what was neither observed nor declared goes into "to_verify" (what you would check on site),
never into "findings" nor into "strengths".

Mandatory writing rules:
- ONE finding per subject: a cold unit drifting = one finding citing all its readings
  (e.g. "5 consecutive readings from 6.5 to 7.4 °C on 14-16/09"), never one finding per reading.
  Severity = that of the worst reading.
- A photo anomaly with confidence < 0.6, or that looks implausible in context, goes into
  "to_verify" with the mention "to confirm on site", not into "findings".
- 12 findings maximum; merge what belongs to the same grid point.
- Each finding cites the grid point (e.g. B3) and the text (e.g. EC 852/2004 Annex II ch. IX).
- Qualify severity with the § 4 scale and predict the Alim'confiance grade by applying the § 4
  rules to the letter. Write the summary like a real inspection report: factual, precise, no
  value judgement.
${languageInstruction(lang)}

=== REFERENCE ===
${reference}
=== END OF REFERENCE ===

Reply ONLY with a JSON object:
{
  "predicted_grade": "very_satisfactory|satisfactory|to_improve|urgent_correction",
  "grade_rationale": "§ 4 rule applied and count of findings per severity",
  "inspector_summary": "8-12 lines, official report style",
  "findings": [{
    "id": "NC-01",
    "title": "short",
    "zone": "receiving|dry_storage|cold_storage|vegetable_prep|cold_prep|hot_prep|cooking|dishwashing|waste|staff_facilities|dining_room|outdoor|general (general for documentary or establishment-wide findings)",
    "severity": "minor|major|critical",
    "observation": "what was observed, precise",
    "regulatory_reference": "grid point + text",
    "risk": "hazard for the consumer",
    "evidence": {"type": "photo|temperature|audio|declared", "ref": "evidence identifier"},
    "corrective_action": "concrete action",
    "deadline": "immediate|24h|7d|30d (exact value)"
  }],
  "strengths": ["only what was observed or declared"],
  "to_verify": ["on-site checks with no evidence in the file"],
  "closure_risk": "low|moderate|high"
}`;
}

function buildCaseText(c: CaseFile): string {
  const lines: string[] = [];
  lines.push(`# Inspection case file — ${c.establishment.name} (commercial restaurant)`);
  lines.push("\n## Photos analysed");
  for (const p of c.photos) {
    lines.push(`\n### Evidence ${p.ref}${p.hint ? ` — caption: ${p.hint}` : ""}`);
    lines.push(`Zone: ${p.observation.zone}`);
    lines.push(`Description: ${p.observation.description}`);
    if (p.observation.equipment.length) lines.push(`Equipment: ${p.observation.equipment.join(", ")}`);
    for (const a of p.observation.anomalies)
      lines.push(`- Anomaly (confidence ${a.confidence.toFixed(2)}): ${a.finding}${a.location ? ` [${a.location}]` : ""}`);
    for (const pos of p.observation.positives) lines.push(`- Positive: ${pos}`);
  }
  lines.push("\n## Temperature readings");
  if (!c.temperatures.length) lines.push("No readings provided (lack of records to be reported, C3).");
  c.temperatures.forEach((t, i) =>
    lines.push(
      `- T-${String(i + 1).padStart(2, "0")} ${t.equipment} (${t.kind}): ${t.value_c} °C${t.timestamp ? ` on ${t.timestamp}` : ""}, limit ${t.limit_c ?? "?"} °C → ${t.compliant ? "compliant" : "OUT OF RANGE"}${t.note ? ` — ${t.note}` : ""}`,
    ),
  );
  lines.push("\n## Operator voice notes");
  if (!c.voiceNotes.length) lines.push("None.");
  c.voiceNotes.forEach((n, i) => {
    lines.push(`- A-${String(i + 1).padStart(2, "0")} "${n.transcript}"`);
    n.facts.forEach((f) => lines.push(`  · fact: ${f}`));
  });
  lines.push("\n## Operator statement");
  lines.push(c.statement?.trim() || "No information about the PMS, training or traceability.");
  return lines.join("\n");
}

export interface JudgeResult {
  report: Report;
  model: string;
  durationMs: number;
  caseText: string;
  /** Reasoning chain returned by Nemotron (`reasoning` field), for the timeline. */
  reasoning?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/** Step 3 — regulatory judgement by Nemotron Ultra, falling back to Super. */
export async function judge(
  caseFile: CaseFile,
  onEvent?: (e: { type: "start" | "fallback" | "done"; model: string; ms?: number }) => void,
): Promise<JudgeResult> {
  const reference = await loadReference();
  const system = buildSystem(reference, caseFile.lang);
  const caseText = buildCaseText(caseFile);

  const attempt = async (model: string) => {
    const t0 = Date.now();
    onEvent?.({ type: "start", model });
    const res = await nebius.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: 16000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: caseText },
      ],
    });
    const msg = res.choices[0]?.message as { content?: string | null; reasoning?: string } | undefined;
    if (res.choices[0]?.finish_reason === "length")
      throw new Error(`reply truncated (max_tokens), ${res.usage?.completion_tokens} tokens generated`);
    const report = Report.parse(extractJson(msg?.content ?? ""));
    const ms = Date.now() - t0;
    onEvent?.({ type: "done", model, ms });
    return { report, model, durationMs: ms, caseText, reasoning: msg?.reasoning, usage: res.usage };
  };

  try {
    return await attempt(MODELS.judge);
  } catch (err) {
    onEvent?.({ type: "fallback", model: MODELS.judgeFallback });
    console.warn(`[argus] ${MODELS.judge} failed (${(err as Error).message}), falling back to ${MODELS.judgeFallback}`);
    return await attempt(MODELS.judgeFallback);
  }
}
