import { MODELS } from "@/lib/nebius";
import type { Lang } from "@/lib/lang";
import type { Observation, TemperatureReading } from "@/lib/schemas";
import { perceiveImage, perceiveAudio, type VoiceNote } from "./perceive";
import { extractTemperatures } from "./extract";
import { judge, type CaseFile, type JudgeResult } from "./judge";

export interface PhotoInput {
  /** Stable client-side identifier (e.g. "P-01"). */
  ref: string;
  /** Image data URL. */
  dataUrl: string;
  /** Optional caption typed by the operator. */
  hint?: string;
}

export interface AudioInput {
  ref: string;
  base64: string;
  format: "wav" | "mp3";
}

export interface InspectionInput {
  establishment: string;
  photos: PhotoInput[];
  audios?: AudioInput[];
  temperatures?: string;
  statement?: string;
  lang?: Lang;
}

/** Events emitted during an inspection, consumed by the UI timeline. */
export type InspectionEvent =
  | { type: "start"; establishment: string; photoCount: number; audioCount: number; at: number }
  | { type: "photo:start"; ref: string; model: string }
  | { type: "photo:done"; ref: string; observation: Observation; ms: number }
  | { type: "photo:error"; ref: string; message: string }
  | { type: "audio:start"; ref: string; model: string }
  | { type: "audio:done"; ref: string; note: VoiceNote; ms: number }
  | { type: "audio:error"; ref: string; message: string }
  | { type: "temperatures:start"; model: string }
  | { type: "temperatures:done"; readings: TemperatureReading[]; ms: number }
  | { type: "temperatures:error"; message: string }
  | { type: "judge:start"; model: string; at: number }
  | { type: "judge:fallback"; model: string }
  | { type: "judge:done"; result: JudgeResult }
  | { type: "error"; message: string }
  | { type: "end"; totalMs: number };

/**
 * Orchestrates the full inspection and emits events as they happen.
 * Photos, audio and temperature logs run in parallel, then the judgement.
 */
export async function* runInspection(input: InspectionInput): AsyncGenerator<InspectionEvent> {
  const t0 = Date.now();
  const lang: Lang = input.lang ?? "en";
  const audios = input.audios ?? [];
  yield { type: "start", establishment: input.establishment, photoCount: input.photos.length, audioCount: audios.length, at: t0 };

  // Event queue fed by the parallel tasks and drained by the generator.
  const queue: InspectionEvent[] = [];
  let wake: (() => void) | undefined;
  const push = (e: InspectionEvent) => {
    queue.push(e);
    wake?.();
  };

  const photos: CaseFile["photos"] = [];
  const voiceNotes: VoiceNote[] = [];

  const tasks: Promise<void>[] = [
    ...input.photos.map(async (p) => {
      push({ type: "photo:start", ref: p.ref, model: MODELS.perception });
      const t = Date.now();
      try {
        const observation = await perceiveImage({ image: p.dataUrl, hint: p.hint, lang });
        photos.push({ ref: p.ref, hint: p.hint, observation });
        push({ type: "photo:done", ref: p.ref, observation, ms: Date.now() - t });
      } catch (err) {
        push({ type: "photo:error", ref: p.ref, message: (err as Error).message });
      }
    }),
    ...audios.map(async (a) => {
      push({ type: "audio:start", ref: a.ref, model: MODELS.perception });
      const t = Date.now();
      try {
        const note = await perceiveAudio(a.base64, a.format, lang);
        voiceNotes.push(note);
        push({ type: "audio:done", ref: a.ref, note, ms: Date.now() - t });
      } catch (err) {
        push({ type: "audio:error", ref: a.ref, message: (err as Error).message });
      }
    }),
  ];

  let temperatures: TemperatureReading[] = [];
  if (input.temperatures?.trim()) {
    tasks.push(
      (async () => {
        push({ type: "temperatures:start", model: MODELS.fast });
        const t = Date.now();
        try {
          temperatures = await extractTemperatures(input.temperatures!);
          push({ type: "temperatures:done", readings: temperatures, ms: Date.now() - t });
        } catch (err) {
          push({ type: "temperatures:error", message: (err as Error).message });
        }
      })(),
    );
  }

  // Drains the event queue until the pending work settles.
  async function* drain(pending: Promise<unknown>): AsyncGenerator<InspectionEvent> {
    let finished = false;
    const done = pending.then(() => {
      finished = true;
      wake?.();
    });
    while (!finished || queue.length) {
      if (queue.length) {
        yield queue.shift()!;
        continue;
      }
      await new Promise<void>((r) => (wake = r));
    }
    await done;
  }

  yield* drain(Promise.all(tasks));

  // Stable photo order (parallel tasks finish out of order).
  photos.sort((a, b) => a.ref.localeCompare(b.ref));

  const caseFile: CaseFile = {
    establishment: { name: input.establishment || "Establishment", type: "commercial_restaurant" },
    photos,
    temperatures,
    voiceNotes,
    statement: input.statement,
    lang,
  };

  const judging = judge(caseFile, (e) => {
    if (e.type === "start") push({ type: "judge:start", model: e.model, at: Date.now() });
    if (e.type === "fallback") push({ type: "judge:fallback", model: e.model });
  })
    .then((result) => push({ type: "judge:done", result }))
    .catch((err: Error) => push({ type: "error", message: err.message }));

  yield* drain(judging);

  yield { type: "end", totalMs: Date.now() - t0 };
}
