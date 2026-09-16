import { MODELS } from "@/lib/nebius";
import type { Observation, ReleveTemperature } from "@/lib/schemas";
import { perceiveImage, perceiveAudio, type AudioNote } from "./perceive";
import { extractTemperatures } from "./extract";
import { judge, type Dossier, type JudgeResult } from "./judge";

export interface PhotoInput {
  /** Identifiant stable côté client (ex. "P-01"). */
  ref: string;
  /** Data URL de l'image. */
  dataUrl: string;
  /** Légende facultative saisie par le gérant. */
  hint?: string;
}

export interface AudioInput {
  ref: string;
  base64: string;
  format: "wav" | "mp3";
}

export interface InspectionInput {
  etablissement: string;
  photos: PhotoInput[];
  audios?: AudioInput[];
  temperatures?: string;
  declaratif?: string;
}

/** Événements émis pendant l'inspection, consommés par la timeline de l'UI. */
export type InspectionEvent =
  | { type: "start"; etablissement: string; nbPhotos: number; nbAudios: number; at: number }
  | { type: "photo:start"; ref: string; modele: string }
  | { type: "photo:done"; ref: string; observation: Observation; ms: number }
  | { type: "photo:error"; ref: string; message: string }
  | { type: "audio:start"; ref: string; modele: string }
  | { type: "audio:done"; ref: string; note: AudioNote; ms: number }
  | { type: "audio:error"; ref: string; message: string }
  | { type: "temperatures:start"; modele: string }
  | { type: "temperatures:done"; releves: ReleveTemperature[]; ms: number }
  | { type: "temperatures:error"; message: string }
  | { type: "judge:start"; modele: string; at: number }
  | { type: "judge:fallback"; modele: string }
  | { type: "judge:done"; result: JudgeResult }
  | { type: "error"; message: string }
  | { type: "end"; totalMs: number };

/**
 * Orchestre l'inspection complète et émet les événements au fil de l'eau.
 * Les photos et l'audio sont traités en parallèle, puis les relevés, puis le jugement.
 */
export async function* runInspection(input: InspectionInput): AsyncGenerator<InspectionEvent> {
  const t0 = Date.now();
  const audios = input.audios ?? [];
  yield { type: "start", etablissement: input.etablissement, nbPhotos: input.photos.length, nbAudios: audios.length, at: t0 };

  // File d'événements alimentée par les tâches parallèles, vidée par le générateur.
  const queue: InspectionEvent[] = [];
  let wake: (() => void) | undefined;
  const push = (e: InspectionEvent) => {
    queue.push(e);
    wake?.();
  };

  const photos: Dossier["photos"] = [];
  const notesVocales: AudioNote[] = [];

  const tasks: Promise<void>[] = [
    ...input.photos.map(async (p) => {
      push({ type: "photo:start", ref: p.ref, modele: MODELS.perception });
      const t = Date.now();
      try {
        const observation = await perceiveImage({ image: p.dataUrl, hint: p.hint });
        photos.push({ ref: p.ref, hint: p.hint, observation });
        push({ type: "photo:done", ref: p.ref, observation, ms: Date.now() - t });
      } catch (err) {
        push({ type: "photo:error", ref: p.ref, message: (err as Error).message });
      }
    }),
    ...audios.map(async (a) => {
      push({ type: "audio:start", ref: a.ref, modele: MODELS.perception });
      const t = Date.now();
      try {
        const note = await perceiveAudio(a.base64, a.format);
        notesVocales.push(note);
        push({ type: "audio:done", ref: a.ref, note, ms: Date.now() - t });
      } catch (err) {
        push({ type: "audio:error", ref: a.ref, message: (err as Error).message });
      }
    }),
  ];

  let temperatures: ReleveTemperature[] = [];
  if (input.temperatures?.trim()) {
    tasks.push(
      (async () => {
        push({ type: "temperatures:start", modele: MODELS.fast });
        const t = Date.now();
        try {
          temperatures = await extractTemperatures(input.temperatures!);
          push({ type: "temperatures:done", releves: temperatures, ms: Date.now() - t });
        } catch (err) {
          push({ type: "temperatures:error", message: (err as Error).message });
        }
      })(),
    );
  }

  // Vide la file d'événements jusqu'à la fin des tâches en cours.
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

  // Ordre stable des photos (les tâches parallèles terminent dans le désordre).
  photos.sort((a, b) => a.ref.localeCompare(b.ref));

  const dossier: Dossier = {
    etablissement: { nom: input.etablissement || "Établissement", type: "restauration_commerciale" },
    photos,
    temperatures,
    notesVocales,
    declaratif: input.declaratif,
  };

  const judging = judge(dossier, (e) => {
    if (e.type === "start") push({ type: "judge:start", modele: e.modele, at: Date.now() });
    if (e.type === "fallback") push({ type: "judge:fallback", modele: e.modele });
  })
    .then((result) => push({ type: "judge:done", result }))
    .catch((err: Error) => push({ type: "error", message: err.message }));

  yield* drain(judging);

  yield { type: "end", totalMs: Date.now() - t0 };
}
