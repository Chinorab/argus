"use client";

import { PackageOpen, Archive, Snowflake, Leaf, Salad, Flame, CookingPot, Droplets, Trash2, DoorOpen, Armchair, TreePine, ClipboardList } from "lucide-react";
import type { Finding, Severity, Zone } from "@/lib/schemas";
import { ZONE_VALUES } from "@/lib/schemas";
import { SEVERITY_COLOR, useT } from "@/lib/i18n";

const ICONS: Record<Zone, React.ReactNode> = {
  receiving: <PackageOpen size={16} />,
  dry_storage: <Archive size={16} />,
  cold_storage: <Snowflake size={16} />,
  vegetable_prep: <Leaf size={16} />,
  cold_prep: <Salad size={16} />,
  hot_prep: <Flame size={16} />,
  cooking: <CookingPot size={16} />,
  dishwashing: <Droplets size={16} />,
  waste: <Trash2 size={16} />,
  staff_facilities: <DoorOpen size={16} />,
  dining_room: <Armchair size={16} />,
  outdoor: <TreePine size={16} />,
  general: <ClipboardList size={16} />,
};

const RANK: Record<Severity, number> = { minor: 1, major: 2, critical: 3 };

/** Findings by kitchen zone: a quick map of where the inspection hurts. */
export function ZoneMap({ findings }: { findings: Finding[] }) {
  const t = useT();
  const byZone = new Map<Zone, Finding[]>();
  for (const f of findings) byZone.set(f.zone, [...(byZone.get(f.zone) ?? []), f]);

  return (
    <section className="argus-rise flex flex-col gap-3" style={{ animationDelay: "90ms" }}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-ink-3">{t.zoneMap}</h2>
        <span className="text-xs text-ink-3">{t.zoneMapHint}</span>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
        {ZONE_VALUES.map((z) => {
          const list = byZone.get(z) ?? [];
          const worst = list.reduce<Severity | null>((w, f) => (!w || RANK[f.severity] > RANK[w] ? f.severity : w), null);
          return (
            <li
              key={z}
              className={`flex flex-col gap-1.5 rounded-lg border p-2.5 text-xs transition ${worst ? "border-line bg-paper-2" : "border-dashed border-line/70 text-ink-3"}`}
              title={list.map((f) => `${f.id} ${f.title}`).join("\n") || t.noFindingsZone}
            >
              <div className="flex items-center justify-between">
                <span className={worst ? "text-ink-2" : ""}>{ICONS[z]}</span>
                {worst && <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[10px] font-semibold text-white ${SEVERITY_COLOR[worst]}`}>{list.length}</span>}
              </div>
              <span className="truncate leading-tight">{t.zone[z]}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
