import type { MonthlySpend, Preferences, ProfileInput, SpendShares } from "./types";
import { emptySpend } from "./money";

export const zeroShares: SpendShares = {
  moiGroceryShare: 0,
  moreGroceryShare: 0,
  westjetTravelShare: 0,
  baTravelShare: 0,
};

export function preferences(partial: Partial<Preferences> = {}): Preferences {
  return {
    rewardFocus: "either",
    feeMode: "max_fee",
    maxAnnualFee: 400,
    studentOrNewcomer: false,
    personalIncome: null,
    householdIncome: null,
    paysInFull: true,
    averageBalance: null,
    includeWelcome: false,
    rankBy: "ongoing",
    customCentsPerPoint: null,
    applyCustomToUnvalued: false,
    vipBanking: false,
    creditScore: null,
    currentCardId: null,
    comparisonDate: "2026-10-01",
    ...partial,
  };
}

export function profile(monthly: Partial<MonthlySpend>, partial: Partial<Preferences> = {}, shares: SpendShares = zeroShares): ProfileInput {
  return { monthly: { ...emptySpend(), ...monthly }, shares, preferences: preferences(partial) };
}

export interface Demo {
  id: string;
  label: string;
  blurb: string;
  profile: ProfileInput;
}

export const demos: Demo[] = [
  {
    id: "student",
    label: "Student",
    blurb: "Fictional modest spending, no annual fee, income left blank.",
    profile: profile(
      { groceries: 250, warehouse: 40, dining: 180, transit: 80, rideshare: 40, streaming: 20, gaming: 25, bills: 40, travel: 30, other: 100 },
      { feeMode: "no_fee", maxAnnualFee: 0, studentOrNewcomer: true, rewardFocus: "either" },
    ),
  },
  {
    id: "grocery",
    label: "Grocery household",
    blurb: "Fictional grocery-heavy household. Household income is high enough for published premium tests.",
    profile: profile(
      { groceries: 700, warehouse: 150, dining: 280, gas: 160, ev_charging: 20, transit: 40, rideshare: 35, streaming: 30, gaming: 15, bills: 180, travel: 90, other: 220 },
      { feeMode: "only_if_worth_more", personalIncome: 70000, householdIncome: 160000 },
    ),
  },
  {
    id: "traveller",
    label: "Frequent traveller",
    blurb: "Fictional travel-heavy year. Forty percent of travel is WestJet or Sunwing.",
    profile: profile(
      { groceries: 400, dining: 350, gas: 80, rideshare: 60, streaming: 25, travel: 900, other: 250 },
      { rewardFocus: "travel", feeMode: "max_fee", maxAnnualFee: 400, personalIncome: 90000 },
      { ...zeroShares, westjetTravelShare: 0.4 },
    ),
  },
  {
    id: "balance",
    label: "Balance carrier",
    blurb: "Fictional customer who keeps about $4,000 of purchases on the card.",
    profile: profile(
      { groceries: 350, dining: 150, gas: 120, bills: 160, other: 200 },
      { paysInFull: false, averageBalance: 4000, feeMode: "max_fee", maxAnnualFee: 150, rewardFocus: "either" },
    ),
  },
];

export function sampleGroceryCsv(): string {
  const demo = demos.find((item) => item.id === "grocery");
  if (!demo) throw new Error("Missing grocery demo.");
  const header = "Date,Description,Amount,TransactionId,Currency,Status";
  const rows: string[] = [header];
  const merchants: Record<string, string> = {
    groceries: "LOBLAWS",
    warehouse: "COSTCO WHOLESALE",
    dining: "TIM HORTONS",
    gas: "PETRO-CANADA",
    ev_charging: "FLO EV CHARGING",
    transit: "PRESTO TTC",
    rideshare: "UBER",
    streaming: "NETFLIX.COM",
    gaming: "STEAMGAMES",
    bills: "HYDRO ONE",
    travel: "AIR CANADA",
    other: "AMAZON.CA",
  };
  for (let month = 0; month < 12; month += 1) {
    const date = new Date(Date.UTC(2025, 9, 15));
    date.setUTCMonth(date.getUTCMonth() + month);
    const iso = date.toISOString().slice(0, 10);
    for (const [category, merchant] of Object.entries(merchants)) {
      let amount = demo.profile.monthly[category as keyof MonthlySpend];
      if (!amount) continue;
      if (category === "rideshare") {
        rows.push(`${iso},${merchant},${(amount / 2).toFixed(2)},,CAD,posted`);
        rows.push(`${iso},${merchant},${(amount / 2).toFixed(2)},,CAD,posted`);
        continue;
      }
      if (category === "groceries" && month === 5) amount += 40;
      const id = category === "other" && month === 0 ? "AMZ-1" : `${category}-${month}`;
      rows.push(`${iso},${merchant},${amount.toFixed(2)},${id},CAD,posted`);
      if (category === "groceries" && month === 5) {
        const refundDate = iso.slice(0, 8) + "20";
        rows.push(`${refundDate},LOBLAWS,-40.00,REF-5,CAD,posted`);
      }
    }
  }
  rows.push("2025-11-02,PAYMENT THANK YOU,-800.00,PAY-1,CAD,posted");
  rows.push("2025-12-01,INTEREST CHARGE,12.40,INT-1,CAD,posted");
  rows.push("2026-01-15,ANNUAL FEE,20.00,FEE-1,CAD,posted");
  rows.push("2026-02-01,CASH ADVANCE,40.00,CA-1,CAD,posted");
  rows.push("2025-10-16,AMAZON.CA,10.00,AMZ-1,CAD,posted");
  rows.push("2026-04-04,SQ *CORNER STORE,18.00,UNK-1,CAD,posted");
  return rows.join("\n");
}
