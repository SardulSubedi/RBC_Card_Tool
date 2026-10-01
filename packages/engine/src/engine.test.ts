import { describe, expect, it } from "vitest";
import { catalog } from "./catalog-data";
import { reviewImport, neutralizeSpreadsheet } from "./csv";
import { demos, profile, sampleGroceryCsv, zeroShares } from "./demos";
import { cents } from "./money";
import { recommend } from "./recommend";
import { projectCard } from "./project";
import { breakEven } from "./sensitivity";
import type { Catalog, CardProduct, Category, RewardRule } from "./types";
import { validateCatalog } from "./validate";

function cashRule(id: string, categories: Category[] | ["*"], rate: number, priority: number, extra: Partial<RewardRule> = {}): RewardRule {
  return {
    id,
    categories,
    slice: "any",
    earnUnit: "cash_back_fraction",
    earnRate: rate,
    fallbackRate: null,
    tierLowerCad: 0,
    tierUpperCad: null,
    capGroupId: null,
    resetPeriod: "none",
    priority,
    conditions: "",
    sourceId: "src",
    ...extra,
  };
}

function fictionCard(id: string, fee: number, rules: RewardRule[], extra: Partial<CardProduct> = {}): CardProduct {
  return {
    id,
    slug: id,
    name: id,
    network: "visa",
    family: "cash_back",
    currency: "CAD",
    productUrl: "https://example.test/card",
    activeStatus: "active",
    image: null,
    rankEligible: true,
    unrankedReason: null,
    rewardsAssumption: null,
    termVersions: [
      {
        id: `${id}-v`,
        effectiveFrom: null,
        effectiveTo: null,
        annualFeeCad: fee,
        additionalCardFeeCad: 0,
        purchaseApr: 0.2,
        aprLow: null,
        aprHigh: null,
        aprLabel: "20%",
        cashAdvanceApr: 0.22,
        rewardProgramId: "cash",
        eligibility: "None",
        incomeRule: null,
        vipRebateCad: null,
        verificationStatus: "verified",
        verifiedAt: "2026-01-01",
        sourceId: "src",
        rules,
        offers: [],
        benefits: [],
      },
    ],
    ...extra,
  };
}

const fiction: Catalog = {
  catalogVersion: "fiction",
  calculationVersion: "test",
  retrievedAt: "2026-01-01",
  defaultComparisonDate: "2026-01-01",
  nearTieCad: 25,
  sources: [{ id: "src", url: "https://example.test", title: "Fictional fixture", retrievedAt: "2026-01-01", applicableEffectiveDate: null, notes: "Not an RBC product." }],
  programs: [
    {
      id: "cash",
      name: "Fictional cash",
      currency: "CAD",
      restrictions: "Fixture",
      defaultScenarioId: "face",
      scenarios: [{ id: "face", name: "Face", method: "cash", value: null, basis: "face_value", restrictions: "", sourceId: "src", verifiedAt: "2026-01-01" }],
    },
    {
      id: "points",
      name: "Fictional points",
      currency: "POINTS",
      restrictions: "Store only",
      defaultScenarioId: "store",
      scenarios: [{ id: "store", name: "Store", method: "store", value: { cad: 1.25, points: 100 }, basis: "published", restrictions: "Not cash", sourceId: "src", verifiedAt: "2026-01-01" }],
    },
  ],
  cards: [],
};

