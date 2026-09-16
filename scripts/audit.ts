/**
 * CLI de test du pipeline Argus.
 *   npx tsx scripts/audit.ts samples/demo
 * Le dossier contient des .jpg/.png, un éventuel temperatures.txt et un declaratif.txt.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
config({ path: ".env.local" });

const { perceiveImage } = await import("../src/lib/pipeline/perceive");
const { extractTemperatures } = await import("../src/lib/pipeline/extract");
const { judge } = await import("../src/lib/pipeline/judge");

const dir = process.argv[2] ?? "samples/demo";
const files = (await readdir(dir)).sort();
const images = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
if (!images.length) {
  console.error(`Aucune image dans ${dir}`);
  process.exit(1);
}

const t0 = Date.now();
console.log(`▶ Perception de ${images.length} photo(s) avec Nano Omni…`);
const photos = await Promise.all(
  images.map(async (f, i) => {
    const buf = await readFile(path.join(dir, f));
    const mime = f.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const t = Date.now();
    const observation = await perceiveImage({
      image: `data:${mime};base64,${buf.toString("base64")}`,
      hint: f.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
    });
    console.log(`  ✓ ${f} (${Date.now() - t} ms) — ${observation.zone}, ${observation.anomalies.length} anomalie(s)`);
    return { ref: `P-${String(i + 1).padStart(2, "0")} ${f}`, hint: f, observation };
  }),
);

let temperatures: Awaited<ReturnType<typeof extractTemperatures>> = [];
if (files.includes("temperatures.txt")) {
  console.log("▶ Extraction des relevés avec Nano 30B…");
  const t = Date.now();
  temperatures = await extractTemperatures(await readFile(path.join(dir, "temperatures.txt"), "utf8"));
  console.log(`  ✓ ${temperatures.length} relevé(s), ${temperatures.filter((r) => !r.conforme).length} non conforme(s) (${Date.now() - t} ms)`);
}

const declaratif = files.includes("declaratif.txt")
  ? await readFile(path.join(dir, "declaratif.txt"), "utf8")
  : undefined;

console.log("▶ Jugement réglementaire…");
const result = await judge(
  { etablissement: { nom: path.basename(dir), type: "restauration_commerciale" }, photos, temperatures, notesVocales: [], declaratif },
  (e) => console.log(`  · ${e.type} ${e.modele}${e.ms ? ` (${e.ms} ms)` : ""}`),
);

const r = result.rapport;
console.log(`\n═══ NOTE PRÉDITE : ${r.note_predite.toUpperCase()} — risque de fermeture ${r.risque_fermeture} ═══`);
console.log(r.justification_note, "\n");
console.log(r.synthese_inspecteur, "\n");
for (const nc of r.non_conformites)
  console.log(`[${nc.severite.toUpperCase()}] ${nc.id} ${nc.titre} — ${nc.reference_reglementaire} — délai ${nc.delai}\n   ${nc.constat}\n   → ${nc.action_corrective}`);
console.log(`\nPoints forts : ${r.points_forts.join(" · ")}`);
console.log(`\nTotal ${Date.now() - t0} ms, juge = ${result.modele}`);

const out = path.join(dir, "rapport.json");
await writeFile(out, JSON.stringify({ ...result, photos: photos.map((p) => ({ ref: p.ref, observation: p.observation })), temperatures }, null, 2));
console.log(`Rapport écrit dans ${out}`);
