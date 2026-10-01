import { annualize, cad, roundCad, sumSpend } from "./money";
import { projectCard, topCategory } from "./project";
import type {
  CardProduct,
  Catalog,
  Preferences,
  ProfileInput,
  RankedCard,
  RecommendationResult,
  RequirementStatus,
} from "./types";

export const GLOBAL_ASSUMPTIONS = [
  "Results are a 12-month projection under the term version in effect each month. They are not a statement of rewards already earned.",
  "Insurance, lounge access, DashPass, and companion or certificate benefits are not given a dollar value.",
  "Foreign-exchange markup and additional-card fees are not included.",
  "Merchant descriptions and survey categories are not the same as a network merchant category code.",
  "Recurring bills are treated as eligible purchases. Cash-like payments and some bill payments do not earn rewards.",
  "Per-transaction rounding by the issuer is not modelled.",
];

export const GLOBAL_EXCLUSIONS = [
  "Payments, transfers, interest, fees, and cash advances are not reward-bearing spending.",
  "Business, discontinued, and U.S.-dollar cards are outside this comparison.",
  "Credit score is not used. This tool does not predict approval.",
];

export function requirementStatus(card: CardProduct, preferences: Preferences): {
  status: RequirementStatus;
  detail: string;
} {
  const version = card.termVersions.find((item) => covers(item.effectiveFrom, item.effectiveTo, preferences.comparisonDate));
  const rule = version?.incomeRule;
  if (!rule) return { status: "meets", detail: "No personal or household income minimum is published for this card." };
  const personal = preferences.personalIncome;
  const household = preferences.householdIncome;
  if (personal == null && household == null) {
    return {
      status: "not_assessed",
      detail: `${rule.label} Income was not provided, so it is not treated as zero.`,
    };
  }
  const personalMeets = rule.personalMin != null && personal != null && personal >= rule.personalMin;
  const householdMeets = rule.householdMin != null && household != null && household >= rule.householdMin;
  if (personalMeets || householdMeets) {
    return { status: "meets", detail: `Meets the published test: ${rule.label}` };
  }
  const personalMissing = rule.personalMin != null && personal == null;
  const householdMissing = rule.householdMin != null && household == null;
  if (personalMissing || householdMissing) {
    return {
      status: "not_assessed",
      detail: `${rule.label} Only one income figure was provided, and it is below that part of the test. The other figure could still qualify.`,
    };
  }
  return { status: "does_not_meet", detail: `Does not meet the published test: ${rule.label}` };
}

function covers(from: string | null, to: string | null, date: string): boolean {
  return (from == null || from <= date) && (to == null || date <= to);
}

function focusAllows(card: CardProduct, preferences: Preferences): boolean {
  if (preferences.rewardFocus === "either") return true;
  if (preferences.rewardFocus === "cash") return card.family === "cash_back" || card.family === "low_interest";
  if (preferences.rewardFocus === "everyday") return card.family === "everyday" || card.family === "low_interest";
  return card.family === "travel" || card.family === "low_interest";
}

function feeAllows(applicableFee: number, preferences: Preferences): boolean {
  if (preferences.feeMode === "no_fee") return applicableFee === 0;
  if (preferences.feeMode === "max_fee") return applicableFee <= (preferences.maxAnnualFee ?? 0);
  return true;
}

function sortValue(card: RankedCard, preferences: Preferences): number | null {
  if (preferences.rankBy === "first_year" && preferences.includeWelcome) return card.projection.firstYearNetCad;
  return card.projection.ongoingNetCad;
}

