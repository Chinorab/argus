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
  value_c: number;
  timestamp?: string | null;
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

export function isCompliant(value: number, limit: Limit): boolean {
  return limit.direction === "max" ? value <= limit.limit_c : value >= limit.limit_c;
}

/** Applies limits, verdicts and persistent-drift detection (≥ 2 consecutive out-of-range readings). */
export function qualify(raw: RawReading[]): TemperatureReading[] {
  const out: TemperatureReading[] = raw.map((r) => {
    const limit = limitFor(r.kind, r.foodstuff ?? "unknown");
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

  // Persistent drift per unit, in the order given (assumed chronological).
  const byUnit = new Map<string, TemperatureReading[]>();
  for (const r of out) {
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
