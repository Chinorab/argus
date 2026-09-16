import { config } from "dotenv";
import { readFile } from "node:fs/promises";
config({ path: ".env.local" });
const { nebius } = await import("../src/lib/nebius");
const img = `data:image/jpeg;base64,${(await readFile("samples/demo/cuisine-preparation.jpg")).toString("base64")}`;
const candidates = process.argv.slice(2);
for (const model of candidates) {
  const t0 = Date.now();
  try {
    const r = await nebius.chat.completions.create({
      model, max_tokens: 200, temperature: 0.2,
      messages: [{ role: "user", content: [
        { type: "image_url", image_url: { url: img } },
        { type: "text", text: "Décris en 2 phrases ce que tu vois et cite une anomalie d'hygiène visible." },
      ]}],
    });
    console.log(`\n✓ ${model} (${Date.now() - t0} ms, ${r.usage?.total_tokens} tok)\n  ${(r.choices[0].message.content ?? "").replace(/\s+/g, " ").slice(0, 400)}`);
  } catch (e) {
    console.log(`\n✗ ${model} (${Date.now() - t0} ms) — ${(e as Error).message.slice(0, 200)}`);
  }
}
