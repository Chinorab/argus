"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, X, Thermometer, FileText, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { compressImage } from "@/lib/client/images";

export interface PhotoDraft {
  ref: string;
  dataUrl: string;
  hint: string;
  name: string;
}

export interface CaptureDraft {
  etablissement: string;
  photos: PhotoDraft[];
  temperatures: string;
  declaratif: string;
}

const EXEMPLE_TEMPERATURES = `Relevés du 14/09 au 16/09
Frigo 1 (produits laitiers) : 14/09 matin 3.5 ; soir 4.0 ; 15/09 matin 3.8 ; soir 4.2 ; 16/09 matin 3.6
Frigo 2 (viandes) : 14/09 matin 6.5 ; soir 7.1 ; 15/09 matin 7.0 ; soir 7.4 ; 16/09 matin 6.9
Congélateur : 14/09 -19 ; 15/09 -18.5 ; 16/09 -17
Bain-marie service midi 15/09 : 58`;

const EXEMPLE_DECLARATIF = `Restaurant traditionnel 45 couverts, 3 salariés en cuisine. Formation hygiène 14 h suivie en 2019.
Pas de plan de maîtrise sanitaire écrit. Températures relevées « quand on y pense » sur un cahier.
Nettoyage chaque soir sans plan écrit. Contrat dératisation en cours.
Le frigo 2 fait du bruit depuis une semaine et la porte ferme mal.`;

interface Props {
  onSubmit: (draft: CaptureDraft) => void;
  busy?: boolean;
}