describe("production catalog", () => {
  it("validates sourced cards", () => {
    expect(validateCatalog(catalog)).toEqual([]);
    expect(catalog.cards.length).toBeGreaterThanOrEqual(8);
  });

  it("uses October 2026 cash-back rates with no annual cap", () => {
    const input = profile({ groceries: 100, warehouse: 100, gas: 100 });
    const card = catalog.cards.find((item) => item.id === "rbc-cash-back-mastercard")!;
    const result = projectCard(catalog, card, input.monthly, input.shares, input.preferences);
    expect(cents(result.rewardValueCad ?? 0)).toBe(cents(42));
    expect(result.ongoingNetCad).toBe(42);

    const heavy = profile({ groceries: 10000 });
    const heavyResult = projectCard(catalog, card, heavy.monthly, heavy.shares, heavy.preferences);
    expect(cents(heavyResult.rewardValueCad ?? 0)).toBe(cents(2400));
  });

  it("pays Preferred 3% only on named categories and subtracts the $120 fee", () => {
    const card = catalog.cards.find((item) => item.id === "rbc-cash-back-preferred")!;
    const result = projectCard(
      catalog,
      card,
      profile({ groceries: 100, dining: 100, gas: 100, streaming: 100, other: 100 }).monthly,
      zeroShares,
      profile({}, { personalIncome: 90000 }).preferences,
    );
    expect(cents(result.rewardValueCad ?? 0)).toBe(cents(156));
    expect(result.applicableFeeCad).toBe(120);
    expect(result.ongoingNetCad).toBe(36);
    const warehouse = projectCard(catalog, card, profile({ warehouse: 100 }).monthly, zeroShares, profile({}).preferences);
    expect(cents(warehouse.rewardValueCad ?? 0)).toBe(cents(12));
  });

  it("splits the year when a comparison starts before October 1, 2026", () => {
    const card = catalog.cards.find((item) => item.id === "rbc-cash-back-mastercard")!;
    const result = projectCard(
      catalog,
      card,
      profile({ groceries: 1000 }).monthly,
      zeroShares,
      profile({}, { comparisonDate: "2026-01-01" }).preferences,
    );
    expect(cents(result.rewardValueCad ?? 0)).toBe(cents(210));
    expect(result.termVersionIds).toHaveLength(2);
  });

  it("converts ION points with the published gift-card rate", () => {
    const card = catalog.cards.find((item) => item.id === "rbc-ion-visa")!;
    const result = projectCard(catalog, card, profile({ groceries: 100 }).monthly, zeroShares, profile({}).preferences);
    expect(result.pointsEarned).toBe(1800);
    expect(result.rewardValueCad).toBeCloseTo(1800 * 10 / 1400, 2);
  });

  it("does not rank Avios without a published dollar value", () => {
    const result = recommend(catalog, profile({ dining: 200, travel: 100 }, { rewardFocus: "travel", feeMode: "max_fee", maxAnnualFee: 400, personalIncome: 80000 }, { ...zeroShares, baTravelShare: 1 }));
    expect(result.ranked.some((item) => item.card.id === "rbc-ba-visa-infinite")).toBe(false);
    expect(result.insufficient.some((item) => item.card.id === "rbc-ba-visa-infinite")).toBe(true);
  });

  it("keeps missing income unknown and applies the or-test", () => {
    const low = recommend(catalog, profile({ groceries: 400 }, { personalIncome: 50000, householdIncome: null, feeMode: "max_fee", maxAnnualFee: 400 }));
    const preferred = low.conditional.find((item) => item.card.id === "rbc-cash-back-preferred");
    expect(preferred?.requirementStatus).toBe("not_assessed");
    const meets = recommend(catalog, profile({ groceries: 400 }, { personalIncome: 90000, householdIncome: 10000 }));
    expect(meets.ranked.some((item) => item.card.id === "rbc-cash-back-preferred")).toBe(true);
    const fails = recommend(catalog, profile({ groceries: 400 }, { personalIncome: 10000, householdIncome: 10000 }));
    expect(fails.excluded.some((item) => item.card.id === "rbc-cash-back-preferred")).toBe(true);
  });

  it("counts welcome cash back as extra and keeps it out of the ongoing total", () => {
    const card = catalog.cards.find((item) => item.id === "rbc-cash-back-mastercard")!;
    const prefs = profile({ other: 1000 }, { includeWelcome: true }).preferences;
    const result = projectCard(catalog, card, profile({ other: 1000 }).monthly, zeroShares, prefs);
    expect(cents(result.ongoingNetCad ?? 0)).toBe(cents(60));
    expect(cents(result.firstYearNetCad ?? 0)).toBe(cents(160));
  });

  it("approximates interest and withholds it when the balance is missing", () => {
    const withBalance = recommend(catalog, profile({ groceries: 100 }, { paysInFull: false, averageBalance: 4000, feeMode: "max_fee", maxAnnualFee: 400 }));
    const lowRate = withBalance.ranked.find((item) => item.card.id === "rbc-visa-classic-low-rate");
    expect(lowRate?.projection.interestCad).toBeCloseTo(519.6, 2);
    const missing = recommend(catalog, profile({ groceries: 100 }, { paysInFull: false, averageBalance: null }));
    expect(missing.interestExcludedFromRanking).toBe(true);
    expect(missing.interestOnly.some((item) => item.card.id === "rbc-visa-classic-low-rate")).toBe(true);
    expect(missing.ranked[0]?.explanations.join(" ")).toContain("Interest is not in this dollar ranking");
  });
});

