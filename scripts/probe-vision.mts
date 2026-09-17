// Probes which catalogue models accept image input.
//   npm run probe-vision -- samples/demo/pass-station.jpg nvidia/... openbmb/...
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
config({ path: ".env.local" });
const { nebius } = await import("../src/lib/nebius");
const [file, ...candidates] = process.argv.slice(2);
const img = `data:image/jpeg;base64,${(await readFile(file)).toString("base64")}`;
for (const model of candidates) {
  const t0 = Date.now();
  try {
    const r = await nebius.chat.completions.create({
      model,
      max_tokens: 200,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: img } },
            { type: "text", text: "Describe what you see in two sentences and name one visible hygiene issue." },
          ],
        },
      ],
    });
    console.log(`\nok ${model} (${Date.now() - t0} ms, ${r.usage?.total_tokens} tok)\n  ${(r.choices[0].message.content ?? "").replace(/\s+/g, " ").slice(0, 400)}`);
  } catch (e) {
    console.log(`\nFAIL ${model} (${Date.now() - t0} ms) - ${(e as Error).message.slice(0, 200)}`);
  }
}
