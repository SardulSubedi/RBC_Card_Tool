import { CATEGORIES, type Catalog, type Category, type ProfileInput } from "./types";
import { isIsoDate } from "./money";

export function validateCatalog(catalog: Catalog): string[] {
  const errors: string[] = [];
  const slugs = new Set<string>();
  const sourceIds = new Set(catalog.sources.map((source) => source.id));
  const programIds = new Set(catalog.programs.map((program) => program.id));
  for (const source of catalog.sources) {
    if (!source.url.startsWith("https://")) errors.push(`Source ${source.id} needs an https URL.`);
    if (!isIsoDate(source.retrievedAt)) errors.push(`Source ${source.id} has no retrieval date.`);
  }
  for (const card of catalog.cards) {
    if (slugs.has(card.slug)) errors.push(`Duplicate slug ${card.slug}.`);
    slugs.add(card.slug);
    if (!card.termVersions.length) errors.push(`${card.slug} has no term version.`);
    const intervals = card.termVersions.map((version) => ({
      from: version.effectiveFrom ?? "0000-01-01",
      to: version.effectiveTo ?? "9999-12-31",
      id: version.id,
    }));
    intervals.sort((a, b) => a.from.localeCompare(b.from));
    for (let index = 1; index < intervals.length; index += 1) {
      if (intervals[index].from <= intervals[index - 1].to) {
        errors.push(`${card.slug} has overlapping terms ${intervals[index - 1].id} and ${intervals[index].id}.`);
      }
    }
    for (const version of card.termVersions) {
      if (!sourceIds.has(version.sourceId)) errors.push(`${version.id} is missing source ${version.sourceId}.`);
      if (!programIds.has(version.rewardProgramId)) errors.push(`${version.id} has an unknown reward program.`);
      if (version.purchaseApr != null && (version.purchaseApr < 0 || version.purchaseApr > 1)) {
        errors.push(`${version.id} purchase APR must be a fraction, not a percent.`);
      }
      if (card.rankEligible && !version.rules.length) errors.push(`${version.id} is rankable but has no rules.`);
      const covered = new Set<Category>();
      for (const rule of version.rules) {
        if (!sourceIds.has(rule.sourceId)) errors.push(`Rule ${rule.id} is missing source ${rule.sourceId}.`);
        if (rule.earnUnit === "cash_back_fraction" && (rule.earnRate < 0 || rule.earnRate > 1)) {
          errors.push(`Rule ${rule.id} has an invalid cash-back fraction.`);
        }
        if (rule.earnUnit === "points_per_cad" && (rule.earnRate < 0 || rule.earnRate > 50)) {
          errors.push(`Rule ${rule.id} has an implausible points rate.`);
        }
        if ((rule.tierUpperCad != null || rule.tierLowerCad > 0) && !rule.capGroupId) {
          errors.push(`Rule ${rule.id} uses a tier without a cap group.`);
        }
        if (rule.categories[0] === "*") CATEGORIES.forEach((category) => covered.add(category));
        else {
          for (const category of rule.categories) {
            if (category !== "*") covered.add(category);
          }
        }
      }
      if (card.rankEligible && covered.size !== CATEGORIES.length) {
        errors.push(`${version.id} does not cover every spending category.`);
      }
      const program = catalog.programs.find((item) => item.id === version.rewardProgramId);
      if (card.rankEligible && program && program.defaultScenarioId == null) {
        errors.push(`${card.slug} is rankable without a default point value.`);
      }
    }
  }
  return errors;
}

export function validateProfile(input: ProfileInput): string[] {
  const errors: string[] = [];
  if (!isIsoDate(input.preferences.comparisonDate)) errors.push("Comparison date is not a real calendar date.");
  for (const category of CATEGORIES) {
    const amount = input.monthly[category];
    if (!Number.isFinite(amount) || amount < -100000 || amount > 100000) {
      errors.push(`${category} must be a finite amount between -$100,000 and $100,000 a month.`);
    }
  }
  const shares = [
    input.shares.moiGroceryShare,
    input.shares.moreGroceryShare,
    input.shares.westjetTravelShare,
    input.shares.baTravelShare,
  ];
  if (shares.some((share) => !Number.isFinite(share) || share < 0 || share > 1)) {
    errors.push("Spending shares must be between 0 and 1.");
  }
  if (input.shares.moiGroceryShare + input.shares.moreGroceryShare > 1) errors.push("Grocery partner shares add up to more than the grocery total.");
  if (input.shares.westjetTravelShare + input.shares.baTravelShare > 1) errors.push("Airline shares add up to more than the travel total.");
  const { personalIncome, householdIncome, averageBalance, creditScore, customCentsPerPoint, maxAnnualFee } = input.preferences;
  if (personalIncome != null && (!Number.isFinite(personalIncome) || personalIncome < 0 || personalIncome > 10000000)) {
    errors.push("Personal income is not a usable amount.");
  }
  if (householdIncome != null && (!Number.isFinite(householdIncome) || householdIncome < 0 || householdIncome > 10000000)) {
    errors.push("Household income is not a usable amount.");
  }
  if (averageBalance != null && (!Number.isFinite(averageBalance) || averageBalance < 0 || averageBalance > 1000000)) {
    errors.push("Average balance is not a usable amount.");
  }
  if (creditScore != null && (!Number.isInteger(creditScore) || creditScore < 300 || creditScore > 900)) {
    errors.push("Credit score must be a whole number from 300 to 900, or left blank.");
  }
  if (customCentsPerPoint != null && (!Number.isFinite(customCentsPerPoint) || customCentsPerPoint < 0 || customCentsPerPoint > 20)) {
    errors.push("Cents per point must be between 0 and 20.");
  }
  if (maxAnnualFee != null && (!Number.isFinite(maxAnnualFee) || maxAnnualFee < 0 || maxAnnualFee > 1000)) {
    errors.push("Maximum annual fee is not a usable amount.");
  }
  return errors;
}