describe("fictional calculation fixtures", () => {
  const noFee = fictionCard("no-fee", 0, [cashRule("base", ["*"], 0.01, 10)]);
  const fee = fictionCard("fee", 120, [cashRule("base", ["*"], 0.02, 10)]);
  const capped = fictionCard("capped", 30, [
    cashRule("hi", ["*"], 0.1, 20, { tierUpperCad: 100, capGroupId: "cap", resetPeriod: "monthly" }),
    cashRule("lo", ["*"], 0, 10),
  ]);

  it("returns the fee only when spending is zero", () => {
    const result = projectCard(fiction, fee, profile({}).monthly, zeroShares, profile({}).preferences);
    expect(result.rewardValueCad).toBe(0);
    expect(result.ongoingNetCad).toBe(-120);
  });

  it("applies a tier below, at, and above the boundary and resets monthly", () => {
    const tiered = fictionCard("tier", 0, [
      cashRule("hi", ["groceries"], 0.03, 20, { tierUpperCad: 500, capGroupId: "g", resetPeriod: "monthly" }),
      cashRule("lo", ["groceries"], 0.01, 10, { tierLowerCad: 500, capGroupId: "g", resetPeriod: "monthly" }),
    ]);
    const below = projectCard(fiction, tiered, profile({ groceries: 400 }).monthly, zeroShares, profile({}).preferences);
    const at = projectCard(fiction, tiered, profile({ groceries: 500 }).monthly, zeroShares, profile({}).preferences);
    const above = projectCard(fiction, tiered, profile({ groceries: 800 }).monthly, zeroShares, profile({}).preferences);
    expect(cents(below.rewardValueCad ?? 0)).toBe(cents(400 * 0.03 * 12));
    expect(cents(at.rewardValueCad ?? 0)).toBe(cents(500 * 0.03 * 12));
    expect(cents(above.rewardValueCad ?? 0)).toBe(cents((500 * 0.03 + 300 * 0.01) * 12));
  });

  it("does not use one annual total for a monthly cap, and shares a cap across categories", () => {
    const monthly = fictionCard("monthly", 0, [
      cashRule("hi", ["groceries"], 0.02, 20, { tierUpperCad: 500, capGroupId: "g", resetPeriod: "monthly" }),
      cashRule("lo", ["groceries"], 0.01, 10, { tierLowerCad: 500, capGroupId: "g", resetPeriod: "monthly" }),
    ]);
    const annual = fictionCard("annual", 0, [
      cashRule("hi", ["groceries"], 0.02, 20, { tierUpperCad: 500, capGroupId: "g", resetPeriod: "annual" }),
      cashRule("lo", ["groceries"], 0.01, 10, { tierLowerCad: 500, capGroupId: "g", resetPeriod: "annual" }),
    ]);
    const spend = profile({ groceries: 1000 }).monthly;
    const prefs = profile({}).preferences;
    expect(cents(projectCard(fiction, monthly, spend, zeroShares, prefs).rewardValueCad ?? 0)).toBe(cents(15 * 12));
    expect(cents(projectCard(fiction, annual, spend, zeroShares, prefs).rewardValueCad ?? 0)).toBe(cents(500 * 0.02 + 11500 * 0.01));

    const shared = fictionCard("shared", 0, [
      cashRule("groc", ["groceries"], 0.05, 30, { tierUpperCad: 200, capGroupId: "shared", resetPeriod: "monthly" }),
      cashRule("gas", ["gas"], 0.05, 20, { tierUpperCad: 200, capGroupId: "shared", resetPeriod: "monthly" }),
      cashRule("fallback", ["*"], 0.01, 10),
    ]);
    const sharedResult = projectCard(fiction, shared, profile({ groceries: 150, gas: 150 }).monthly, zeroShares, prefs);
    expect(cents(sharedResult.rewardValueCad ?? 0)).toBe(cents(11 * 12));
  });

  it("does not double count a category bonus and the fallback", () => {
    const card = fictionCard("fallback", 0, [cashRule("dining", ["dining"], 0.04, 20), cashRule("base", ["*"], 0.01, 10)]);
    const result = projectCard(fiction, card, profile({ dining: 100, other: 50 }).monthly, zeroShares, profile({}).preferences);
    expect(cents(result.rewardValueCad ?? 0)).toBe(cents(4.5 * 12));
  });

  it("converts points and leaves an unavailable redemption unvalued", () => {
    const card = fictionCard("pts", 0, [
      {
        ...cashRule("p", ["*"], 2, 10),
        earnUnit: "points_per_cad",
      },
    ], { termVersions: [{ ...fictionCard("pts", 0, []).termVersions[0], rewardProgramId: "points", rules: [{ ...cashRule("p", ["*"], 2, 10), earnUnit: "points_per_cad" }] }] });
    const result = projectCard(fiction, card, profile({ other: 100 }).monthly, zeroShares, profile({}).preferences);
    expect(result.pointsEarned).toBe(2400);
    expect(result.rewardValueCad).toBeCloseTo(30, 2);
    const custom = projectCard(fiction, card, profile({ other: 100 }).monthly, zeroShares, profile({}, { customCentsPerPoint: 2 }).preferences);
    expect(custom.valuationBasis).toBe("user_assumption");
    expect(custom.rewardValueCad).toBeCloseTo(48, 2);
  });

  it("respects welcome windows, thresholds, expiry, and stacking", () => {
    const card = fictionCard("welcome", 0, [cashRule("base", ["*"], 0.01, 10)]);
    card.termVersions[0].offers = [
      {
        id: "extra",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        modelled: true,
        kind: "extra_cash_fraction",
        extraFraction: 0.1,
        spendCapCad: 100,
        windowMonths: 2,
        approvalPoints: null,
        spendThresholdCad: null,
        bonusPoints: null,
        anniversaryPoints: null,
        stacksWithBase: true,
        headline: "Extra",
        notes: "",
        sourceId: "src",
      },
    ];
    const result = projectCard(fiction, card, profile({ other: 80 }).monthly, zeroShares, profile({}, { includeWelcome: true, comparisonDate: "2026-01-01" }).preferences);
    expect(result.ongoingNetCad).toBeCloseTo(9.6, 2);
    expect(result.firstYearNetCad).toBeCloseTo(19.6, 2);
    const expired = projectCard(fiction, card, profile({ other: 80 }).monthly, zeroShares, profile({}, { includeWelcome: true, comparisonDate: "2027-01-01" }).preferences);
    expect(expired.firstYearNetCad).toBeCloseTo(9.6, 2);
  });

  it("does not clamp a negative category total", () => {
    const card = fictionCard("refund", 0, [cashRule("g", ["groceries"], 0.02, 10)]);
    const result = projectCard(fiction, card, profile({ groceries: -50 }).monthly, zeroShares, profile({}).preferences);
    expect(result.rewardValueCad).toBeCloseTo(-12, 2);
  });

  it("changes rank at a break-even crossing and can find more than one", () => {
    const local: Catalog = { ...fiction, cards: [noFee, fee] };
    const once = breakEven(local, profile({ other: 500 }, { comparisonDate: "2026-01-01" }), "fee", "no-fee");
    expect(once.crossings.length).toBe(1);
    expect(once.crossings[0].scale).toBeCloseTo(2, 1);
    const twiceCatalog: Catalog = { ...fiction, cards: [noFee, capped] };
    const twice = breakEven(twiceCatalog, profile({ other: 400 }, { comparisonDate: "2026-01-01" }), "capped", "no-fee");
    expect(twice.crossings.length).toBe(2);
  });

  it("ranks a near tie without inventing a match score", () => {
    const a = fictionCard("alpha", 0, [cashRule("a", ["*"], 0.01, 10)]);
    const b = fictionCard("beta", 0, [cashRule("b", ["*"], 0.0101, 10)]);
    const result = recommend({ ...fiction, cards: [a, b] }, profile({ other: 100 }, { comparisonDate: "2026-01-01" }));
    expect(result.nearTie).toBe(true);
    expect(result.ranked[0].explanations.join(" ")).toContain("near-tie");
    expect(JSON.stringify(result)).not.toContain("% match");
  });
});

