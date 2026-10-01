"use client";

import { DEFAULT_MERCHANT_RULES, reviewImport, sampleGroceryCsv, type ColumnMap, type ImportSummary, type MappedRow, type SignMode } from "@cardfit/engine";
import Papa from "papaparse";
import { useMemo, useState } from "react";

const emptyMap: ColumnMap = { date: "", description: "" };

export function Importer({
  onUse,
  onReset,
}: {
  onUse: (summary: ImportSummary) => void;
  onReset: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, string>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnMap>(emptyMap);
  const [sign, setSign] = useState<SignMode | null>(null);
  const [dateOrder, setDateOrder] = useState<"ymd" | "mdy" | "dmy">("ymd");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [overrides, setOverrides] = useState<Record<string, MappedRow["category"]>>({});
  const [duplicates, setDuplicates] = useState<Record<string, "exclude" | "keep">>({});
  const [confirmed, setConfirmed] = useState(false);
  const [ruleText, setRuleText] = useState("");
  const [ruleCategory, setRuleCategory] = useState<MappedRow["category"]>("other");
  const [extraRules, setExtraRules] = useState<{ contains: string; category: MappedRow["category"]; reason: string }[]>([]);

  const summary = useMemo(() => {
    if (!records || !sign || !columns.date || !columns.description || !periodStart || !periodEnd) return null;
    return reviewImport({
      records,
      columns,
      sign,
      dateOrder,
      periodStart,
      periodEnd,
      categoryOverrides: overrides,
      duplicateDecisions: duplicates,
      rules: [...extraRules, ...DEFAULT_MERCHANT_RULES],
    });
  }, [records, sign, columns, dateOrder, periodStart, periodEnd, overrides, duplicates, extraRules]);

  function load(file: File) {
    if (file.size > 5_000_000) {
      setError("This file is over the 5 MB limit.");
      return;
    }
    file.text().then((text) => {
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      const rows = parsed.data.filter((row) => Object.values(row).some(Boolean));
      if (rows.length > 20000) {
        setError("This file is over the 20,000 row limit.");
        return;
      }
      const names = parsed.meta.fields ?? [];
      const detected = detect(names);
      setHeaders(names);
      setColumns(detected);
      setRecords(rows);
      setError(parsed.errors[0]?.message ?? null);
      const dates = rows.map((row) => row[detected.date] ?? "").filter(Boolean).sort();
      const start = toIso(dates[0]) ?? "";
      const end = toIso(dates[dates.length - 1]) ?? "";
      setPeriodStart(start ? `${start.slice(0, 8)}01` : "");
      setPeriodEnd(end ? monthEnd(end) : "");
      setSign(null);
      setConfirmed(false);
    });
  }

  const blocked = summary?.needsCoverageConfirmation && !confirmed;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-navy">Upload transactions</h2>
      <p className="text-sm leading-6 text-muted">The file stays in this browser tab. It is not uploaded, saved, or sent anywhere. Merchant names are an estimate, not a confirmed merchant category code.</p>
      <div className="flex flex-wrap gap-3">
        <label className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
          Choose CSV
          <input data-testid="csv-input" className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) load(file);
          }} />
        </label>
        <button type="button" className="rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy" onClick={() => downloadSample()}>Download sample CSV</button>
        <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-navy" onClick={() => { setRecords(null); setSign(null); onReset(); }}>Clear import</button>
      </div>
      {error ? <p className="text-sm text-bad" role="alert">{error}</p> : null}
      {records && headers.length ? (
        <div className="space-y-3 rounded-2xl border border-line bg-white p-4">
          <p className="font-semibold text-navy">Columns</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select label="Date" value={columns.date} options={headers} onChange={(date) => setColumns({ ...columns, date })} />
            <Select label="Description" value={columns.description} options={headers} onChange={(description) => setColumns({ ...columns, description })} />
            <Select label="Amount" value={columns.amount ?? ""} options={["", ...headers]} onChange={(amount) => setColumns({ ...columns, amount })} />
            <Select label="Date format" value={dateOrder} options={["ymd", "mdy", "dmy"]} onChange={(value) => setDateOrder(value as "ymd" | "mdy" | "dmy")} />
          </div>
          <p className="font-semibold text-navy">Are purchases positive or negative in this file?</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" data-testid="sign-positive" className={sign === "purchases_positive" ? "rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-white" : "rounded-xl border border-line px-3 py-2 text-sm font-semibold"} onClick={() => setSign("purchases_positive")}>Purchases are positive</button>
            <button type="button" className={sign === "purchases_negative" ? "rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-white" : "rounded-xl border border-line px-3 py-2 text-sm font-semibold"} onClick={() => setSign("purchases_negative")}>Purchases are negative</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">Period start<input className="mt-1 w-full rounded-xl border border-line px-2 py-1" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></label>
            <label className="text-sm">Period end<input className="mt-1 w-full rounded-xl border border-line px-2 py-1" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></label>
          </div>
        </div>
      ) : null}
      {summary ? <Review summary={summary} onOverride={(id, category) => setOverrides({ ...overrides, [id]: category })} onDuplicate={(id, decision) => setDuplicates({ ...duplicates, [id]: decision })} /> : null}
      {summary ? (
        <div className="rounded-2xl border border-line bg-white p-4 text-sm">
          <p className="font-semibold text-navy">Add a merchant rule</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input className="rounded-xl border border-line px-2 py-1" placeholder="Description contains" value={ruleText} onChange={(event) => setRuleText(event.target.value)} />
            <select className="rounded-xl border border-line px-2 py-1" value={ruleCategory} onChange={(event) => setRuleCategory(event.target.value as MappedRow["category"])}>
              {["groceries", "warehouse", "dining", "gas", "ev_charging", "transit", "rideshare", "streaming", "gaming", "bills", "travel", "other", "exclude"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <button type="button" className="rounded-full bg-paper px-3 py-1 font-semibold" onClick={() => {
              if (!ruleText.trim()) return;
              setExtraRules([{ contains: ruleText.trim(), category: ruleCategory, reason: "Your merchant rule. Still an estimate." }, ...extraRules]);
              setRuleText("");
            }}>Add rule</button>
          </div>
        </div>
      ) : null}
      {summary?.needsCoverageConfirmation ? (
        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          I understand the monthly average divides by every calendar month in the period, including months with no transactions{summary.partial ? " and any partial month" : ""}.
        </label>
      ) : null}
      {summary ? (
        <button type="button" data-testid="use-import" disabled={blocked} className="rounded-full bg-navy px-5 py-2 font-semibold text-white disabled:opacity-40" onClick={() => onUse(summary)}>
          Use these totals
        </button>
      ) : null}
    </div>
  );
}

