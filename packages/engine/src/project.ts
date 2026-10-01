import { allocateMonth, type SpendBucket } from "./allocate";
import { addMonths, roundCad } from "./money";
import type {
  CardProduct,
  CardProjection,
  Catalog,
  Category,
  CategoryContribution,
  MonthlySpend,
  Preferences,
  RewardProgram,
  SpendShares,
  TermVersion,
  ValuationScenario,
} from "./types";
import { CATEGORIES } from "./types";

export function versionOn(card: CardProduct, isoDate: string): TermVersion | null {
  const matches = card.termVersions.filter((version) => {
    const afterStart = version.effectiveFrom == null || version.effectiveFrom <= isoDate;
    const beforeEnd = version.effectiveTo == null || isoDate <= version.effectiveTo;
    return afterStart && beforeEnd;
  });
  if (matches.length !== 1) return null;
  return matches[0];
}

export function programOf(catalog: Catalog, id: string): RewardProgram | undefined {
  return catalog.programs.find((program) => program.id === id);
}

function scenarioValueCad(points: number, scenario: ValuationScenario): number | null {
  if (!scenario.value || scenario.value.points === 0) return null;
  return (points * scenario.value.cad) / scenario.value.points;
}

export function selectScenario(
  program: RewardProgram,
  preferences: Preferences,
): { scenario: ValuationScenario | null; note: string | null; userAssumption: boolean } {
  if (preferences.customCentsPerPoint != null && preferences.customCentsPerPoint >= 0) {
    const hasPublished = program.scenarios.some((scenario) => scenario.value);
    if (hasPublished || preferences.applyCustomToUnvalued) {
      return {
        scenario: {
          id: "user-cpp",
          name: "Your cents-per-point figure",
          method: "user_assumption",
          value: { cad: preferences.customCentsPerPoint / 100, points: 1 },
          basis: "unknown",
          restrictions: "Entered by the user. This is not a published RBC conversion.",
          sourceId: "user",
          verifiedAt: preferences.comparisonDate,
        },
        note: "Point value uses the cents-per-point figure you entered.",
        userAssumption: true,
      };
    }
  }
  const fallback = program.scenarios.find((scenario) => scenario.id === program.defaultScenarioId) ?? null;
  return { scenario: fallback, note: null, userAssumption: false };
}

function bucketsFor(monthly: MonthlySpend, shares: SpendShares): SpendBucket[] {
  const groceries = monthly.groceries;
  const travel = monthly.travel;
  const moi = groceries * shares.moiGroceryShare;
  const more = groceries * shares.moreGroceryShare;
  const westjet = travel * shares.westjetTravelShare;
  const ba = travel * shares.baTravelShare;
  const buckets: SpendBucket[] = [
    { category: "groceries", slice: "moi_banner", amount: moi },
    { category: "groceries", slice: "more_partner", amount: more },
    { category: "groceries", slice: "grocery_regular", amount: groceries - moi - more },
    { category: "travel", slice: "westjet", amount: westjet },
    { category: "travel", slice: "ba", amount: ba },
    { category: "travel", slice: "travel_other", amount: travel - westjet - ba },
  ];
  for (const category of CATEGORIES) {
    if (category === "groceries" || category === "travel") continue;
    buckets.push({ category, slice: "standard", amount: monthly[category] });
  }
  return buckets;
}

function positiveSpend(monthly: MonthlySpend): number {
  return CATEGORIES.reduce((total, category) => total + Math.max(0, monthly[category]), 0);
}

function netSpend(monthly: MonthlySpend): number {
  return CATEGORIES.reduce((total, category) => total + monthly[category], 0);
}

