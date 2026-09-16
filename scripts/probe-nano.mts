import { config } from "dotenv";
import { readFile } from "node:fs/promises";
config({ path: ".env.local" });
const { nebius } = await import("../src/lib/nebius");
const raw = await readFile("samples/demo/temperatures.txt", "utf8");
for (const [label, extra] of [["défaut", {}], ["enable_thinking=false", { chat_template_kwargs: { enable_thinking: false } }], ["reasoning_effort=none", { reasoning_effort: "none" }]] as const) {
  const t0 = Date.now();
  try {
    const r = await nebius.chat.completions.create({
      model: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B", temperature: 0, max_tokens: 3000,
      messages: [{ role: "system", content: "Normalise ces relevés en JSON {\"releves\":[{equipement, valeur_c, conforme}]}. Réponds uniquement en JSON." }, { role: "user", content: raw }],
      ...(extra as object),
    });
    const m = r.choices[0].message as { content: string | null; reasoning?: string };
    console.log(`\n[${label}] ${Date.now() - t0} ms, finish=${r.choices[0].finish_reason}, completion=${r.usage?.completion_tokens}, reasoning=${m.reasoning?.length ?? 0} chars`);
    console.log((m.content ?? "(vide)").slice(0, 300));
  } catch (e) { console.log(`\n[${label}] ✗ ${(e as Error).message.slice(0, 200)}`); }
}
