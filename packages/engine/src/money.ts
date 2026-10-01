import { CATEGORIES, type Category, type MonthlySpend } from "./types";

export function roundCad(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function cents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100);
}

export function emptySpend(): MonthlySpend {
  return Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as MonthlySpend;
}

export function annualize(monthly: MonthlySpend): MonthlySpend {
  const annual = emptySpend();
  for (const category of CATEGORIES) annual[category] = monthly[category] * 12;
  return annual;
}

export function sumSpend(spend: MonthlySpend): number {
  return CATEGORIES.reduce((total, category) => total + spend[category], 0);
}

export function scaleSpend(monthly: MonthlySpend, scale: number): MonthlySpend {
  const next = emptySpend();
  for (const category of CATEGORIES) next[category] = monthly[category] * scale;
  return next;
}

export function cad(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(roundCad(value));
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function addMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

export function monthCountInclusive(start: string, end: string): number {
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
}
