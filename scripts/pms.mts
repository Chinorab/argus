// Generates the Food Safety Management Plan from a report.json produced by scripts/audit.mts.
//   npm run pms -- samples/demo [en|fr]
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
config({ path: ".env.local" });
const { generatePms } = await import("../src/lib/pipeline/pms");

const dir = process.argv[2] ?? "samples/demo";
const lang = (process.argv[3] === "fr" ? "fr" : "en") as "en" | "fr";
const saved = JSON.parse(await readFile(path.join(dir, "report.json"), "utf8"));
console.log("> Generating the PMS with Super 120B...");
const result = await generatePms({ establishment: path.basename(dir), caseText: saved.caseText, report: saved.report, lang });
const p = result.pms;
console.log(`  ok ${result.durationMs} ms, ${result.usage?.completion_tokens} tokens`);
console.log(`\nProfile: ${p.establishment_profile.activity} - ${p.establishment_profile.capacity} - ${p.establishment_profile.staff}`);
console.log(`Hygiene themes: ${p.good_hygiene_practices.map((g) => g.theme).join(" | ")}`);
console.log(`Process steps: ${p.process_flow.map((s) => `${s.step}${s.is_ccp ? " [CCP]" : ""}`).join(" -> ")}`);
console.log(`Records: ${p.records.map((r) => r.name).join(" | ")}`);
console.log("Priority actions:");
p.priority_actions.forEach((a) => console.log(`  - [${a.deadline}] ${a.action}${a.addresses ? ` (${a.addresses})` : ""}`));
await writeFile(path.join(dir, "pms.json"), JSON.stringify(result, null, 2));
