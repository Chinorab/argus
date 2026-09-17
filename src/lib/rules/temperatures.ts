import type { TemperatureReading } from "@/lib/schemas";

/**
 * Deterministic temperature compliance rules (French order of 21 December 2009).
 * The model only transcribes; the limit and the verdict are decided here.
 */

export type Kind = TemperatureReading["kind"];

/** Chilled sub-category: the limit depends on the foodstuff. */
export type Foodstuff = "minced_meat" | "meat" | "fish" | "cooked_dish" | "perishable" | "unknown";

export interface RawReading {
  equipment: string;
  kind: Kind;
  foodstuff?: Foodstuff | null;
  /** For a cooling batch: the FINAL temperature. */
  value_c: number;
  timestamp?: string | null;
  /** Cooling batches only. */
  start_c?: number | null;
  duration_min?: number | null;
}

export interface Limit {
  limit_c: number;
  /** "max": value must be ≤ limit; "min": value must be ≥ limit. */
  direction: "max" | "min";
  label: string;
}

export function limitFor(kind: Kind, foodstuff: Foodstuff = "unknown"): Limit {
  switch (kind) {
    case "chilled":
      switch (foodstuff) {
        case "minced_meat":
          return { limit_c: 2, direction: "max", label: "minced meat ≤ +2 °C" };
        case "fish":
          return { limit_c: 2, direction: "max", label: "fresh fish 0 to +2 °C" };
        case "cooked_dish":
          return { limit_c: 3, direction: "max", label: "cook-chill dishes ≤ +3 °C" };
        default:
          return { limit_c: 4, direction: "max", label: "perishable foods ≤ +4 °C" };
      }
    case "frozen":
      return { limit_c: -18, direction: "max", label: "frozen foods ≤ −18 °C" };
    case "hot_holding":
      return { limit_c: 63, direction: "min", label: "hot holding ≥ +63 °C" };
    case "cooling":
      return { limit_c: 10, direction: "max", label: "rapid cooling: ≤ +10 °C within 2 h" };
    default:
      return { limit_c: 4, direction: "max", label: "perishable foods ≤ +4 °C (default)" };
  }
}

/** Door-opening tolerance on chilled units (reference § 2): +2 °C, isolated. */
const CHILLED_TOLERANCE = 2;
/** Rapid cooling: from +63 °C down to +10 °C within 2 hours. */
const COOLING_MAX_MINUTES = 120;

export function isCompliant(value: number, limit: Limit): boolean {
  return limit.direction === "max" ? value <= limit.limit_c : value >= limit.limit_c;
}

/** Applies limits, verdicts and persistent-drift detection (≥ 2 consecutive out-of-range readings). */
export function qualify(raw: RawReading[]): TemperatureReading[] {
  const out: TemperatureReading[] = raw.map((r) => {
    const limit = limitFor(r.kind, r.foodstuff ?? "unknown");

    // A cooling batch is judged on its final temperature AND the time it took.
    if (r.kind === "cooling") {
      const reachedTarget = r.value_c <= limit.limit_c;
      const tooSlow = r.duration_min != null && r.duration_min > COOLING_MAX_MINUTES;
      const compliant = reachedTarget && !tooSlow;
      const parts: string[] = [];
      if (r.start_c != null) parts.push(`from ${r.start_c} °C`);
      parts.push(`to ${r.value_c} °C`);
      if (r.duration_min != null) parts.push(`in ${r.duration_min} min`);
      const note = compliant
        ? `rapid cooling ${parts.join(" ")} — within +63 °C → +10 °C in 2 h`
        : `rapid cooling ${parts.join(" ")} — ${!reachedTarget ? "target of +10 °C not reached" : ""}${!reachedTarget && tooSlow ? "; " : ""}${tooSlow ? `exceeds ${COOLING_MAX_MINUTES} min` : ""}`;
      return {
        equipment: r.equipment,
        kind: r.kind,
        value_c: r.value_c,
        timestamp: r.timestamp ?? undefined,
        limit_c: limit.limit_c,
        compliant,
        note,
        start_c: r.start_c ?? undefined,
        duration_min: r.duration_min ?? undefined,
        persistent_drift: false,
      };
    }

    const compliant = isCompliant(r.value_c, limit);
    let note: string | undefined;
    if (!compliant) {
      const gap = limit.direction === "max" ? r.value_c - limit.limit_c : limit.limit_c - r.value_c;
      const tolerable = r.kind === "chilled" && gap <= CHILLED_TOLERANCE;
      note = `${gap.toFixed(1)} °C beyond the limit (${limit.label})${tolerable ? "; within the isolated door-opening tolerance if documented" : ""}`;
    }
    return {
      equipment: r.equipment,
      kind: r.kind,
      value_c: r.value_c,
      timestamp: r.timestamp ?? undefined,
      limit_c: limit.limit_c,
      compliant,
      note,
      persistent_drift: false,
    };
  });

  // Persistent drift per unit, in the order given (assumed chronological). Cooling batches are independent events.
  const byUnit = new Map<string, TemperatureReading[]>();
  for (const r of out) {
    if (r.kind === "cooling") continue;
    const k = r.equipment.trim().toLowerCase();
    byUnit.set(k, [...(byUnit.get(k) ?? []), r]);
  }
  for (const readings of byUnit.values()) {
    let streak = 0;
    for (const r of readings) {
      streak = r.compliant ? 0 : streak + 1;
      if (streak >= 2) {
        r.persistent_drift = true;
        r.note = `${r.note ?? ""}; PERSISTENT DRIFT: ${streak} consecutive readings out of range — cold/hot chain failure`.replace(/^; /, "");
      }
    }
    const bad = readings.filter((r) => !r.compliant).length;
    if (bad >= 2 && readings.length >= 3 && bad / readings.length >= 0.5) {
      const last = readings[readings.length - 1];
      if (!last.persistent_drift) last.note = `${last.note ?? ""}; ${bad}/${readings.length} readings out of range over the period`.replace(/^; /, "");
    }
  }
  return out;
}
