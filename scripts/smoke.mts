import { config } from "dotenv";
config({ path: ".env.local" });
const { nebius, MODELS } = await import("../src/lib/nebius");
const list = await nebius.models.list();
const ids = list.data.map((m) => m.id);
console.log(`${ids.length} modèles disponibles`);
for (const [k, v] of Object.entries(MODELS)) console.log(`  ${k.padEnd(14)} ${v}  ${ids.includes(v) ? "✓" : "✗ ABSENT"}`);
console.log("\nNemotron dans le catalogue :");
ids.filter((i) => /nemotron/i.test(i)).forEach((i) => console.log("  " + i));
