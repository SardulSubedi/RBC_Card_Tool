"use client";

import {
  CATEGORIES,
  catalog,
  demos,
  emptySpend,
  preferences as makePreferences,
  recommend,
  sumSpend,
  validateProfile,
  zeroShares,
  cad,
  type Category,
  type ImportSummary,
  type MonthlySpend,
  type Preferences,
  type SpendShares,
} from "@cardfit/engine";
import { useMemo, useState } from "react";
import { Importer } from "./Importer";
import { Results } from "./Results";
import { PreferenceFields, Survey, labels } from "./Survey";

type Mode = "start" | "survey" | "edit" | "import";

export function Explorer() {
  const [mode, setMode] = useState<Mode>("start");
  const [step, setStep] = useState(0);
  const [monthly, setMonthly] = useState<MonthlySpend>(emptySpend());
  const [shares, setShares] = useState<SpendShares>(zeroShares);
  const [prefs, setPrefs] = useState<Preferences>(makePreferences());
  const [banner, setBanner] = useState<string | null>(null);
  const grocery = demos.find((demo) => demo.id === "grocery")!.profile;
  const live = { monthly, shares, preferences: prefs };
  const showingExample = mode === "start";
  const input = showingExample ? grocery : live;
  const errors = validateProfile(input);
  const result = useMemo(() => (errors.length ? null : recommend(catalog, input)), [errors.length, input]);

  function setCategory(category: Category, value: number) {
    setMonthly((current) => ({ ...current, [category]: value }));
    setBanner(null);
  }

  function applyDemo(id: string) {
    const demo = demos.find((item) => item.id === id);
    if (!demo) return;
    setMonthly(demo.profile.monthly);
    setShares(demo.profile.shares);
    setPrefs(demo.profile.preferences);
    setBanner(`${demo.label}: fictional spending, not a real customer.`);
    setMode("edit");
  }

  function useImport(summary: ImportSummary) {
    setMonthly(summary.monthly);
    setShares(summary.shares);
    setBanner("Projected from the transactions you reviewed. The file was not saved.");
    setMode("edit");
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        {mode === "start" ? (
          <Start onSurvey={() => { setMode("survey"); setStep(0); setBanner(null); }} onImport={() => setMode("import")} onDemo={applyDemo} onManual={() => { setMode("edit"); setBanner(null); }} />
        ) : null}
        {mode === "survey" ? (
          <Survey
            step={step}
            monthly={monthly}
            shares={shares}
            preferences={prefs}
            onMonthly={setCategory}
            onShares={setShares}
            onPreferences={(partial) => setPrefs((current) => ({ ...current, ...partial }))}
            onStep={setStep}
            onDone={() => setMode("edit")}
          />
        ) : null}
        {mode === "import" ? <Importer onUse={useImport} onReset={() => { setMonthly(emptySpend()); setShares(zeroShares); setBanner(null); }} /> : null}
        {mode === "edit" ? (
          <Editor
            monthly={monthly}
            preferences={prefs}
            onMonthly={setCategory}
            onPreferences={(partial) => setPrefs((current) => ({ ...current, ...partial }))}
          />
        ) : null}
        {mode !== "start" ? (
          <button type="button" className="mt-4 text-sm font-semibold text-navy" onClick={() => { setMode("start"); setMonthly(emptySpend()); setShares(zeroShares); setPrefs(makePreferences()); setBanner(null); }}>
            Start over
          </button>
        ) : null}
        {errors.length && !showingExample ? <p className="mt-3 text-sm text-bad" role="alert">{errors[0]}</p> : null}
      </section>
      <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
        {result ? (
          <Results
            result={result}
            profile={input}
            example={showingExample}
            banner={showingExample ? null : banner}
            onPreferences={(partial) => {
              setPrefs((current) => ({ ...current, ...partial }));
              if (showingExample) setMode("edit");
            }}
          />
        ) : (
          <p className="rounded-3xl bg-white p-5 text-sm text-bad">{errors[0]}</p>
        )}
      </div>
    </main>
  );
}

function Start({
  onSurvey,
  onImport,
  onDemo,
  onManual,
}: {
  onSurvey: () => void;
  onImport: () => void;
  onDemo: (id: string) => void;
  onManual: () => void;
}) {
  return (
    <div>
      <h1 className="text-4xl font-semibold leading-tight text-navy">Which RBC card is worth more for the way you spend?</h1>
      <p className="mt-3 text-lg leading-7 text-muted">Answer a few questions or bring a CSV. CardFit estimates a year of value from current RBC personal card terms. The numbers stay in this tab.</p>
      <div className="mt-6 grid gap-3">
        <button type="button" className="rounded-full bg-navy px-5 py-3 text-left font-semibold text-white" onClick={onSurvey}>Answer a few questions</button>
        <button type="button" data-testid="open-import" className="rounded-full border border-navy px-5 py-3 text-left font-semibold text-navy" onClick={onImport}>Upload a CSV</button>
        <button type="button" className="text-left text-sm font-semibold text-blue" onClick={onManual}>Type every category instead</button>
      </div>
      <p className="mt-6 text-sm font-semibold text-navy">Try a demo</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {demos.map((demo) => (
          <button key={demo.id} type="button" data-testid={`demo-${demo.id}`} className="rounded-2xl border border-line px-3 py-3 text-left" onClick={() => onDemo(demo.id)}>
            <span className="block font-semibold text-navy">{demo.label}</span>
            <span className="mt-1 block text-xs leading-5 text-muted">{demo.blurb}</span>
          </button>
        ))}
      </div>
      <p className="mt-6 text-sm leading-6 text-muted">You will see an estimated yearly value, the fee, a short reason, and a comparison. Welcome offers stay out of the main ranking unless you turn them on.</p>
    </div>
  );
}

function Editor({
  monthly,
  preferences,
  onMonthly,
  onPreferences,
}: {
  monthly: MonthlySpend;
  preferences: Preferences;
  onMonthly: (category: Category, value: number) => void;
  onPreferences: (partial: Partial<Preferences>) => void;
}) {
  const total = sumSpend(monthly);
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-navy">Your monthly spending</h2>
          <p className="mt-1 text-sm text-muted">{cad(total)} a month · {cad(total * 12)} a year</p>
        </div>
        <a href="#results" className="shrink-0 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white lg:hidden">See cards</a>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <label key={category} className="text-sm font-semibold text-navy">
            {labels[category]}
            {monthly[category] < 0 ? <span className="ml-1 font-medium text-bad">Refunds exceed purchases</span> : null}
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-medium text-ink"
              type="number"
              step="1"
              aria-label={labels[category]}
              value={monthly[category]}
              onChange={(event) => onMonthly(category, event.target.value === "" ? 0 : Number(event.target.value))}
            />
          </label>
        ))}
      </div>
      <PreferenceFields preferences={preferences} onPreferences={onPreferences} />
    </div>
  );
}