function Review({
  summary,
  onOverride,
  onDuplicate,
}: {
  summary: ImportSummary;
  onOverride: (id: string, category: MappedRow["category"]) => void;
  onDuplicate: (id: string, decision: "exclude" | "keep") => void;
}) {
  const unknown = summary.rows.filter((row) => row.category === "unknown" || row.issues.length > 0);
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white p-4 text-sm" data-testid="reconciliation">
      <p className="font-semibold text-navy">From the file to a monthly profile</p>
      <ul className="space-y-1 text-muted">
        <li>Rows included: {summary.counts.included}. Rows left out: {summary.counts.excluded}.</li>
        <li>Raw amount in the file: {money(summary.dollars.raw)}.</li>
        <li>Left out (payments, interest, fees, cash advances, duplicates, unknown merchants, or dates outside the period): {money(summary.dollars.excluded)}.</li>
        <li>Refunds kept as adjustments: {money(summary.dollars.refunds)}.</li>
        <li>Eligible net purchases: {money(summary.dollars.eligibleNet)} over {summary.months} calendar months{summary.zeroMonths ? `, including ${summary.zeroMonths} month${summary.zeroMonths === 1 ? "" : "s"} with no transactions` : ""}.</li>
      </ul>
      <p>Observed eligible spending is turned into a projected monthly profile. The recommendation is a projection under current terms, not a claim about rewards already posted to an account.</p>
      {summary.errors.length ? <p className="text-bad">{summary.errors[0]}</p> : null}
      {unknown.length ? (
        <div>
          <p className="font-semibold text-navy">Needs a look</p>
          <ul className="mt-2 max-h-56 space-y-2 overflow-auto">
            {unknown.slice(0, 12).map((row) => (
              <li key={row.id} className="rounded-xl bg-paper p-2">
                <p>{row.date} · {row.description} · {money(row.amount ?? 0)}</p>
                <p className="text-muted">{row.reason} {row.issues.join(" ")}</p>
                <div className="mt-1 flex gap-2">
                  <select aria-label={`Category for ${row.description}`} value={row.category} onChange={(event) => onOverride(row.id, event.target.value as MappedRow["category"])}>
                    {["unknown", "groceries", "warehouse", "dining", "gas", "ev_charging", "transit", "rideshare", "streaming", "gaming", "bills", "travel", "other", "exclude"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                  {row.issues.length ? <button type="button" className="font-semibold text-navy" onClick={() => onDuplicate(row.id, row.included ? "exclude" : "keep")}>{row.included ? "Exclude" : "Keep"}</button> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm">{label}
      <select className="mt-1 w-full rounded-xl border border-line px-2 py-1" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option || "—"}</option>)}
      </select>
    </label>
  );
}

function detect(headers: string[]): ColumnMap {
  const find = (pattern: RegExp) => headers.find((header) => pattern.test(header)) ?? "";
  return {
    date: find(/date|posted/i),
    description: find(/desc|merchant|name/i),
    amount: find(/^amount$|cad/i) || undefined,
    debit: find(/debit/i) || undefined,
    credit: find(/credit/i) || undefined,
    id: find(/id|reference/i) || undefined,
    currency: find(/currency/i) || undefined,
    status: find(/status/i) || undefined,
  };
}

function toIso(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function monthEnd(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${iso.slice(0, 8)}${String(last).padStart(2, "0")}`;
}

function money(value: number) {
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function downloadSample() {
  const blob = new Blob([sampleGroceryCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cardfit-grocery-household.csv";
  link.click();
  URL.revokeObjectURL(url);
}
