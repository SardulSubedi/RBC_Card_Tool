"use client";

import { cad } from "@cardfit/engine";

export function MoneyField({
  label,
  hint,
  value,
  onChange,
  allowNegative = false,
  compact = false,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  allowNegative?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <label className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
        <span>
          <span className="block font-semibold text-navy">{label}</span>
          {hint ? <span className="block text-sm text-muted">{hint}</span> : null}
          {value < 0 ? <span className="block text-sm text-bad">Refunds are larger than purchases.</span> : null}
        </span>
        <input
          className="w-28 rounded-xl border border-line px-3 py-2 text-right tabular-nums"
          type="number"
          inputMode="decimal"
          min={allowNegative ? undefined : 0}
          step="1"
          aria-label={`${label} per month`}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => {
            const next = event.target.value === "" ? 0 : Number(event.target.value);
            if (!Number.isFinite(next)) return;
            if (!allowNegative && next < 0) return;
            onChange(next);
          }}
        />
      </label>
    );
  }
  const presets = [0, 50, 150, 400, 800];
  return (
    <fieldset className="rounded-2xl border border-line bg-white p-4">
      <legend className="px-1 text-base font-semibold text-navy">{label}</legend>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      <p className="mt-3 text-3xl font-semibold tabular-nums text-ink">{cad(value)}<span className="ml-2 text-base font-medium text-muted">/ month</span></p>
      {value < 0 ? (
        <p className="mt-2 text-sm text-bad">Refunds are larger than purchases in this category, so the total stays negative and reduces rewards.</p>
      ) : null}
      <input
        className="mt-4 w-full"
        type="range"
        min={0}
        max={2000}
        step={10}
        aria-label={`${label} amount slider`}
        value={Math.min(2000, Math.max(0, value))}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={value === preset}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${value === preset ? "bg-navy text-white" : "bg-paper text-navy"}`}
            onClick={() => onChange(preset)}
          >
            {cad(preset)}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-sm text-muted">
        Type an amount
        <input
          className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-ink"
          type="number"
          inputMode="decimal"
          min={allowNegative ? undefined : 0}
          step="1"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => {
            const next = event.target.value === "" ? 0 : Number(event.target.value);
            if (!Number.isFinite(next)) return;
            if (!allowNegative && next < 0) return;
            onChange(next);
          }}
        />
      </label>
    </fieldset>
  );
}