export function projectCard(
  catalog: Catalog,
  card: CardProduct,
  monthly: MonthlySpend,
  shares: SpendShares,
  preferences: Preferences,
): CardProjection {
  const counters = new Map<string, number>();
  const lines: ReturnType<typeof allocateMonth>["lines"] = [];
  let unallocatedCad = 0;
  const versionIds = new Set<string>();
  const assumptions = [
    "Each month uses the same category amounts. Cap periods are applied month by month, not to one annual lump sum.",
  ];

  for (let month = 0; month < 12; month += 1) {
    const date = addMonths(preferences.comparisonDate, month);
    const version = versionOn(card, date);
    if (!version) {
      unallocatedCad += Math.max(0, netSpend(monthly));
      continue;
    }
    versionIds.add(version.id);
    const allocation = allocateMonth(bucketsFor(monthly, shares), version.rules, counters, version.id, month);
    lines.push(...allocation.lines);
    unallocatedCad += allocation.unallocatedCad;
  }

  const applicationVersion = versionOn(card, preferences.comparisonDate);
  const program = applicationVersion ? programOf(catalog, applicationVersion.rewardProgramId) : undefined;
  const selection = program
    ? selectScenario(program, preferences)
    : { scenario: null, note: null, userAssumption: false };
  if (selection.note) assumptions.push(selection.note);

  const pointsEarned = lines.reduce((total, line) => total + line.points, 0);
  const cashCad = lines.reduce((total, line) => total + line.cashCad, 0);
  let rewardValueCad: number | null = cashCad;
  if (Math.abs(pointsEarned) > 1e-9) {
    const pointCad = selection.scenario ? scenarioValueCad(pointsEarned, selection.scenario) : null;
    rewardValueCad = pointCad == null ? null : cashCad + pointCad;
  }

  const welcome = applicationVersion
    ? welcomeValue(applicationVersion, monthly, preferences)
    : { cad: 0, points: 0, notes: ["No term version is effective on the comparison date."], anniversaryPoints: 0 };
  const welcomePointsValue = preferences.includeWelcome ? welcomePointCad(welcome.points, selection.scenario) : 0;

  const annualFee = applicationVersion?.annualFeeCad ?? 0;
  const rebate =
    preferences.vipBanking && applicationVersion?.vipRebateCad
      ? Math.min(annualFee, applicationVersion.vipRebateCad)
      : 0;
  const applicableFee = Math.max(0, annualFee - rebate);

  let interestCad: number | null = null;
  let interestLow: number | null = null;
  let interestHigh: number | null = null;
  let interestNote = "Not included. The profile pays the balance in full.";
  if (!preferences.paysInFull && preferences.averageBalance == null) {
    interestNote =
      "Interest is excluded. A balance is being carried, but no average balance was entered, so this is not an after-interest result.";
  } else if (!preferences.paysInFull && preferences.averageBalance != null && applicationVersion) {
    const balance = preferences.averageBalance;
    if (applicationVersion.purchaseApr != null) {
      interestCad = balance * applicationVersion.purchaseApr;
      interestNote =
        "Approximate annual interest on a constant average purchase balance. This does not model daily balances, grace periods, payment allocation, compounding, or account-specific pricing.";
    } else if (applicationVersion.aprLow != null && applicationVersion.aprHigh != null) {
      interestLow = balance * applicationVersion.aprLow;
      interestHigh = balance * applicationVersion.aprHigh;
      interestNote =
        "RBC publishes a range for this rate. Interest is shown at both ends. The quoted rate is set at application and is not estimated from a credit score.";
    }
  }

  const value = rewardValueCad;
  const ongoingNet = value == null || interestLow != null ? null : value - applicableFee - (interestCad ?? 0);
  const ongoingLow = value == null || interestLow == null || interestHigh == null ? null : value - applicableFee - interestHigh;
  const ongoingHigh = value == null || interestLow == null || interestHigh == null ? null : value - applicableFee - interestLow;
  const firstYearNet = ongoingNet == null ? null : ongoingNet + (preferences.includeWelcome ? welcome.cad + welcomePointsValue : 0);

  const categories = contributions(lines, selection.scenario);

  return {
    cardId: card.id,
    termVersionIds: [...versionIds],
    grossRewardCad: roundCad(value ?? cashCad),
    pointsEarned: roundCad(pointsEarned),
    rewardValueCad: value == null ? null : roundCad(value),
    valuationLabel: selection.scenario?.name ?? "No published dollar value",
    valuationBasis: selection.userAssumption ? "user_assumption" : (selection.scenario?.basis ?? "unknown"),
    annualFeeCad: annualFee,
    feeRebateCad: roundCad(rebate),
    applicableFeeCad: roundCad(applicableFee),
    interestCad: interestCad == null ? null : roundCad(interestCad),
    interestLowCad: interestLow == null ? null : roundCad(interestLow),
    interestHighCad: interestHigh == null ? null : roundCad(interestHigh),
    interestNote,
    ongoingNetCad: ongoingNet == null ? null : roundCad(ongoingNet),
    ongoingNetLowCad: ongoingLow == null ? null : roundCad(ongoingLow),
    ongoingNetHighCad: ongoingHigh == null ? null : roundCad(ongoingHigh),
    welcomeCad: preferences.includeWelcome ? roundCad(welcome.cad + welcomePointsValue) : 0,
    welcomePoints: preferences.includeWelcome ? roundCad(welcome.points) : 0,
    welcomeNotes: welcome.notes,
    anniversaryPointsExcluded: welcome.anniversaryPoints,
    firstYearNetCad: preferences.includeWelcome ? (firstYearNet == null ? null : roundCad(firstYearNet)) : ongoingNet == null ? null : roundCad(ongoingNet),
    categories,
    unallocatedCad: roundCad(unallocatedCad),
    restrictions: program ? [program.restrictions] : [],
    benefits: applicationVersion?.benefits ?? [],
    assumptions,
  };
}

