"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Minimal typings for the Web Speech API (not in every TS lib.dom). */
interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Browser speech-to-text (Web Speech API). Free, on-device or vendor cloud depending on the
 * browser; not available in Firefox. The transcript is then structured server-side by Nemotron.
 */
export function useSpeech(lang: "en" | "fr", onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<RecognitionLike | null>(null);
  const finalBuffer = useRef("");

  useEffect(() => {
    const id = setTimeout(() => setSupported(Boolean(getCtor())), 0);
    return () => clearTimeout(id);
  }, []);

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setError(null);
    finalBuffer.current = "";
    setInterim("");
    const r = new Ctor();
    r.lang = lang === "fr" ? "fr-FR" : "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalBuffer.current += res[0].transcript + " ";
        else interimText += res[0].transcript;
      }
      setInterim(finalBuffer.current + interimText);
    };
    r.onerror = (e) => {
      if (e.error !== "aborted" && e.error !== "no-speech") setError(e.error);
    };
    r.onend = () => {
      setListening(false);
      const text = finalBuffer.current.trim();
      finalBuffer.current = "";
      setInterim("");
      if (text) onFinal(text);
      rec.current = null;
    };
    rec.current = r;
    setListening(true);
    r.start();
  }, [lang, onFinal]);

  useEffect(() => () => rec.current?.abort(), []);

  return { supported, listening, interim, error, start, stop };
}
