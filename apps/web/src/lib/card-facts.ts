import { cad, catalog, versionOn, type CardProduct, type RewardRule, type Category } from "@cardfit/engine";
import { familyLabels, labels } from "./labels";

export interface CardFacts {
  family: string;
  fee: string;
  feeCad: number;
  earn: string;
  secondary: string | null;
  eligibility: string;
  verified: string;
}

const pointNames: Record<string, string> = {
  AVION_POINTS: "Avion points",
  WESTJET_POINTS: "WestJet points",
  MOI_POINTS: "Moi points",
  MORE_POINTS: "More Rewards points",
  AVIOS: "Avios",
};

const sliceWhere: Record<string, string> = {
  westjet: "on WestJet and Sunwing",
  moi_banner: "at Metro, Food Basics and Super C",
  more_partner: "at Save-On-Foods and More Rewards partners",
  ba: "on British Airways",
};

/** Plain-language facts drawn from the catalog's term version in effect on the comparison date. */
export function cardFacts(card: CardProduct, isoDate = catalog.defaultComparisonDate): CardFacts {
  const version = versionOn(card, isoDate) ?? card.termVersions[card.termVersions.length - 1];
  const program = catalog.programs.find((item) => item.id === version.rewardProgramId);
  const pointName = program ? pointNames[program.currency] ?? "points" : "points";
  const rules = [...version.rules].sort((a, b) => b.earnRate - a.earnRate || b.priority - a.priority);
  const base = rules.find((rule) => (rule.categories as readonly string[])[0] === "*");
  const top = rules[0];

  let earn: string;
  let secondary: string | null = null;
  if (card.family === "low_interest" || !top || top.earnRate === 0) {
    earn = version.aprLabel.replace(" purchase APR", " purchase interest rate");
    secondary = "No purchase rewards are published for this card.";
  } else {
    earn = `${rate(top, pointName)} ${where(top)}`;
    if (base && base !== top) secondary = `${rate(base, pointName)} on everything else`;
  }

  return {
    family: familyLabels[card.family],
    fee: version.annualFeeCad === 0 ? "No annual fee" : `${cad(version.annualFeeCad)} annual fee`,
    feeCad: version.annualFeeCad,
    earn,
    secondary,
    eligibility: version.eligibility,
    verified: version.verifiedAt,
  };
}

function rate(rule: RewardRule, pointName: string): string {
  if (rule.earnUnit === "cash_back_fraction") return `${trim(rule.earnRate * 100)}% cash back`;
  return `${trim(rule.earnRate)} ${pointName} per $1`;
}

function where(rule: RewardRule): string {
  if (rule.slice in sliceWhere) return sliceWhere[rule.slice];
  const categories = rule.categories as readonly string[];
  if (categories[0] === "*") return "on everything";
  const names = categories.slice(0, 3).map((category) => labels[category as Category].toLowerCase());
  const rest = categories.length - names.length;
  if (rest > 0) return `on ${names.join(", ")} and ${rest} more`;
  if (names.length === 1) return `on ${names[0]}`;
  return `on ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function trim(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(value * 10 === Math.round(value * 10) ? 1 : 2).replace(/0$/, "");
}

export function assetUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
