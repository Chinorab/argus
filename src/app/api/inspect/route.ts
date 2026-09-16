import { runInspection, type InspectionInput } from "@/lib/pipeline/run";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PHOTOS = 12;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // les photos sont recompressées côté client (≤ 1600 px)

/**
 * POST /api/inspect — reçoit le dossier (JSON) et renvoie un flux SSE d'événements d'inspection.
 * Chaque ligne `data:` est un InspectionEvent sérialisé.
 */
export async function POST(request: Request) {
  let input: InspectionInput;
  try {
    input = (await request.json()) as InspectionInput;
  } catch {
    return Response.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  if (!Array.isArray(input.photos) || input.photos.length === 0)
    return Response.json({ error: "Au moins une photo est requise" }, { status: 400 });
  if (input.photos.length > MAX_PHOTOS)
    return Response.json({ error: `${MAX_PHOTOS} photos maximum` }, { status: 400 });
  for (const p of input.photos) {
    if (typeof p.dataUrl !== "string" || !p.dataUrl.startsWith("data:image/"))
      return Response.json({ error: `Photo ${p.ref} : format invalide` }, { status: 400 });
    if (p.dataUrl.length > MAX_PHOTO_BYTES * 1.4)
      return Response.json({ error: `Photo ${p.ref} : trop volumineuse` }, { status: 400 });
  }
  if (!process.env.NEBIUS_API_KEY)
    return Response.json({ error: "NEBIUS_API_KEY manquante côté serveur" }, { status: 500 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      // Commentaire SSE initial : force l'ouverture du flux chez certains proxys.
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
