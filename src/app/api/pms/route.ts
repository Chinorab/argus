import { generatePms, type PmsInput } from "@/lib/pipeline/pms";

export const runtime = "nodejs";
export const maxDuration = 300;

/** POST /api/pms — generates the Food Safety Management Plan from the case file and the report. */
export async function POST(request: Request) {
  let input: PmsInput;
  try {
    input = (await request.json()) as PmsInput;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!input.report || !input.caseText) return Response.json({ error: "report and caseText are required" }, { status: 400 });
  if (!process.env.NEBIUS_API_KEY) return Response.json({ error: "NEBIUS_API_KEY is missing on the server" }, { status: 500 });
  try {
    const result = await generatePms({ ...input, lang: input.lang === "fr" ? "fr" : "en" });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
