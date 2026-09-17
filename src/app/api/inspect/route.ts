import { runInspection, type InspectionInput } from "@/lib/pipeline/run";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PHOTOS = 12;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // photos are recompressed client-side (≤ 1600 px)

/**
 * POST /api/inspect — receives the case file (JSON) and returns an SSE stream of inspection events.
 * Each `data:` line is a serialised InspectionEvent.
 */
export async function POST(request: Request) {
  let input: InspectionInput;
  try {
    input = (await request.json()) as InspectionInput;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(input.photos) || input.photos.length === 0)
    return Response.json({ error: "At least one photo is required" }, { status: 400 });
  if (input.photos.length > MAX_PHOTOS)
    return Response.json({ error: `${MAX_PHOTOS} photos maximum` }, { status: 400 });
  for (const p of input.photos) {
    if (typeof p.dataUrl !== "string" || !p.dataUrl.startsWith("data:image/"))
      return Response.json({ error: `Photo ${p.ref}: invalid format` }, { status: 400 });
    if (p.dataUrl.length > MAX_PHOTO_BYTES * 1.4)
      return Response.json({ error: `Photo ${p.ref}: too large` }, { status: 400 });
  }
  if (input.voiceNotes && (!Array.isArray(input.voiceNotes) || input.voiceNotes.length > 20 || input.voiceNotes.some((n) => typeof n !== "string" || n.length > 2000)))
    return Response.json({ error: "voiceNotes: up to 20 strings of 2000 characters" }, { status: 400 });
  if (!process.env.NEBIUS_API_KEY)
    return Response.json({ error: "NEBIUS_API_KEY is missing on the server" }, { status: 500 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      // Initial SSE comment: forces some proxies to open the stream.
      controller.enqueue(encoder.encode(": argus\n\n"));
      try {
        for await (const event of runInspection(input)) {
          if (request.signal.aborted) break;
          send(event);
        }
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
