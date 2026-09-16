// Lists the models exposed by Token Factory for this API key and checks the ones Argus uses.
import { config } from "dotenv";
config({ path: ".env.local" });
const { nebius, MODELS } = await import("../src/lib/nebius");
const list = await nebius.models.list();
const ids = list.data.map((m) => m.id).sort();
console.log(`${ids.length} models available\n`);
for (const [k, v] of Object.entries(MODELS)) console.log(`  ${k.padEnd(14)} ${v}  ${ids.includes(v) ? "ok" : "MISSING"}`);
console.log("\nCatalogue:");
ids.forEach((i) => console.log("  " + i));
