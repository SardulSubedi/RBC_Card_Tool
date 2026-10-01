export const CATEGORIES = [
  "groceries",
  "warehouse",
  "dining",
  "gas",
  "ev_charging",
  "transit",
  "rideshare",
  "streaming",
  "gaming",
  "bills",
  "travel",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Slice =
  | "any"
  | "standard"
  | "grocery_regular"
  | "moi_banner"
  | "more_partner"
  | "westjet"
  | "ba"
  | "travel_other";

export type EarnUnit = "cash_back_fraction" | "points_per_cad";
export type ResetPeriod = "monthly" | "annual" | "none";
export type RewardFocus = "cash" | "everyday" | "travel" | "either";
export type FeeMode = "no_fee" | "max_fee" | "only_if_worth_more";
export type RequirementStatus = "meets" | "does_not_meet" | "not_assessed";

export interface Source {
  id: string;
  url: string;
  title: string;
  retrievedAt: string;
  applicableEffectiveDate: string | null;
  notes: string;
}

export interface PointValue {
  cad: number;
  points: number;
}

export interface ValuationScenario {
  id: string;
  name: string;
  method: string;
  /** Dollars credited per `points` points. Null when this program has no published dollar rate. */
  value: PointValue | null;
  basis: "published" | "illustrated" | "face_value" | "unknown";
  restrictions: string;
  sourceId: string;
  verifiedAt: string;
}

export interface RewardProgram {
  id: string;
  name: string;
  currency: string;
  restrictions: string;
  defaultScenarioId: string | null;
  scenarios: ValuationScenario[];
}

export interface RewardRule {
  id: string;
  categories: Category[] | ["*"];
  slice: Slice;
  earnUnit: EarnUnit;
  earnRate: number;
  fallbackRate: number | null;
  tierLowerCad: number;
  tierUpperCad: number | null;
  capGroupId: string | null;
  resetPeriod: ResetPeriod;
  priority: number;
  conditions: string;
  sourceId: string;
}

export interface WelcomeOffer {
  id: string;
  validFrom: string | null;
  validTo: string | null;
  modelled: boolean;
  kind: "extra_cash_fraction" | "bonus_points" | "unmodelled";
  extraFraction: number | null;
  spendCapCad: number | null;
  windowMonths: number | null;
  approvalPoints: number | null;
  spendThresholdCad: number | null;
  bonusPoints: number | null;
  anniversaryPoints: number | null;
  stacksWithBase: boolean;
  headline: string;
  notes: string;
  sourceId: string;
}

export interface IncomeRule {
  personalMin: number | null;
  householdMin: number | null;
  logic: "or";
  label: string;
}

export interface TermVersion {
  id: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  annualFeeCad: number;
  additionalCardFeeCad: number | null;
  purchaseApr: number | null;
  aprLow: number | null;
  aprHigh: number | null;
  aprLabel: string;
  cashAdvanceApr: number | null;
  rewardProgramId: string;
  eligibility: string;
  incomeRule: IncomeRule | null;
  vipRebateCad: number | null;
  verificationStatus: "verified" | "partial" | "insufficient";
  verifiedAt: string;
  sourceId: string;
  rules: RewardRule[];
  offers: WelcomeOffer[];
  benefits: string[];
}

export interface CardProduct {
  id: string;
  slug: string;
  name: string;
  network: "visa" | "mastercard";
  family: "cash_back" | "everyday" | "travel" | "low_interest";
  currency: "CAD";
  productUrl: string;
  activeStatus: "active";
  image: string | null;
  rankEligible: boolean;
  unrankedReason: string | null;
  rewardsAssumption: string | null;
  termVersions: TermVersion[];
}

export interface Catalog {
  catalogVersion: string;
  calculationVersion: string;
  retrievedAt: string;
  defaultComparisonDate: string;
  nearTieCad: number;
  sources: Source[];
  programs: RewardProgram[];
  cards: CardProduct[];
}

export type MonthlySpend = Record<Category, number>;

export interface SpendShares {
  moiGroceryShare: number;
  moreGroceryShare: number;
  westjetTravelShare: number;
  baTravelShare: number;
}

export interface Preferences {
  rewardFocus: RewardFocus;
  feeMode: FeeMode;
  maxAnnualFee: number | null;
  studentOrNewcomer: boolean;
  personalIncome: number | null;
  householdIncome: number | null;
  paysInFull: boolean;
  averageBalance: number | null;
  includeWelcome: boolean;
  rankBy: "ongoing" | "first_year";
  customCentsPerPoint: number | null;
  applyCustomToUnvalued: boolean;
  vipBanking: boolean;
  creditScore: number | null;
  currentCardId: string | null;
  comparisonDate: string;
}

export interface ProfileInput {
  monthly: MonthlySpend;
  shares: SpendShares;
  preferences: Preferences;
}

export interface CategoryContribution {
  category: Category;
  annualSpendCad: number;
  points: number;
  rewardCad: number;
  rateLabel: string;
  note: string | null;
}

export interface CardProjection {
  cardId: string;
  termVersionIds: string[];
  grossRewardCad: number;
  pointsEarned: number;
  rewardValueCad: number | null;
  valuationLabel: string;
  valuationBasis: string;
  annualFeeCad: number;
  feeRebateCad: number;
  applicableFeeCad: number;
  interestCad: number | null;
  interestLowCad: number | null;
  interestHighCad: number | null;
  interestNote: string;
  ongoingNetCad: number | null;
  ongoingNetLowCad: number | null;
  ongoingNetHighCad: number | null;
  welcomeCad: number;
  welcomePoints: number;
  welcomeNotes: string[];
  anniversaryPointsExcluded: number;
  firstYearNetCad: number | null;
  categories: CategoryContribution[];
  unallocatedCad: number;
  restrictions: string[];
  benefits: string[];
  assumptions: string[];
}

export interface RankedCard {
  projection: CardProjection;
  card: CardProduct;
  requirementStatus: RequirementStatus;
  requirementDetail: string;
  list: "ranked" | "conditional" | "insufficient" | "excluded" | "interest_only";
  excludeReason: string | null;
  explanations: string[];
  rank: number | null;
  gapToNextCad: number | null;
}

export interface RecommendationResult {
  calculationVersion: string;
  catalogVersion: string;
  comparisonDate: string;
  assumptions: string[];
  exclusions: string[];
  monthly: MonthlySpend;
  annual: MonthlySpend;
  monthlyTotalCad: number;
  annualTotalCad: number;
  ranked: RankedCard[];
  conditional: RankedCard[];
  insufficient: RankedCard[];
  excluded: RankedCard[];
  interestOnly: RankedCard[];
  compared: RankedCard[];
  nearTie: boolean;
  nearTieCad: number;
  interestExcludedFromRanking: boolean;
  winnerId: string | null;
  emptyReason: string | null;
}
