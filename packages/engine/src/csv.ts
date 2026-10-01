import { CATEGORIES, type Category, type MonthlySpend } from "./types";
import { emptySpend, isIsoDate, monthCountInclusive } from "./money";

export type ImportCategory = Category | "exclude" | "unknown";

export interface MerchantRule {
  contains: string;
  category: ImportCategory;
  flag?: "westjet" | "ba" | "moi" | "more";
  reason: string;
}

export interface MappedRow {
  id: string;
  sourceId: string | null;
  date: string | null;
  description: string;
  amount: number | null;
  currency: string | null;
  status: string | null;
  category: ImportCategory;
  flag?: MerchantRule["flag"];
  reason: string;
  included: boolean;
  issues: string[];
}

export interface ImportSummary {
  rows: MappedRow[];
  monthly: MonthlySpend;
  shares: {
    moiGroceryShare: number;
    moreGroceryShare: number;
    westjetTravelShare: number;
    baTravelShare: number;
  };
  months: number;
  periodStart: string;
  periodEnd: string;
  partial: boolean;
  zeroMonths: number;
  counts: { included: number; excluded: number; refunds: number; flagged: number };
  dollars: {
    raw: number;
    excluded: number;
    refunds: number;
    purchases: number;
    eligibleNet: number;
  };
  errors: string[];
  needsCoverageConfirmation: boolean;
}