export function CaptureForm({ onSubmit, busy }: Props) {
  const [etablissement, setEtablissement] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [temperatures, setTemperatures] = useState("");
  const [declaratif, setDeclaratif] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setLoading(true);
    const next: PhotoDraft[] = [];
    for (const file of Array.from(list).slice(0, 12 - photos.length)) {
      const dataUrl = await compressImage(file);
      next.push({
        ref: "",
        dataUrl,
        name: file.name,
        hint: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/^(img|dsc|pxl|photo)\s*\d*$/i, ""),
      });
    }
    setPhotos((p) => renumber([...p, ...next]));
    setLoading(false);
  }

  function renumber(list: PhotoDraft[]): PhotoDraft[] {
    return list.map((p, i) => ({ ...p, ref: `P-${String(i + 1).padStart(2, "0")}` }));
  }

  const canSubmit = photos.length > 0 && !busy && !loading;

  /** Charge le dossier de démonstration embarqué (photos Wikimedia Commons sous licence libre). */
  async function loadDemo() {
    setLoading(true);
    try {
      const manifest = (await fetch("/demo/manifest.json").then((r) => r.json())) as {
        etablissement: string;
        photos: { file: string; hint: string }[];
        temperatures: string;
        declaratif: string;
      };
      const next: PhotoDraft[] = [];
      for (const p of manifest.photos) {
        const blob = await fetch(`/demo/${p.file}`).then((r) => r.blob());
        const dataUrl = await compressImage(new File([blob], p.file, { type: blob.type }));
        next.push({ ref: "", dataUrl, name: p.file, hint: p.hint });
      }
      setEtablissement(manifest.etablissement);
      setPhotos(renumber(next));
      setTemperatures(manifest.temperatures);
      setDeclaratif(manifest.declaratif);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-32 pt-6 sm:pt-10"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ etablissement, photos, temperatures, declaratif });
      }}
    >
      <header className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">Nouvelle inspection</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ce que l&apos;inspecteur verra demain, <span className="text-accent">vu aujourd&apos;hui.</span>
        </h1>
        <p className="max-w-xl text-ink-2">
          Photographiez la cuisine, collez vos relevés de température, décrivez la situation. Argus simule
          l&apos;inspection DDPP et prédit votre note Alim&apos;confiance.
        </p>
        <button
          type="button"
          onClick={loadDemo}
          disabled={loading}
          className="mt-1 flex w-fit items-center gap-1.5 rounded-full border border-line bg-paper-2 px-3 py-1.5 text-xs text-ink-2 transition hover:bg-paper-3 disabled:opacity-50"
        >
          <Sparkles size={13} className="text-accent" /> Essayer avec le dossier de démonstration
        </button>
      </header>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Établissement</span>
        <input
          value={etablissement}
          onChange={(e) => setEtablissement(e.target.value)}
          placeholder="Ex. Le Comptoir de Saint-Denis"
          className="rounded-lg border border-line bg-paper-2 px-3 py-2.5 outline-none ring-accent/40 placeholder:text-ink-3 focus:ring-2"
        />
      </label>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Photos de la cuisine</h2>
          <span className="text-xs text-ink-3">{photos.length}/12 · frigos, plans de travail, plonge, déchets, sols</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <figure key={p.ref} className="argus-rise group relative overflow-hidden rounded-lg border border-line bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.dataUrl} alt={p.hint || p.name} className="aspect-[4/3] w-full object-cover" />
              <span className="absolute left-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-paper">{p.ref}</span>
              <button
                type="button"
                aria-label="Retirer la photo"
                onClick={() => setPhotos((list) => renumber(list.filter((_, j) => j !== i)))}
                className="absolute right-2 top-2 rounded-full bg-ink/80 p-1 text-paper opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              >
                <X size={14} />
              </button>
              <input
                value={p.hint}
                onChange={(e) => setPhotos((list) => list.map((x, j) => (j === i ? { ...x, hint: e.target.value } : x)))}
                placeholder="Légende (ex. frigo 2 viandes)"
                className="w-full border-t border-line bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-ink-3"
              />
            </figure>
          ))}

          {photos.length < 12 && (
            <div className="flex aspect-[4/3] flex-col items-stretch gap-2 rounded-lg border border-dashed border-line bg-paper-2/60 p-2 sm:aspect-auto sm:min-h-[9.5rem]">
              <button
                type="button"
                onClick={() => cameraInput.current?.click()}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-md bg-accent text-sm font-medium text-accent-ink transition hover:opacity-90 sm:hidden"
              >
                <Camera size={20} /> Prendre une photo
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-md text-sm text-ink-2 transition hover:bg-paper-3"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <ImagePlus size={20} />}
                {loading ? "Compression…" : "Ajouter des photos"}
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
            <Thermometer size={15} className="text-ink-3" /> Relevés de température
          </h2>
          <button type="button" onClick={() => setTemperatures(EXEMPLE_TEMPERATURES)} className="text-xs text-accent hover:underline">
            Coller un exemple
          </button>
        </div>
        <textarea
          value={temperatures}
          onChange={(e) => setTemperatures(e.target.value)}
          rows={5}
          placeholder={"Collez votre cahier, un CSV ou écrivez librement :\nFrigo 2 (viandes) : lundi 6.5, mardi 7.1…"}
          className="rounded-lg border border-line bg-paper-2 px-3 py-2.5 font-mono text-sm outline-none ring-accent/40 placeholder:text-ink-3 focus:ring-2"
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <FileText size={15} className="text-ink-3" /> Situation de l&apos;établissement
          </h2>
          <button type="button" onClick={() => setDeclaratif(EXEMPLE_DECLARATIF)} className="text-xs text-accent hover:underline">
            Coller un exemple
          </button>
        </div>
        <textarea
          value={declaratif}
          onChange={(e) => setDeclaratif(e.target.value)}
          rows={4}
          placeholder="PMS existant ? Formation hygiène ? Prestataire nuisibles ? Un équipement qui pose problème ?"
          className="rounded-lg border border-line bg-paper-2 px-3 py-2.5 text-sm outline-none ring-accent/40 placeholder:text-ink-3 focus:ring-2"
        />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <p className="text-xs text-ink-3">
            {photos.length === 0 ? "Ajoutez au moins une photo." : `${photos.length} photo${photos.length > 1 ? "s" : ""} · ~1 min d'analyse`}
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            Lancer l&apos;inspection <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}
