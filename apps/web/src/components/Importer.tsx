"use client";

import { DEFAULT_MERCHANT_RULES, reviewImport, sampleGroceryCsv, type ColumnMap, type ImportSummary, type MappedRow, type SignMode } from "@cardfit/engine";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import { Icon } from "./icons";
import { Button, Chip, OptionTile, Panel } from "./ui";

const emptyMap: ColumnMap = { date: "", description: "" };
const categoryOptions = ["groceries", "warehouse", "dining", "gas", "ev_charging", "transit", "rideshare", "streaming", "gaming", "bills", "travel", "other", "exclude"] as const;

export function Importer({
  onUse,
  onReset,
}: {
  onUse: (summary: ImportSummary) => void;
  onReset: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
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
  const [dragging, setDragging] = useState(false);

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
      setFileName(file.name);
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
      setOverrides({});
      setDuplicates({});
    });
  }

  function clear() {
    setRecords(null);
    setFileName(null);
    setSign(null);
    setError(null);
    onReset();
  }

  const blocked = summary?.needsCoverageConfirmation && !confirmed;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight text-ink md:text-[2.125rem]">Upload a statement</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
          Export a CSV from online banking and drop it here. The file is read in this tab only; it is not uploaded, saved, or sent anywhere. Merchant names are matched to categories as an estimate.
        </p>
      </div>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors ${dragging ? "border-rbc bg-sky" : "border-line bg-white hover:border-rbc/60 hover:bg-sky/40"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) load(file);
        }}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky text-rbc">
          <Icon.Upload size={24} />
        </span>
        <span className="font-semibold text-ink">{fileName ? `Loaded ${fileName}` : "Drop a CSV here or click to choose one"}</span>
        <span className="text-sm text-muted">Up to 5 MB and 20,000 rows. Date, description, and amount columns.</span>
        <input
          data-testid="csv-input"
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) load(file);
          }}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" className="font-semibold text-rbc hover:underline" onClick={() => downloadSample()}>
          Download a sample CSV to try
        </button>
        {records ? (
          <button type="button" className="font-semibold text-muted hover:underline" onClick={clear}>
            Clear and start again
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="rounded-2xl border border-bad/30 bg-white px-4 py-3 text-sm text-bad" role="alert">
          {error}
        </p>
      ) : null}

      {records && headers.length ? (
        <Panel className="space-y-6 p-5 md:p-6">
          <div>
            <h2 className="font-semibold text-ink">Which columns hold what?</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Select label="Date" value={columns.date} options={headers} onChange={(date) => setColumns({ ...columns, date })} />
              <Select label="Description" value={columns.description} options={headers} onChange={(description) => setColumns({ ...columns, description })} />
              <Select label="Amount" value={columns.amount ?? ""} options={["", ...headers]} onChange={(amount) => setColumns({ ...columns, amount })} />
              <Select label="Date format" value={dateOrder} options={["ymd", "mdy", "dmy"]} display={{ ymd: "Year-month-day", mdy: "Month/day/year", dmy: "Day/month/year" }} onChange={(value) => setDateOrder(value as "ymd" | "mdy" | "dmy")} />
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-ink">Are purchases positive or negative in this file?</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <OptionTile testId="sign-positive" active={sign === "purchases_positive"} title="Purchases are positive" caption="Payments and refunds show as negatives" onClick={() => setSign("purchases_positive")} />
              <OptionTile active={sign === "purchases_negative"} title="Purchases are negative" caption="Payments and refunds show as positives" onClick={() => setSign("purchases_negative")} />
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-ink">Which months should count?</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-ink">
                First month
                <input className="mt-1 w-full" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
              </label>
              <label className="text-sm font-semibold text-ink">
                Last month
                <input className="mt-1 w-full" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
              </label>
            </div>
          </div>
        </Panel>
      ) : null}

      {summary ? <Review summary={summary} onOverride={(id, category) => setOverrides({ ...overrides, [id]: category })} onDuplicate={(id, decision) => setDuplicates({ ...duplicates, [id]: decision })} /> : null}

      {summary ? (
        <Panel className="p-5 text-sm">
          <h2 className="font-semibold text-ink">Teach it a merchant</h2>
          <p className="mt-1 text-muted">If a store keeps landing in the wrong place, add a rule. Rules stay in this tab.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input className="min-w-[200px] flex-1" placeholder="Description contains…" aria-label="Description contains" value={ruleText} onChange={(event) => setRuleText(event.target.value)} />
            <select aria-label="Category for this rule" value={ruleCategory} onChange={(event) => setRuleCategory(event.target.value as MappedRow["category"])}>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item.replace("_", " ")}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!ruleText.trim()) return;
                setExtraRules([{ contains: ruleText.trim(), category: ruleCategory, reason: "Your merchant rule. Still an estimate." }, ...extraRules]);
                setRuleText("");
              }}
            >
              Add rule
            </Button>
          </div>
          {extraRules.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {extraRules.map((rule) => (
                <li key={rule.contains}>
                  <Chip active onClick={() => setExtraRules(extraRules.filter((item) => item !== rule))}>
                    “{rule.contains}” → {rule.category} ×
                  </Chip>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      ) : null}

      {summary?.needsCoverageConfirmation ? (
        <label className="flex gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-6">
          <input type="checkbox" className="mt-1" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          <span>I understand the monthly average divides by every calendar month in the period, including months with no transactions{summary.partial ? " and any partial month" : ""}.</span>
        </label>
      ) : null}

      {summary ? (
        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg" data-testid="use-import" disabled={blocked} onClick={() => onUse(summary)}>
            See my cards
          </Button>
          {blocked ? <span className="text-sm text-muted">Tick the box above first.</span> : null}
        </div>
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
    <Panel className="p-5 text-sm md:p-6" >
      <div data-testid="reconciliation">
        <h2 className="font-semibold text-ink">From the file to a monthly profile</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row label="Rows included" value={`${summary.counts.included}`} note={`${summary.counts.excluded} left out`} />
          <Row label="Raw amount in the file" value={money(summary.dollars.raw)} />
          <Row label="Left out" value={money(summary.dollars.excluded)} note="payments, interest, fees, cash advances, duplicates, unknown merchants, dates outside the period" />
          <Row label="Refunds kept as adjustments" value={money(summary.dollars.refunds)} />
          <Row
            label="Eligible net purchases"
            value={money(summary.dollars.eligibleNet)}
            note={`over ${summary.months} calendar months${summary.zeroMonths ? `, including ${summary.zeroMonths} with no transactions` : ""}`}
            strong
          />
        </dl>
        <p className="mt-4 leading-6 text-muted">Eligible spending becomes a projected monthly profile. The recommendation is a projection under current terms, not a claim about rewards already posted to an account.</p>
        {summary.errors.length ? <p className="mt-3 text-bad">{summary.errors[0]}</p> : null}
        {unknown.length ? (
          <div className="mt-5">
            <h3 className="font-semibold text-ink">Needs a look ({unknown.length})</h3>
            <ul className="mt-2 max-h-72 divide-y divide-line overflow-auto rounded-xl border border-line">
              {unknown.slice(0, 12).map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {row.description} <span className="font-normal text-muted">· {row.date} · {money(row.amount ?? 0)}</span>
                    </p>
                    <p className="text-muted">
                      {row.reason} {row.issues.join(" ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select aria-label={`Category for ${row.description}`} className="py-1.5" value={row.category} onChange={(event) => onOverride(row.id, event.target.value as MappedRow["category"])}>
                      {["unknown", ...categoryOptions].map((item) => (
                        <option key={item} value={item}>
                          {item.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    {row.issues.length ? (
                      <button type="button" className="font-semibold text-rbc hover:underline" onClick={() => onDuplicate(row.id, row.included ? "exclude" : "keep")}>
                        {row.included ? "Exclude" : "Keep"}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function Row({ label, value, note, strong = false }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <div className={strong ? "sm:col-span-2 border-t border-line pt-3" : ""}>
      <dt className="text-muted">{label}</dt>
      <dd className={`tabular ${strong ? "text-lg font-semibold text-ink" : "font-semibold text-ink"}`}>
        {value}
        {note ? <span className="ml-2 text-sm font-normal text-muted">{note}</span> : null}
      </dd>
    </div>
  );
}

function Select({ label, value, options, display, onChange }: { label: string; value: string; options: string[]; display?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-ink">
      {label}
      <select className="mt-1 w-full" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "" ? "Not in this file" : (display?.[option] ?? option)}
          </option>
        ))}
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