describe("csv review", () => {
  it("matches the grocery demo after reconciliation, including a zero-free full year", () => {
    const csv = sampleGroceryCsv();
    const [header, ...lines] = csv.trim().split("\n");
    const keys = header.split(",");
    const records = lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [keys[index], value])));
    const summary = reviewImport({
      records,
      columns: { date: "Date", description: "Description", amount: "Amount", id: "TransactionId", currency: "Currency", status: "Status" },
      sign: "purchases_positive",
      dateOrder: "ymd",
      periodStart: "2025-10-01",
      periodEnd: "2026-09-30",
    });
    const demo = demos[1];
    for (const category of Object.keys(demo.profile.monthly) as Category[]) {
      expect(summary.monthly[category]).toBeCloseTo(demo.profile.monthly[category], 2);
    }
    expect(summary.months).toBe(12);
    expect(summary.zeroMonths).toBe(0);
    expect(summary.counts.excluded).toBeGreaterThan(0);
    expect(summary.rows.some((row) => row.reason.includes("Duplicate transaction ID"))).toBe(true);
    expect(summary.rows.some((row) => row.issues.some((issue) => issue.includes("Same date")))).toBe(true);
    expect(summary.rows.some((row) => row.category === "unknown" && !row.included)).toBe(true);
  });

  it("divides by every calendar month, including months with no transactions", () => {
    const summary = reviewImport({
      records: [
        { Date: "2026-01-10", Description: "LOBLAWS", Amount: "300" },
        { Date: "2026-03-10", Description: "LOBLAWS", Amount: "300" },
      ],
      columns: { date: "Date", description: "Description", amount: "Amount" },
      sign: "purchases_positive",
      dateOrder: "ymd",
      periodStart: "2026-01-01",
      periodEnd: "2026-03-31",
    });
    expect(summary.months).toBe(3);
    expect(summary.zeroMonths).toBe(1);
    expect(summary.monthly.groceries).toBeCloseTo(200, 2);
    expect(summary.needsCoverageConfirmation).toBe(true);
  });

  it("keeps refunds as adjustments and neutralizes spreadsheet formulas", () => {
    const summary = reviewImport({
      records: [
        { Date: "2026-01-05", Description: "LOBLAWS", Amount: "100" },
        { Date: "2026-01-06", Description: "LOBLAWS", Amount: "-30" },
        { Date: "2026-01-07", Description: "=HYPERLINK(\"http://example.test\")", Amount: "5" },
      ],
      columns: { date: "Date", description: "Description", amount: "Amount" },
      sign: "purchases_positive",
      dateOrder: "ymd",
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
    });
    expect(summary.monthly.groceries).toBeCloseTo(70, 2);
    expect(summary.dollars.refunds).toBe(-30);
    expect(neutralizeSpreadsheet('=HYPERLINK("http://example.test")')).toBe(`'=HYPERLINK("http://example.test")`);
    expect(summary.dollars.eligibleNet).toBeCloseTo(summary.dollars.purchases + summary.dollars.refunds, 2);
  });
});
