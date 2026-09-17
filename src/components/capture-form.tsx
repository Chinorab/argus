"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { Camera, ImagePlus, X, Thermometer, FileText, ArrowRight, Loader2, Sparkles, Mic, Square, MessageSquareText, Plus } from "lucide-react";
import { compressImage } from "@/lib/client/images";
import { useSpeech } from "@/lib/client/speech";
import { useLang, useT } from "@/lib/i18n";

export interface PhotoDraft {
  ref: string;
  dataUrl: string;
  hint: string;
  name: string;
}

export interface CaptureDraft {
  establishment: string;
  photos: PhotoDraft[];
  voiceNotes: string[];
  temperatures: string;
  statement: string;
}

interface DemoCase {
  id: string;
  establishment: string;
  photos: { file: string; hint: Record<string, string> }[];
  voiceNotes?: Record<string, string[]>;
  temperatures: Record<string, string>;
  statement: Record<string, string>;
}
interface DemoManifest {
  cases: DemoCase[];
}
export type DemoCaseId = "problem" | "clean";

interface Props {
  onSubmit: (draft: CaptureDraft) => void;
  busy?: boolean;
}

/** Actions the landing hero can trigger on the form. */
export interface CaptureFormHandle {
  loadDemo: (caseId: DemoCaseId) => Promise<void>;
  focus: () => void;
}

const MAX_PHOTOS = 12;

