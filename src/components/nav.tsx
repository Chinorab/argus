"use client";

import Link from "next/link";
import { LangToggle, useT } from "@/lib/i18n";

/** Fired by the logo: the single-page flow listens and goes back to the landing screen. */
export const HOME_EVENT = "argus:home";

export function Nav() {
  const t = useT();
  return (
    <nav className="border-b border-line">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={() => {
            window.dispatchEvent(new Event(HOME_EVENT));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span aria-hidden className="inline-block h-5 w-5 rounded-full border-[3px] border-accent" />
          Argus
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-ink-3 sm:inline">{t.tagline}</span>
          <LangToggle />
        </div>
      </div>
    </nav>
  );
}