export const DEFAULT_MERCHANT_RULES: MerchantRule[] = [
  { contains: "payment", category: "exclude", reason: "Payment" },
  { contains: "thank you", category: "exclude", reason: "Payment" },
  { contains: "autopay", category: "exclude", reason: "Payment" },
  { contains: "transfer", category: "exclude", reason: "Transfer" },
  { contains: "interest", category: "exclude", reason: "Interest" },
  { contains: "annual fee", category: "exclude", reason: "Fee" },
  { contains: "fee", category: "exclude", reason: "Fee" },
  { contains: "cash advance", category: "exclude", reason: "Cash advance" },
  { contains: "atm", category: "exclude", reason: "Cash advance" },
  { contains: "uber eats", category: "dining", reason: "Delivery description. Category is an estimate, not a confirmed MCC." },
  { contains: "doordash", category: "dining", reason: "Delivery description. Category is an estimate, not a confirmed MCC." },
  { contains: "skip the dishes", category: "dining", reason: "Delivery description. Category is an estimate, not a confirmed MCC." },
  { contains: "tim hortons", category: "dining", reason: "Dining description. Category is an estimate, not a confirmed MCC." },
  { contains: "starbucks", category: "dining", reason: "Dining description. Category is an estimate, not a confirmed MCC." },
  { contains: "mcdonald", category: "dining", reason: "Dining description. Category is an estimate, not a confirmed MCC." },
  { contains: "flo ev", category: "ev_charging", reason: "EV charging description. Category is an estimate, not a confirmed MCC." },
  { contains: "chargepoint", category: "ev_charging", reason: "EV charging description. Category is an estimate, not a confirmed MCC." },
  { contains: "tesla supercharger", category: "ev_charging", reason: "EV charging description. Category is an estimate, not a confirmed MCC." },
  { contains: "petro-canada", category: "gas", reason: "Gas description. Category is an estimate, not a confirmed MCC." },
  { contains: "petro canada", category: "gas", reason: "Gas description. Category is an estimate, not a confirmed MCC." },
  { contains: "shell", category: "gas", reason: "Gas description. Category is an estimate, not a confirmed MCC." },
  { contains: "esso", category: "gas", reason: "Gas description. Category is an estimate, not a confirmed MCC." },
  { contains: "costco", category: "warehouse", reason: "Warehouse club. RBC treats Costco as a warehouse, not a grocery MCC." },
  { contains: "walmart", category: "warehouse", reason: "RBC treats Walmart as a warehouse club, not a grocery MCC." },
  { contains: "wal-mart", category: "warehouse", reason: "RBC treats Walmart as a warehouse club, not a grocery MCC." },
  { contains: "save-on-foods", category: "groceries", flag: "more", reason: "More Rewards partner grocery. Estimate only." },
  { contains: "save on foods", category: "groceries", flag: "more", reason: "More Rewards partner grocery. Estimate only." },
  { contains: "food basics", category: "groceries", flag: "moi", reason: "Moi banner grocery. Estimate only." },
  { contains: "super c", category: "groceries", flag: "moi", reason: "Moi banner grocery. Estimate only." },
  { contains: "jean coutu", category: "groceries", flag: "moi", reason: "Moi banner. Estimate only." },
  { contains: "metro", category: "groceries", flag: "moi", reason: "Moi banner grocery. Estimate only." },
  { contains: "loblaws", category: "groceries", reason: "Grocery description. Category is an estimate, not a confirmed MCC." },
  { contains: "no frills", category: "groceries", reason: "Grocery description. Category is an estimate, not a confirmed MCC." },
  { contains: "sobeys", category: "groceries", reason: "Grocery description. Category is an estimate, not a confirmed MCC." },
  { contains: "superstore", category: "groceries", reason: "Grocery description. Category is an estimate, not a confirmed MCC." },
  { contains: "presto", category: "transit", reason: "Transit description. Category is an estimate, not a confirmed MCC." },
  { contains: "ttc", category: "transit", reason: "Transit description. Category is an estimate, not a confirmed MCC." },
  { contains: "go transit", category: "transit", reason: "Transit description. Category is an estimate, not a confirmed MCC." },
  { contains: "uber", category: "rideshare", reason: "Rideshare description. Category is an estimate, not a confirmed MCC." },
  { contains: "lyft", category: "rideshare", reason: "Rideshare description. Category is an estimate, not a confirmed MCC." },
  { contains: "netflix", category: "streaming", reason: "Streaming description. Category is an estimate, not a confirmed MCC." },
  { contains: "spotify", category: "streaming", reason: "Streaming description. Category is an estimate, not a confirmed MCC." },
  { contains: "disney", category: "streaming", reason: "Streaming description. Category is an estimate, not a confirmed MCC." },
  { contains: "steam", category: "gaming", reason: "Gaming description. Category is an estimate, not a confirmed MCC." },
  { contains: "playstation", category: "gaming", reason: "Gaming description. Category is an estimate, not a confirmed MCC." },
  { contains: "hydro", category: "bills", reason: "Bill description. Some bill payments do not earn rewards." },
  { contains: "enbridge", category: "bills", reason: "Bill description. Some bill payments do not earn rewards." },
  { contains: "rogers", category: "bills", reason: "Bill description. Some bill payments do not earn rewards." },
  { contains: "westjet", category: "travel", flag: "westjet", reason: "WestJet travel. Category is an estimate, not a confirmed MCC." },
  { contains: "sunwing", category: "travel", flag: "westjet", reason: "Sunwing travel. Category is an estimate, not a confirmed MCC." },
  { contains: "british airways", category: "travel", flag: "ba", reason: "British Airways travel. Category is an estimate, not a confirmed MCC." },
  { contains: "air canada", category: "travel", reason: "Travel description. Category is an estimate, not a confirmed MCC." },
  { contains: "expedia", category: "travel", reason: "Travel description. Category is an estimate, not a confirmed MCC." },
  { contains: "amazon", category: "other", reason: "General retail. Category is an estimate, not a confirmed MCC." },
];

export interface ColumnMap {
  date: string;
  description: string;
  amount?: string;
  debit?: string;
  credit?: string;
  category?: string;
  id?: string;
  currency?: string;
  status?: string;
}

export type DateOrder = "ymd" | "mdy" | "dmy";
export type SignMode = "purchases_positive" | "purchases_negative";

const MAX_ROWS = 20000;
const MAX_BYTES = 5_000_000;

export function assertFileLimits(byteLength: number, rowCount: number): string | null {
  if (byteLength > MAX_BYTES) return "This file is over the 5 MB limit.";
  if (rowCount > MAX_ROWS) return "This file is over the 20,000 row limit.";
  return null;
}

export function neutralizeSpreadsheet(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
  return value;
}

export function classifyMerchant(description: string, rules: MerchantRule[] = DEFAULT_MERCHANT_RULES): MerchantRule | null {
  const haystack = description.toLowerCase();
  return rules.find((rule) => haystack.includes(rule.contains.toLowerCase())) ?? null;
}

