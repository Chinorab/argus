/**
 * Argus pipeline CLI.
 *   npm run audit -- samples/demo [en|fr]
 * The folder holds .jpg/.png photos, optional temperatures.txt, statement.txt and notes.txt (one voice note per line).
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
config({ path: ".env.local" });

const { perceiveImage } = await import("../src/lib/pipeline/perceive");
const { extractTemperatures } = await import("../src/lib/pipeline/extract");
const { judge } = await import("../src/lib/pipeline/judge");
const { structureVoiceNotes } = await import("../src/lib/pipeline/notes");

const dir = process.argv[2] ?? "samples/demo";
const lang = (process.argv[3] === "fr" ? "fr" : "en") as "en" | "fr";
const files = (await readdir(dir)).sort();
const images = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
if (!images.length) {
  console.error(`No image in ${dir}`);
  process.exit(1);
}

const t0 = Date.now();
console.log(`> Perceiving ${images.length} photo(s)...`);
const photos = await Promise.all(
  images.map(async (f, i) => {
    const buf = await readFile(path.join(dir, f));
    const mime = f.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const t = Date.now();
    const observation = await perceiveImage({
      image: `data:${mime};base64,${buf.toString("base64")}`,
      hint: f.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      lang,
    });
    console.log(`  ok ${f} (${Date.now() - t} ms) - ${observation.zone}, ${observation.anomalies.length} anomaly(ies)`);
    return { ref: `P-${String(i + 1).padStart(2, "0")} ${f}`, hint: f, observation };
  }),
);

let temperatures: Awaited<ReturnType<typeof extractTemperatures>> = [];
if (files.includes("temperatures.txt")) {
  console.log("> Extracting temperature logs with Nano 30B...");
  const t = Date.now();
  temperatures = await extractTemperatures(await readFile(path.join(dir, "temperatures.txt"), "utf8"));
  console.log(`  ok ${temperatures.length} reading(s), ${temperatures.filter((r) => !r.compliant).length} out of range (${Date.now() - t} ms)`);
}

let voiceNotes: Awaited<ReturnType<typeof structureVoiceNotes>> = [];
if (files.includes("notes.txt")) {
  console.log("> Structuring voice notes with Nano 30B...");
  const t = Date.now();
  const lines = (await readFile(path.join(dir, "notes.txt"), "utf8")).split(/\r?\n/).filter((l) => l.trim());
  voiceNotes = await structureVoiceNotes(lines, lang);
  console.log(`  ok ${voiceNotes.length} note(s), ${voiceNotes.reduce((a, n) => a + n.facts.length, 0)} fact(s) (${Date.now() - t} ms)`);
  for (const n of voiceNotes) console.log(`  ${n.ref} ${n.transcript}\n     facts: ${n.facts.join(" | ")}`);
}

const statement = files.includes("statement.txt") ? await readFile(path.join(dir, "statement.txt"), "utf8") : undefined;

console.log("> Regulatory judgement...");
const result = await judge(
  { establishment: { name: path.basename(dir), type: "commercial_restaurant" }, photos, temperatures, voiceNotes, statement, lang },
  (e) => console.log(`  . ${e.type} ${e.model}${e.ms ? ` (${e.ms} ms)` : ""}`),
);

const r = result.report;
console.log(`\n=== PREDICTED GRADE: ${r.predicted_grade.toUpperCase()} - closure risk ${r.closure_risk} ===`);
console.log(r.grade_rationale, "\n");
console.log(r.inspector_summary, "\n");
for (const f of r.findings)
  console.log(`[${f.severity.toUpperCase()}] ${f.id} ${f.title} - ${f.regulatory_reference} - ${f.deadline}\n   ${f.observation}\n   -> ${f.corrective_action}`);
console.log(`\nStrengths: ${r.strengths.join(" | ")}`);
console.log(`To verify on site: ${r.to_verify.join(" | ")}`);
console.log(`\nTotal ${Date.now() - t0} ms, judge = ${result.model}`);

const out = path.join(dir, "report.json");
await writeFile(out, JSON.stringify({ ...result, photos: photos.map((p) => ({ ref: p.ref, observation: p.observation })), temperatures }, null, 2));
console.log(`Report written to ${out}`);