function welcomePointCad(points: number, scenario: ValuationScenario | null): number {
  if (!scenario) return 0;
  return scenarioValueCad(points, scenario) ?? 0;
}

function welcomeValue(
  version: TermVersion,
  monthly: MonthlySpend,
  preferences: Preferences,
): { cad: number; points: number; notes: string[]; anniversaryPoints: number } {
  const notes: string[] = [];
  let cad = 0;
  let points = 0;
  let anniversaryPoints = 0;
  for (const offer of version.offers) {
    const started = offer.validFrom == null || preferences.comparisonDate >= offer.validFrom;
    const notExpired = offer.validTo == null || preferences.comparisonDate <= offer.validTo;
    if (!started || !notExpired) {
      if (preferences.includeWelcome) {
        notes.push(`${offer.headline} This offer is outside its published apply-by window, so it is not included.`);
      }
      continue;
    }
    if (offer.anniversaryPoints) {
      anniversaryPoints += offer.anniversaryPoints;
      if (preferences.includeWelcome) {
        notes.push(
          `${offer.anniversaryPoints.toLocaleString("en-CA")} anniversary points are listed separately and are not in the 12-month total.`,
        );
      }
    }
    if (!offer.modelled || !preferences.includeWelcome) {
      if (!offer.modelled) notes.push(`${offer.headline} Not included in the total because the offer components could not be modelled reliably.`);
      continue;
    }
    if (offer.kind === "extra_cash_fraction" && offer.extraFraction != null) {
      let capLeft = offer.spendCapCad ?? Number.POSITIVE_INFINITY;
      const months = offer.windowMonths ?? 12;
      let extra = 0;
      for (let month = 0; month < months; month += 1) {
        const purchases = positiveSpend(monthly);
        const refunds = CATEGORIES.reduce((total, category) => total + Math.min(0, monthly[category]), 0);
        const applied = Math.min(purchases, capLeft);
        extra += applied * offer.extraFraction;
        extra += refunds * offer.extraFraction;
        capLeft -= applied;
      }
      cad += extra;
      notes.push(
        `${offer.headline} Counted as extra cash back on top of ordinary rewards, only inside the qualifying window and spend cap.`,
      );
    }
    if (offer.kind === "bonus_points") {
      if (offer.approvalPoints) {
        points += offer.approvalPoints;
        notes.push(
          `${offer.approvalPoints.toLocaleString("en-CA")} approval points assume a new application on the comparison date, not a product transfer.`,
        );
      }
      if (offer.bonusPoints && offer.spendThresholdCad != null && offer.windowMonths != null) {
        const windowSpend = netSpend(monthly) * offer.windowMonths;
        if (windowSpend >= offer.spendThresholdCad) {
          points += offer.bonusPoints;
          notes.push(
            `${offer.bonusPoints.toLocaleString("en-CA")} spend bonus is included. Projected purchases in the first ${offer.windowMonths} months meet the ${offer.spendThresholdCad.toLocaleString("en-CA")} threshold.`,
          );
        } else {
          notes.push(
            `Spend bonus not included. Projected purchases in the qualifying window are short of the published threshold.`,
          );
        }
      }
    }
  }
  return { cad, points, notes, anniversaryPoints };
}

function contributions(
  lines: ReturnType<typeof allocateMonth>["lines"],
  scenario: ValuationScenario | null,
): CategoryContribution[] {
  return CATEGORIES.map((category) => {
    const matched = lines.filter((line) => line.category === category);
    const annualSpendCad = matched.reduce((total, line) => total + line.spendCad, 0);
    const points = matched.reduce((total, line) => total + line.points, 0);
    const cash = matched.reduce((total, line) => total + line.cashCad, 0);
    const pointCad = scenario ? (scenarioValueCad(points, scenario) ?? 0) : 0;
    const rates = [...new Set(matched.map((line) => formatRate(line.rate, line.unit)))];
    return {
      category,
      annualSpendCad: roundCad(annualSpendCad),
      points: roundCad(points),
      rewardCad: roundCad(cash + pointCad),
      rateLabel: rates.length ? rates.join(" / ") : "—",
      note: null,
    };
  }).filter((line) => line.annualSpendCad !== 0 || line.rewardCad !== 0);
}

function formatRate(rate: number, unit: "cash_back_fraction" | "points_per_cad"): string {
  if (unit === "cash_back_fraction") return `${strip(rate * 100)}%`;
  return `${strip(rate)} pts/$`;
}

function strip(value: number): string {
  return value.toLocaleString("en-CA", { maximumFractionDigits: 2 });
}

export function topCategory(categories: CategoryContribution[]): CategoryContribution | null {
  return [...categories].sort((a, b) => b.rewardCad - a.rewardCad)[0] ?? null;
}
