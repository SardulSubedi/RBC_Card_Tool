"use client";

import { cad } from "@cardfit/engine";
import { useId, useState, type ReactNode } from "react";
import { OptionTile } from "./ui";

export interface Band {
  label: string;
  value: number;
}

/** Tappable monthly ranges with an optional exact-amount field. */
export function BandPicker({
  bands,
  value,
  onChange,
  name,
}: {
  bands: Band[];
  value: number;
  onChange: (value: number) => void;
  name: string;
}) {
  const matches = bands.some((band) => band.value === value);
  const [exact, setExact] = useState(!matches && value !== 0);
  const id = useId();
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {bands.map((band) => (
          <OptionTile
            key={band.label}
            active={!exact && band.value === value}
            title={band.label}
            onClick={() => {
              setExact(false);
              onChange(band.value);
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {exact ? (
          <label htmlFor={id} className="flex items-center gap-3 font-medium text-ink">
            Exact amount a month
            <span className="relative">
              <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
              <input
                id={id}
                className="w-36 pl-7 text-right tabular"
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                autoFocus
                aria-label={`${name}, exact amount a month`}
                value={Number.isFinite(value) ? value : 0}
                onChange={(event) => {
                  const next = event.target.value === "" ? 0 : Number(event.target.value);
                  if (Number.isFinite(next) && next >= 0) onChange(next);
                }}
              />
            </span>
          </label>
        ) : (
          <button type="button" className="font-semibold text-rbc hover:underline" onClick={() => setExact(true)}>
            Enter an exact amount instead
          </button>
        )}
        {exact ? (
          <button type="button" className="font-semibold text-rbc hover:underline" onClick={() => setExact(false)}>
            Back to ranges
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** A labelled slider with a live dollar read-out, for screens that gather several smaller categories. */
export function SliderRow({
  label,
  hint,
  icon,
  value,
  max,
  step = 5,
  onChange,
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
  value: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const clamped = Math.min(max, Math.max(0, value));
  const fill = `${(clamped / max) * 100}%`;
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2.5 font-semibold text-ink">
          {icon ? <span className="text-rbc">{icon}</span> : null}
          <span>
            {label}
            {hint ? <span className="block text-xs font-medium text-muted">{hint}</span> : null}
          </span>
        </label>
        <span className="relative">
          <span aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
          <input
            className="w-24 py-1.5 pl-6 text-right text-sm font-semibold tabular"
            type="number"
            inputMode="decimal"
            min={0}
            step="1"
            aria-label={`${label}, amount a month`}
            value={Number.isFinite(value) ? value : 0}
            onChange={(event) => {
              const next = event.target.value === "" ? 0 : Number(event.target.value);
              if (Number.isFinite(next) && next >= 0) onChange(next);
            }}
          />
        </span>
      </div>
      <input
        id={id}
        className="mt-1"
        type="range"
        min={0}
        max={max}
        step={step}
        value={clamped}
        style={{ ["--fill" as string]: fill }}
        aria-valuetext={`${cad(clamped)} a month`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {value < 0 ? <p className="text-sm text-bad">Refunds are larger than purchases in this category.</p> : null}
    </div>
  );
}

/** Compact number input used by the full editor. */
export function NumberCell({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-ink">
      {label}
      {value < 0 ? <span className="ml-1 font-medium text-bad">Refunds exceed purchases</span> : null}
      <span className="relative mt-1 block">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
        <input id={id} className="w-full pl-7 tabular" type="number" step="1" value={value} onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))} />
      </span>
    </label>
  );
}