export const CaptureForm = forwardRef<CaptureFormHandle, Props>(function CaptureForm({ onSubmit, busy }, ref) {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const { lang } = useLang();
  const [establishment, setEstablishment] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [temperatures, setTemperatures] = useState("");
  const [statement, setStatement] = useState("");
  const [voiceNotes, setVoiceNotes] = useState<string[]>([]);
  const [typedNote, setTypedNote] = useState("");
  const [loading, setLoading] = useState(false);
  const addNote = useCallback((text: string) => {
    const clean = text.trim();
    if (clean) setVoiceNotes((list) => [...list, clean].slice(0, 20));
  }, []);
  const speech = useSpeech(lang, addNote);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  function renumber(list: PhotoDraft[]): PhotoDraft[] {
    return list.map((p, i) => ({ ...p, ref: `P-${String(i + 1).padStart(2, "0")}` }));
  }

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setLoading(true);
    try {
      const next: PhotoDraft[] = [];
      for (const file of Array.from(list).slice(0, MAX_PHOTOS - photos.length)) {
        const dataUrl = await compressImage(file);
        next.push({
          ref: "",
          dataUrl,
          name: file.name,
          // A camera file name like IMG_1234 carries no information; a human name does.
          hint: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/^(img|dsc|pxl|photo)\s*\d*$/i, ""),
        });
      }
      setPhotos((p) => renumber([...p, ...next]));
    } finally {
      setLoading(false);
    }
  }

  /** Loads one of the bundled demo case files (Wikimedia Commons photos under free licences). */
  async function loadDemo(caseId: DemoCaseId) {
    setLoading(true);
    try {
      const all = (await fetch("/demo/manifest.json").then((r) => r.json())) as DemoManifest;
      const manifest = all.cases.find((c) => c.id === caseId) ?? all.cases[0];
      const next: PhotoDraft[] = [];
      for (const p of manifest.photos) {
        const blob = await fetch(`/demo/${p.file}`).then((r) => r.blob());
        const dataUrl = await compressImage(new File([blob], p.file, { type: blob.type }));
        next.push({ ref: "", dataUrl, name: p.file, hint: p.hint[lang] ?? p.hint.en });
      }
      setEstablishment(manifest.establishment);
      setPhotos(renumber(next));
      setVoiceNotes(manifest.voiceNotes?.[lang] ?? manifest.voiceNotes?.en ?? []);
      setTemperatures(manifest.temperatures[lang] ?? manifest.temperatures.en);
      setStatement(manifest.statement[lang] ?? manifest.statement.en);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = photos.length > 0 && !busy && !loading;

  useImperativeHandle(ref, () => ({
    loadDemo: async (caseId) => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      await loadDemo(caseId);
    },
    focus: () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
  }));

  return (
    <form
      id="inspect"
      ref={formRef}
      className="mx-auto flex w-full max-w-3xl scroll-mt-4 flex-col gap-8 px-4 pb-16 pt-10 sm:pt-14"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ establishment, photos, voiceNotes, temperatures, statement });
      }}
    >
      <header className="flex flex-col gap-2 border-t border-line pt-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">{t.newInspection}</p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.heroText}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-2">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent" /> {t.tryDemo}:
          </span>
          <button type="button" onClick={() => loadDemo("clean")} disabled={loading} className="rounded-full border border-line bg-paper-2 px-3 py-1.5 transition hover:bg-paper-3 disabled:opacity-50">
            {t.tryDemoClean}
          </button>
          <button type="button" onClick={() => loadDemo("problem")} disabled={loading} className="rounded-full border border-line bg-paper-2 px-3 py-1.5 transition hover:bg-paper-3 disabled:opacity-50">
            {t.tryDemoProblem}
          </button>
        </div>
      </header>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t.establishment}</span>
        <input
          value={establishment}
          onChange={(e) => setEstablishment(e.target.value)}
          placeholder={t.establishmentPlaceholder}
          className="rounded-lg border border-line bg-paper-2 px-3 py-2.5 outline-none ring-accent/40 placeholder:text-ink-3 focus:ring-2"
        />
      </label>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <h2 className="text-sm font-medium">{t.photos}</h2>
          <span className="text-xs text-ink-3 sm:text-right">
            {photos.length}/{MAX_PHOTOS} · {t.photosHint}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <figure key={p.ref} className="argus-rise group relative overflow-hidden rounded-lg border border-line bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.dataUrl} alt={p.hint || p.name} className="aspect-[4/3] w-full object-cover" />
              <span className="absolute left-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-paper">{p.ref}</span>
              <button
                type="button"
                aria-label={t.removePhoto}
                onClick={() => setPhotos((list) => renumber(list.filter((_, j) => j !== i)))}
                className="absolute right-2 top-2 rounded-full bg-ink/80 p-1 text-paper transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              >
                <X size={14} />
              </button>
              <input
                value={p.hint}
                onChange={(e) => setPhotos((list) => list.map((x, j) => (j === i ? { ...x, hint: e.target.value } : x)))}
                placeholder={t.captionPlaceholder}
                className="w-full border-t border-line bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-ink-3"
              />
            </figure>
          ))}

          {photos.length < MAX_PHOTOS && (
            <div className="flex aspect-[4/3] flex-col items-stretch gap-2 rounded-lg border border-dashed border-line bg-paper-2/60 p-2 sm:aspect-auto sm:min-h-[9.5rem]">
              <button
                type="button"
                onClick={() => cameraInput.current?.click()}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-md bg-accent text-sm font-medium text-accent-ink transition hover:opacity-90 sm:hidden"
              >
                <Camera size={20} /> {t.takePhoto}
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-md text-sm text-ink-2 transition hover:bg-paper-3"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <ImagePlus size={20} />}
                {loading ? t.compressing : t.addPhotos}
              </button>
            </div>
          )}
        </div>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addFiles(e.target.files)} />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <MessageSquareText size={15} className="text-ink-3" /> {t.voiceNotes}
          </h2>
          <button type="button" onClick={() => addNote(t.exampleNote)} className="text-xs text-accent hover:underline">
            {t.pasteExample}
          </button>
        </div>
        <p className="text-xs text-ink-3">{t.voiceHint}</p>

        {voiceNotes.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {voiceNotes.map((n, i) => (
              <li key={i} className="argus-rise flex items-start gap-2 rounded-md border border-line bg-paper-2 p-2 text-sm">
                <span className="mt-0.5 font-mono text-[10px] text-ink-3">A-{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1">{n}</span>
                <button type="button" aria-label={t.removeNote} onClick={() => setVoiceNotes((list) => list.filter((_, j) => j !== i))} className="rounded p-0.5 text-ink-3 hover:bg-paper-3 hover:text-ink">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {speech.listening && (
          <p className="min-h-10 rounded-md border border-accent/40 bg-accent-soft/40 p-2 text-sm">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-n4" />
            {speech.interim || t.listening}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {speech.supported ? (
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${speech.listening ? "bg-n4 text-white" : "bg-accent text-accent-ink hover:opacity-90"}`}
            >
              {speech.listening ? <Square size={15} /> : <Mic size={15} />}
              {speech.listening ? t.stopRecording : t.startRecording}
            </button>
          ) : (
            <p className="text-xs text-ink-3">{t.speechUnsupported}</p>
          )}
          <div className="flex flex-1 gap-2">
            <input
              value={typedNote}
              onChange={(e) => setTypedNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNote(typedNote);
                  setTypedNote("");
                }
              }}
              placeholder={t.notePlaceholder}
              aria-label={t.typeNote}
              className="min-w-0 flex-1 rounded-lg border border-line bg-paper-2 px-3 py-2 text-sm outline-none ring-accent/40 placeholder:text-ink-3 focus:ring-2"
            />
            <button
              type="button"
              disabled={!typedNote.trim()}
              onClick={() => {
                addNote(typedNote);
                setTypedNote("");
              }}
              className="flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm hover:bg-paper-3 disabled:opacity-40"
            >
              <Plus size={14} /> {t.addNote}
            </button>
          </div>
        </div>
        {speech.error && <p className="text-xs text-n4">{speech.error}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <Thermometer size={15} className="text-ink-3" /> {t.temperatures}
          </h2>
          <button type="button" onClick={() => setTemperatures(t.exampleTemperatures)} className="text-xs text-accent hover:underline">
            {t.pasteExample}
          </button>
        </div>
        <textarea
          value={temperatures}
          onChange={(e) => setTemperatures(e.target.value)}
          rows={5}
          placeholder={t.temperaturesPlaceholder}
          className="rounded-lg border border-line bg-paper-2 px-3 py-2.5 font-mono text-sm outline-none ring-accent/40 placeholder:text-ink-3 focus:ring-2"
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <FileText size={15} className="text-ink-3" /> {t.statement}
          </h2>
          <button type="button" onClick={() => setStatement(t.exampleStatement)} className="text-xs text-accent hover:underline">
            {t.pasteExample}
          </button>
        </div>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={4}
          placeholder={t.statementPlaceholder}
          className="rounded-lg border border-line bg-paper-2 px-3 py-2.5 text-sm outline-none ring-accent/40 placeholder:text-ink-3 focus:ring-2"
        />
      </section>

      {/* The action bar sticks to the bottom only once there is something to inspect. */}
      <div className={photos.length > 0 ? "fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/90 backdrop-blur" : ""}>
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <p className="text-xs text-ink-3">{photos.length === 0 ? t.addAtLeastOne : t.photoCount(photos.length)}</p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            {t.run} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </form>
  );
});