export function recommend(catalog: Catalog, input: ProfileInput): RecommendationResult {
  const { monthly, shares, preferences } = input;
  const annual = annualize(monthly);
  const evaluated: RankedCard[] = catalog.cards
    .filter((card) => card.activeStatus === "active")
    .map((card) => decorate(catalog, card, input));

  const interestExcluded = !preferences.paysInFull && preferences.averageBalance == null;
  const pool = evaluated.filter((item) => item.list !== "excluded" && item.list !== "insufficient");
  const noFee = pool.filter((item) => item.projection.applicableFeeCad === 0 && item.requirementStatus === "meets");
  const bestNoFee = maxNet(noFee, preferences);

  const ranked: RankedCard[] = [];
  const conditional: RankedCard[] = [];
  const insufficient: RankedCard[] = [];
  const excluded: RankedCard[] = [];
  const interestOnly: RankedCard[] = [];

  for (const item of evaluated) {
    if (item.list === "insufficient") {
      if (!focusAllows(item.card, preferences) || !feeAllows(item.projection.applicableFeeCad, preferences)) {
        item.list = "excluded";
        item.excludeReason = "Outside the fee or reward style you selected.";
        excluded.push(item);
      } else insufficient.push(item);
      continue;
    }
    if (!focusAllows(item.card, preferences)) {
      item.list = "excluded";
      item.excludeReason = "Outside the reward style you selected.";
      excluded.push(item);
      continue;
    }
    if (!feeAllows(item.projection.applicableFeeCad, preferences)) {
      item.list = "excluded";
      item.excludeReason = "Annual fee is above the limit you set.";
      excluded.push(item);
      continue;
    }
    if (
      preferences.feeMode === "only_if_worth_more" &&
      item.projection.applicableFeeCad > 0 &&
      bestNoFee != null &&
      item.projection.ongoingNetCad != null &&
      item.projection.ongoingNetCad <= bestNoFee
    ) {
      item.list = "excluded";
      item.excludeReason = "After the annual fee, this card does not beat the best no-fee card on ongoing value.";
      excluded.push(item);
      continue;
    }
    if (item.card.family === "low_interest" && interestExcluded) {
      item.list = "interest_only";
      item.excludeReason = null;
      interestOnly.push(item);
      continue;
    }
    if (item.requirementStatus === "does_not_meet") {
      item.list = "excluded";
      item.excludeReason = item.requirementDetail;
      excluded.push(item);
      continue;
    }
    if (item.requirementStatus === "not_assessed") {
      item.list = "conditional";
      conditional.push(item);
      continue;
    }
    if (item.projection.ongoingNetCad == null || item.projection.unallocatedCad > 0.5) {
      item.list = "insufficient";
      item.excludeReason = item.projection.unallocatedCad > 0.5 ? "A term version or earn rule is missing for part of the year." : "Dollar value cannot be computed from published terms.";
      insufficient.push(item);
      continue;
    }
    item.list = "ranked";
    ranked.push(item);
  }

  const byNet = (a: RankedCard, b: RankedCard) => {
    const av = sortValue(a, preferences);
    const bv = sortValue(b, preferences);
    if (av == null && bv == null) return a.card.name.localeCompare(b.card.name);
    if (av == null) return 1;
    if (bv == null) return -1;
    if (bv !== av) return bv - av;
    if (a.projection.applicableFeeCad !== b.projection.applicableFeeCad) {
      return a.projection.applicableFeeCad - b.projection.applicableFeeCad;
    }
    return a.card.name.localeCompare(b.card.name);
  };
  ranked.sort(byNet);
  conditional.sort(byNet);
  ranked.forEach((item, index) => {
    item.rank = index + 1;
    const next = ranked[index + 1];
    const current = sortValue(item, preferences);
    const following = next ? sortValue(next, preferences) : null;
    item.gapToNextCad = current != null && following != null ? roundCad(current - following) : null;
    item.explanations = explanations(item, next, preferences, catalog.nearTieCad, interestExcluded);
  });
  conditional.forEach((item) => {
    item.explanations = explanations(item, null, preferences, catalog.nearTieCad, interestExcluded);
  });

  const topGap = ranked[0]?.gapToNextCad;
  const nearTie = topGap != null && topGap < catalog.nearTieCad && ranked.length > 1;
  let emptyReason: string | null = null;
  if (ranked.length === 0) {
    emptyReason =
      preferences.rewardFocus === "travel" && preferences.feeMode === "no_fee"
        ? "No travel card in this catalog has a $0 annual fee. Raise the fee limit to see WestJet and Avion cards."
        : "No card meets the fee, reward style, and published requirement filters.";
  }

  return {
    calculationVersion: catalog.calculationVersion,
    catalogVersion: catalog.catalogVersion,
    comparisonDate: preferences.comparisonDate,
    assumptions: GLOBAL_ASSUMPTIONS,
    exclusions: GLOBAL_EXCLUSIONS,
    monthly,
    annual,
    monthlyTotalCad: roundCad(sumSpend(monthly)),
    annualTotalCad: roundCad(sumSpend(annual)),
    ranked,
    conditional,
    insufficient,
    excluded,
    interestOnly,
    compared: [...ranked, ...conditional].slice(0, 8),
    nearTie,
    nearTieCad: catalog.nearTieCad,
    interestExcludedFromRanking: interestExcluded,
    winnerId: ranked[0]?.card.id ?? null,
    emptyReason,
  };
}

