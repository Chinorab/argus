"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X, Thermometer, FileText, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { compressImage } from "@/lib/client/images";
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
  temperatures: string;
  statement: string;
}

interface DemoManifest {
  establishment: string;
  photos: { file: string; hint: Record<string, string> }[];
  temperatures: Record<string, string>;
  statement: Record<string, string>;
}

interface Props {
  onSubmit: (draft: CaptureDraft) => void;
  busy?: boolean;
}

const MAX_PHOTOS = 12;

export function CaptureForm({ onSubmit, busy }: Props) {
  const t = useT();
  const { lang } = useLang();
  const [establishment, setEstablishment] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [temperatures, setTemperatures] = useState("");
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(false);
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

  /** Loads the bundled demo case file (Wikimedia Commons photos under free licences). */
  async function loadDemo() {
    setLoading(true);
    try {
      const manifest = (await fetch("/demo/manifest.json").then((r) => r.json())) as DemoManifest;
      const next: PhotoDraft[] = [];
      for (const p of manifest.photos) {
        const blob = await fetch(`/demo/${p.file}`).then((r) => r.blob());
        const dataUrl = await compressImage(new File([blob], p.file, { type: blob.type }));
        next.push({ ref: "", dataUrl, name: p.file, hint: p.hint[lang] ?? p.hint.en });
      }
      setEstablishment(manifest.establishment);
      setPhotos(renumber(next));
      setTemperatures(manifest.temperatures[lang] ?? manifest.temperatures.en);
      setStatement(manifest.statement[lang] ?? manifest.statement.en);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = photos.length > 0 && !busy && !loading;

  return (
    <form
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-32 pt-6 sm:pt-10"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ establishment, photos, temperatures, statement });
      }}
    >
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">{t.newInspection}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.heroA} <span className="text-accent">{t.heroB}</span>
        </h1>
        <p className="max-w-xl text-ink-2">{t.heroText}</p>
        <button
          type="button"
          onClick={loadDemo}
          disabled={loading}
          className="mt-1 flex w-fit items-center gap-1.5 rounded-full border border-line bg-paper-2 px-3 py-1.5 text-xs text-ink-2 transition hover:bg-paper-3 disabled:opacity-50"
        >
          <Sparkles size={13} className="text-accent" /> {t.tryDemo}
        </button>
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
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">{t.photos}</h2>
          <span className="text-right text-xs text-ink-3">
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
                className="absolute right-2 top-2 rounded-full bg-ink/80 p-1 text-paper opacity-0 transition group-hover:opacity-100 focus:opacity-100"
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

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/90 backdrop-blur">
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
}
