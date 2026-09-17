import { MODELS, TIMEOUTS, nebius, extractJson, languageInstruction } from "@/lib/nebius";
import type { Lang } from "@/lib/lang";
import { Observation } from "@/lib/schemas";

const SYSTEM = `You are a food-safety inspector (French DDPP) specialised in commercial restaurants.
You are shown one photo taken inside an establishment. Describe what you SEE, never invent.
Actively look for: food on the floor, cardboard inside cold units, unwrapped products,
raw and cooked mixed, missing labels, dirty or damaged door gaskets, frost build-up, broken
tiles, flaking paint, mould, grease build-up, open bins, cluttered or missing hand-wash sink,
raw wood boards or surfaces, damaged utensils, pest traces, cleaning chemicals near food,
staff attire (no hair cover, personal items), open windows without insect screens.
Also note the positives (cleanliness, tidiness, signage).

What is NOT an anomaly:
- something simply outside the frame (a hand-wash sink you cannot see is not "missing");
- food in open containers or on trays while it is being prepared or plated during service;
- normal working clutter on a pass during service, tools in use, a chef's cap instead of a toque.
Report at most 6 anomalies per photo, the most important first. An empty "anomalies" list is a
valid answer for a clean, well-run kitchen — do not invent findings to fill the list.

Confidence calibration (be honest, an inspector will act on it):
- 0.9-1.0: unmistakable in the image (e.g. cardboard boxes inside the cold unit, food on the floor).
- 0.6-0.8: clearly visible but the interpretation could be discussed.
- 0.3-0.5: inferred, partially hidden, or plausible but not demonstrated.
For cross-contamination, name the raw item AND the cooked/ready-to-eat item you can identify;
if you cannot name both, do NOT report cross-contamination at all.

Reply ONLY with a JSON object of this shape:
{
  "zone": "receiving|dry_storage|cold_storage|vegetable_prep|cold_prep|hot_prep|cooking|dishwashing|waste|staff_facilities|dining_room|outdoor|general",
  "description": "2-3 factual sentences",
  "equipment": ["..."],
  "anomalies": [{"finding": "...", "location": "where in the image", "confidence": 0.0-1.0}],
  "positives": ["..."]
}`;

export interface PerceiveInput {
  /** Data URL (data:image/jpeg;base64,...) or public https URL. */
  image: string;
  /** Free caption given by the operator (e.g. "walk-in fridge #2"). */
  hint?: string;
  lang: Lang;
}

/** Step 1 — photo perception. */
export async function perceiveImage(input: PerceiveInput): Promise<Observation> {
  const res = await nebius.chat.completions.create(
    {
      model: MODELS.perception,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: "system", content: `${SYSTEM}\n${languageInstruction(input.lang)}` },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: input.image } },
            { type: "text", text: input.hint ? `Operator's caption: ${input.hint}. Analyse the photo.` : "Analyse the photo." },
          ],
        },
      ],
    },
    { timeout: TIMEOUTS.perception, maxRetries: 1 },
  );
  const text = res.choices[0]?.message?.content ?? "";
  const obs = Observation.parse(extractJson(text));
  return { ...obs, anomalies: dropAbsenceClaims(obs.anomalies) };
}

/**
 * A photo can show what is there, not what is missing: small vision models keep reporting
 * "missing hand-wash sink" for anything outside the frame. Such claims are dropped here
 * (the judge lists what to verify on site instead).
 */
const ABSENCE = /^(missing|absent|no |not? (visible|present)|lack of|without)\b|\b(not visible|not present|is missing|are missing|absence of)\b/i;
export function dropAbsenceClaims<T extends { finding: string }>(anomalies: T[]): T[] {
  return anomalies.filter((a) => !ABSENCE.test(a.finding.trim()));
}
