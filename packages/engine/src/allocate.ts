import type { Category, RewardRule, Slice } from "./types";

export interface SpendBucket {
  category: Category;
  slice: Slice;
  amount: number;
}

export interface AllocationLine {
  category: Category;
  slice: Slice;
  spendCad: number;
  points: number;
  cashCad: number;
  ruleId: string;
  rate: number;
  unit: RewardRule["earnUnit"];
}

export interface AllocationResult {
  lines: AllocationLine[];
  unallocatedCad: number;
}

function matches(rule: RewardRule, bucket: SpendBucket): boolean {
  const categories = rule.categories as readonly string[];
  const categoryOk = categories.includes("*") || categories.includes(bucket.category);
  if (!categoryOk) return false;
  return rule.slice === "any" || rule.slice === bucket.slice;
}

function counterKey(rule: RewardRule, versionId: string, monthIndex: number): string | null {
  if (!rule.capGroupId) return null;
  const period = rule.resetPeriod === "monthly" ? `m${monthIndex}` : "annual";
  return `${versionId}:${rule.capGroupId}:${period}`;
}

function takePositive(
  rule: RewardRule,
  amount: number,
  counters: Map<string, number>,
  versionId: string,
  monthIndex: number,
): number {
  const lower = rule.tierLowerCad;
  const upper = rule.tierUpperCad ?? Number.POSITIVE_INFINITY;
  if (!rule.capGroupId && lower === 0 && upper === Number.POSITIVE_INFINITY) return amount;
  const key = counterKey(rule, versionId, monthIndex);
  const used = key ? (counters.get(key) ?? 0) : 0;
  if (used < lower || used >= upper) return 0;
  return Math.min(amount, upper - used);
}

function consume(
  rule: RewardRule,
  amount: number,
  counters: Map<string, number>,
  versionId: string,
  monthIndex: number,
) {
  const key = counterKey(rule, versionId, monthIndex);
  if (!key || amount === 0) return;
  counters.set(key, (counters.get(key) ?? 0) + amount);
}

function earn(rule: RewardRule, amount: number): { points: number; cashCad: number } {
  if (rule.earnUnit === "cash_back_fraction") return { points: 0, cashCad: amount * rule.earnRate };
  return { points: amount * rule.earnRate, cashCad: 0 };
}

export function allocateMonth(
  buckets: SpendBucket[],
  rules: RewardRule[],
  counters: Map<string, number>,
  versionId: string,
  monthIndex: number,
): AllocationResult {
  const remaining = buckets.map((bucket) => ({ ...bucket }));
  const lines: AllocationLine[] = [];
  const sorted = [...rules].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  const push = (bucket: SpendBucket, rule: RewardRule, amount: number) => {
    const earned = earn(rule, amount);
    lines.push({
      category: bucket.category,
      slice: bucket.slice,
      spendCad: amount,
      points: earned.points,
      cashCad: earned.cashCad,
      ruleId: rule.id,
      rate: rule.earnRate,
      unit: rule.earnUnit,
    });
  };

  for (const bucket of remaining) {
    if (bucket.amount >= 0) continue;
    const headline = sorted.find((rule) => matches(rule, bucket) && rule.tierLowerCad <= 0);
    const rule = headline ?? sorted.find((rule) => matches(rule, bucket));
    if (!rule) continue;
    push(bucket, rule, bucket.amount);
    bucket.amount = 0;
  }

  for (const rule of sorted) {
    for (const bucket of remaining) {
      if (bucket.amount <= 0 || !matches(rule, bucket)) continue;
      const take = takePositive(rule, bucket.amount, counters, versionId, monthIndex);
      if (take <= 0) continue;
      push(bucket, rule, take);
      bucket.amount -= take;
      consume(rule, take, counters, versionId, monthIndex);
    }
  }

  const unallocatedCad = remaining.reduce((total, bucket) => total + Math.max(0, bucket.amount), 0);
  return { lines, unallocatedCad };
}
