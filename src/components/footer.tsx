"use client";

import { useT } from "@/lib/i18n";

export function Footer() {
  const t = useT();
  return (
    <footer className="print-hidden border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-medium text-ink-2">Argus</span> — {t.footerBuilt}{" "}
          <a href="https://github.com/Chinorab/argus" className="underline decoration-line underline-offset-2 hover:text-ink">
            GitHub
          </a>{" "}
          · Apache 2.0
        </p>
        <p>{t.footerModels}</p>
      </div>
      <p className="mx-auto w-full max-w-5xl px-4 pb-6 text-[11px] text-ink-3">{t.footerDisclaimer}</p>
    </footer>
  );
}
