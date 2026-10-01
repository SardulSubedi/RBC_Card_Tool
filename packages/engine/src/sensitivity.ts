import { roundCad, scaleSpend, sumSpend } from "./money";
import { projectCard } from "./project";
import type { Catalog, ProfileInput } from "./types";

export interface SensitivityPoint {
  scale: number;
  monthlyTotalCad: number;
  values: Record<string, number | null>;
}

export interface BreakEvenCrossing {
  scale: number;
  monthlyTotalCad: number;
  cardAId: string;
  cardBId: string;
  direction: "a_overtakes_b" | "b_overtakes_a";
}

export function sensitivity(
  catalog: Catalog,
  input: ProfileInput,
  cardIds: string[],
  scales: number[],
): SensitivityPoint[] {
  return scales.map((scale) => {
    const monthly = scaleSpend(input.monthly, scale);
    const values: Record<string, number | null> = {};
    for (const id of cardIds) {
      const card = catalog.cards.find((item) => item.id === id);
      values[id] = card ? projectCard(catalog, card, monthly, input.shares, input.preferences).ongoingNetCad : null;
    }
    return { scale, monthlyTotalCad: roundCad(sumSpend(input.monthly) * scale), values };
  });
}

export function breakEven(
  catalog: Catalog,
  input: ProfileInput,
  cardAId: string,
  cardBId: string,
): { crossings: BreakEvenCrossing[]; note: string; points: SensitivityPoint[] } {
  const scales: number[] = [];
  for (let step = 0; step <= 60; step += 1) scales.push(step / 20);
  const points = sensitivity(catalog, input, [cardAId, cardBId], scales);
  const crossings: BreakEvenCrossing[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const before = diff(previous, cardAId, cardBId);
    const after = diff(current, cardAId, cardBId);
    if (before == null || after == null || before === 0 || before * after > 0) continue;
    const ratio = Math.abs(before) / (Math.abs(before) + Math.abs(after));
    const scale = previous.scale + (current.scale - previous.scale) * ratio;
    crossings.push({
      scale: roundCad(scale),
      monthlyTotalCad: roundCad(sumSpend(input.monthly) * scale),
      cardAId,
      cardBId,
      direction: before < 0 && after > 0 ? "a_overtakes_b" : "b_overtakes_a",
    });
  }
  const note = crossings.length
    ? "Holding your category mix and point valuation constant. Crossings use the full reward rules, including tiers and caps."
    : "No crossing was found between 0× and 3× this spending mix. Holding your category mix and point valuation constant.";
  return { crossings, note, points };
}

function diff(point: SensitivityPoint, a: string, b: string): number | null {
  const av = point.values[a];
  const bv = point.values[b];
  if (av == null || bv == null) return null;
  return av - bv;
}