function maxNet(cards: RankedCard[], preferences: Preferences): number | null {
  const values = cards.map((card) => sortValue(card, preferences)).filter((value): value is number => value != null);
  if (!values.length) return null;
  return Math.max(...values);
}

function decorate(catalog: Catalog, card: CardProduct, input: ProfileInput): RankedCard {
  const projection = projectCard(catalog, card, input.monthly, input.shares, input.preferences);
  const requirement = requirementStatus(card, input.preferences);
  const version = card.termVersions.find((item) =>
    covers(item.effectiveFrom, item.effectiveTo, input.preferences.comparisonDate),
  );
  let list: RankedCard["list"] = "ranked";
  let excludeReason: string | null = null;
  const valuedByUser =
    input.preferences.applyCustomToUnvalued &&
    input.preferences.customCentsPerPoint != null &&
    projection.rewardValueCad != null;
  if ((!card.rankEligible && !valuedByUser) || version?.verificationStatus === "insufficient" || projection.rewardValueCad == null) {
    list = "insufficient";
    excludeReason = card.unrankedReason ?? "Insufficient verified data to rank.";
  }
  if (input.preferences.studentOrNewcomer && version?.incomeRule) {
    requirement.detail += " Student or newcomer status does not replace the published income test.";
  }
  return {
    projection,
    card,
    requirementStatus: requirement.status,
    requirementDetail: requirement.detail,
    list,
    excludeReason,
    explanations: [],
    rank: null,
    gapToNextCad: null,
  };
}

function explanations(
  item: RankedCard,
  next: RankedCard | null | undefined,
  preferences: Preferences,
  nearTieCad: number,
  interestExcluded: boolean,
): string[] {
  const lines: string[] = [];
  const top = topCategory(item.projection.categories);
  if (top && top.rewardCad > 0) {
    lines.push(`${label(top.category)} contributes ${cad(top.rewardCad)} of the estimated annual reward value.`);
  } else if (item.projection.rewardValueCad === 0) {
    lines.push("This profile earns no modelled rewards on this card.");
  }
  if (item.projection.applicableFeeCad === 0) lines.push("There is no annual fee in this comparison.");
  else lines.push(`The annual fee used here is ${cad(item.projection.applicableFeeCad)}.`);
  if (item.projection.interestCad != null && item.projection.interestCad > 0) {
    lines.push(`Approximate interest of ${cad(item.projection.interestCad)} is subtracted. ${item.projection.interestNote}`);
  } else if (interestExcluded && !preferences.paysInFull) {
    lines.push("Interest is not in this dollar ranking because no balance estimate was entered.");
  }
  if (next && item.gapToNextCad != null) {
    if (item.gapToNextCad < nearTieCad) {
      lines.push(
        `The gap versus ${next.card.name} is ${cad(item.gapToNextCad)}, inside the ${cad(nearTieCad)} near-tie range. A change in mix or point value could reorder them.`,
      );
    } else {
      lines.push(`After the fee, this card is about ${cad(item.gapToNextCad)} ahead of ${next.card.name}.`);
    }
  }
  if (preferences.includeWelcome && item.projection.welcomeCad > 0) {
    lines.push(
      `Welcome value of ${cad(item.projection.welcomeCad)} is shown in the first-year figure and is not part of the ongoing ranking unless you turn that sort on.`,
    );
  }
  return lines.slice(0, 3);
}

function label(category: string): string {
  const names: Record<string, string> = {
    groceries: "Groceries",
    warehouse: "Warehouse and superstore spending",
    dining: "Dining and takeout",
    gas: "Gas",
    ev_charging: "EV charging",
    transit: "Transit",
    rideshare: "Rideshare",
    streaming: "Streaming",
    gaming: "Digital gaming",
    bills: "Other recurring bills",
    travel: "Travel",
    other: "Other purchases",
  };
  return names[category] ?? category;
}
