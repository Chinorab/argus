import { config } from "dotenv";
config({ path: ".env.local" });
const { nebius } = await import("../src/lib/nebius");
const list = await nebius.models.list();
for (const m of list.data) console.log(m.id, JSON.stringify(m).slice(0, 300));