export function parseDate(value: string, order: DateOrder): string | null {
  const trimmed = value.trim();
  if (order === "ymd" && isIsoDate(trimmed.slice(0, 10))) return trimmed.slice(0, 10);
  const match = trimmed.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})$/);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  let year: number;
  let month: number;
  let day: number;
  if (order === "ymd") [year, month, day] = parts;
  else if (order === "mdy") [month, day, year] = parts;
  else [day, month, year] = parts;
  if (year < 100) year += 2000;
  const iso = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  return isIsoDate(iso) ? iso : null;
}

export function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const negative = /^\(.*\)$/.test(trimmed) || trimmed.startsWith("-");
  const numeric = Number(trimmed.replace(/[,$()\s]/g, "").replace(/^\+/, ""));
  if (!Number.isFinite(numeric)) return null;
  return negative ? -Math.abs(numeric) : numeric;
}

export function reviewImport(options: {
  records: Record<string, string>[];
  columns: ColumnMap;
  sign: SignMode;
  dateOrder: DateOrder;
  periodStart: string;
  periodEnd: string;
  rules?: MerchantRule[];
  categoryOverrides?: Record<string, ImportCategory>;
  duplicateDecisions?: Record<string, "exclude" | "keep">;
}): ImportSummary {
  const errors: string[] = [];
  const limit = assertFileLimits(0, options.records.length);
  if (limit) errors.push(limit);
  const rules = options.rules ?? DEFAULT_MERCHANT_RULES;
  const rows: MappedRow[] = [];
  options.records.forEach((record, index) => {
    const description = (record[options.columns.description] ?? "").trim();
    const rawDate = record[options.columns.date] ?? "";
    const date = parseDate(rawDate, options.dateOrder);
    if (rawDate && !date) errors.push(`Row ${index + 1}: could not read the date "${rawDate}".`);
    let amount = options.columns.amount ? parseAmount(record[options.columns.amount] ?? "") : null;
    if (!options.columns.amount && options.columns.debit && options.columns.credit) {
      const debit = parseAmount(record[options.columns.debit] ?? "") ?? 0;
      const credit = parseAmount(record[options.columns.credit] ?? "") ?? 0;
      amount = debit - credit;
    }
    if (amount == null || !Number.isFinite(amount)) {
      rows.push(blank(index, description, date, "Amount could not be read."));
      return;
    }
    if (options.sign === "purchases_negative") amount = -amount;
    const sourceId = options.columns.id ? (record[options.columns.id] ?? "").trim() || null : null;
    const currency = options.columns.currency ? (record[options.columns.currency] ?? "").trim().toUpperCase() : "";
    const status = options.columns.status ? (record[options.columns.status] ?? "").trim().toLowerCase() : "";
    const override = options.categoryOverrides?.[String(index)];
    const classified = classifyMerchant(description, rules);
    const category = override ?? classified?.category ?? "unknown";
    const issues: string[] = [];
    let included = true;
    let reason = classified?.reason ?? "No merchant rule matched. This is an estimate until you assign a category.";
    if (category === "unknown") {
      included = false;
      reason = "Unknown merchant. Assign a category or leave it out.";
    }
    if (category === "exclude") {
      included = false;
      reason = classified?.reason ?? "Excluded";
    }
    if (currency && currency !== "CAD") {
      included = false;
      reason = "Non-CAD row left out of the Canadian comparison.";
    }
    if (status === "pending" || status === "declined" || status === "cancelled") {
      included = false;
      reason = `Status is ${status}.`;
    }
    if (date && (date < options.periodStart || date > options.periodEnd)) {
      included = false;
      reason = "Outside the selected period.";
    }
    if (!date) {
      included = false;
      reason = "Missing or unreadable date.";
    }
    rows.push({
      id: String(index),
      sourceId,
      date,
      description,
      amount,
      currency: currency || null,
      status: status || null,
      category,
      flag: classified?.flag,
      reason,
      included,
      issues,
    });
  });

  const seenIds = new Set<string>();
  const seenLoose = new Map<string, string>();
  for (const row of rows) {
    if (row.sourceId) {
      if (seenIds.has(row.sourceId)) {
        row.issues.push("Same transaction ID as an earlier row.");
        const decision = options.duplicateDecisions?.[row.id] ?? "exclude";
        if (decision === "exclude") {
          row.included = false;
          row.reason = "Duplicate transaction ID. Kept the first copy.";
        }
      } else seenIds.add(row.sourceId);
    } else if (row.date && row.amount != null) {
      const key = `${row.date}|${row.description.toLowerCase()}|${row.amount}`;
      const prior = seenLoose.get(key);
      if (prior) {
        row.issues.push("Same date, merchant, and amount as another row. This can be a real second purchase, so it is kept unless you exclude it.");
        if (options.duplicateDecisions?.[row.id] === "exclude") {
          row.included = false;
          row.reason = "Possible duplicate excluded by you.";
        }
      } else seenLoose.set(key, row.id);
    }
  }

  const months = monthCountInclusive(options.periodStart, options.periodEnd);
  const monthly = emptySpend();
  const flags = { moi: 0, more: 0, westjet: 0, ba: 0, groceries: 0, travel: 0 };
  let raw = 0;
  let excluded = 0;
  let refunds = 0;
  let purchases = 0;
  for (const row of rows) {
    raw += row.amount ?? 0;
    if (!row.included || row.amount == null || row.category === "exclude" || row.category === "unknown") {
      excluded += row.amount ?? 0;
      continue;
    }
    monthly[row.category] += row.amount;
    if (row.amount < 0) refunds += row.amount;
    else purchases += row.amount;
    if (row.category === "groceries") flags.groceries += row.amount;
    if (row.category === "travel") flags.travel += row.amount;
    if (row.flag === "moi") flags.moi += row.amount;
    if (row.flag === "more") flags.more += row.amount;
    if (row.flag === "westjet") flags.westjet += row.amount;
    if (row.flag === "ba") flags.ba += row.amount;
  }
  const monthTotals = new Map<string, number>();
  for (const row of rows) {
    if (!row.included || !row.date) continue;
    const key = row.date.slice(0, 7);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + 1);
  }
  let zeroMonths = 0;
  const cursor = new Date(`${options.periodStart.slice(0, 7)}-01T00:00:00Z`);
  const end = new Date(`${options.periodEnd.slice(0, 7)}-01T00:00:00Z`);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 7);
    if (!monthTotals.has(key)) zeroMonths += 1;
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const divisor = Math.max(1, months);
  for (const category of CATEGORIES) monthly[category] = monthly[category] / divisor;
  const partial = !options.periodStart.endsWith("-01") || !isMonthEnd(options.periodEnd) || zeroMonths > 0 || months < 12;
  const share = (part: number, whole: number) => (whole > 0 ? Math.min(1, Math.max(0, part / whole)) : 0);
  return {
    rows,
    monthly,
    shares: {
      moiGroceryShare: share(flags.moi, flags.groceries),
      moreGroceryShare: share(flags.more, flags.groceries),
      westjetTravelShare: share(flags.westjet, flags.travel),
      baTravelShare: share(flags.ba, flags.travel),
    },
    months,
    periodStart: options.periodStart,
    periodEnd: options.periodEnd,
    partial,
    zeroMonths,
    counts: {
      included: rows.filter((row) => row.included).length,
      excluded: rows.filter((row) => !row.included).length,
      refunds: rows.filter((row) => row.included && (row.amount ?? 0) < 0).length,
      flagged: rows.filter((row) => row.issues.length > 0).length,
    },
    dollars: {
      raw,
      excluded,
      refunds,
      purchases,
      eligibleNet: purchases + refunds,
    },
    errors: [...new Set(errors)].slice(0, 20),
    needsCoverageConfirmation: partial,
  };
}

function blank(index: number, description: string, date: string | null, reason: string): MappedRow {
  return {
    id: String(index),
    sourceId: null,
    date,
    description,
    amount: null,
    currency: null,
    status: null,
    category: "unknown",
    reason,
    included: false,
    issues: [reason],
  };
}

function isMonthEnd(iso: string): boolean {
  const [year, month, day] = iso.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day === last;
}

export function exportReviewCsv(rows: MappedRow[]): string {
  const header = ["date", "description", "amount", "category", "included", "reason"];
  const body = rows.map((row) =>
    [row.date ?? "", neutralizeSpreadsheet(row.description), row.amount ?? "", row.category, row.included ? "yes" : "no", neutralizeSpreadsheet(row.reason)]
      .map(cell)
      .join(","),
  );
  return [header.join(","), ...body].join("\n");
}

function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
