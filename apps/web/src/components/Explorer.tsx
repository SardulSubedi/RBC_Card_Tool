"use client";

import {
  CATEGORIES,
  cad,
  catalog,
  demos,
  emptySpend,
  preferences as makePreferences,
  recommend,
  sumSpend,
  validateProfile,
  zeroShares,
  type Category,
  type ImportSummary,
  type MonthlySpend,
  type Preferences,
  type SpendShares,
} from "@cardfit/engine";
import { useEffect, useMemo, useState } from "react";
import { labels } from "../lib/labels";
import { Icon } from "./icons";
import { Importer } from "./Importer";
import { Landing } from "./Landing";
import { NumberCell } from "./money-field";
import { Results } from "./Results";
import { PreferenceFields, Survey } from "./Survey";
import { Button, Chevron } from "./ui";

type Mode = "start" | "quiz" | "import" | "results";

export function Explorer() {
  const [mode, setMode] = useState<Mode>("start");
  const [step, setStep] = useState(0);
  const [monthly, setMonthly] = useState<MonthlySpend>(emptySpend());
  const [shares, setShares] = useState<SpendShares>(zeroShares);
  const [prefs, setPrefs] = useState<Preferences>(makePreferences());
  const [banner, setBanner] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  const input = useMemo(() => ({ monthly, shares, preferences: prefs }), [monthly, shares, prefs]);
  const errors = validateProfile(input);
  const result = useMemo(() => (errors.length ? null : recommend(catalog, input)), [errors.length, input]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [mode, step]);

  function setCategory(category: Category, value: number) {
    setMonthly((current) => ({ ...current, [category]: value }));
  }

  function updatePrefs(partial: Partial<Preferences>) {
    setPrefs((current) => ({ ...current, ...partial }));
  }

  function reset() {
    setMonthly(emptySpend());
    setShares(zeroShares);
    setPrefs(makePreferences());
    setBanner(null);
    setAdjusting(false);
    setStep(0);
    setMode("start");
  }

  function applyDemo(id: string) {
    const demo = demos.find((item) => item.id === id);
    if (!demo) return;
    setMonthly(demo.profile.monthly);
    setShares(demo.profile.shares);
    setPrefs(demo.profile.preferences);
    setBanner(`${demo.label} sample. Fictional spending, not a real customer.`);
    setAdjusting(false);
    setMode("results");
  }

  function useImport(summary: ImportSummary) {
    setMonthly(summary.monthly);
    setShares(summary.shares);
    setBanner("Projected from the transactions you reviewed. The file was not saved.");
    setAdjusting(false);
    setMode("results");
  }

  if (mode === "start") {
    return (
      <Landing
        onQuiz={() => {
          setStep(0);
          setBanner(null);
          setMode("quiz");
        }}
        onImport={() => setMode("import")}
        onDemo={applyDemo}
        onManual={() => {
          setBanner(null);
          setAdjusting(true);
          setMode("results");
        }}
      />
    );
  }

  if (mode === "quiz") {
    return (
      <main className="bg-white">
        <Survey
          step={step}
          monthly={monthly}
          shares={shares}
          preferences={prefs}
          onMonthly={setCategory}
          onShares={setShares}
          onPreferences={updatePrefs}
          onStep={setStep}
          onDone={() => {
            setBanner(null);
            setMode("results");
          }}
          onExit={() => setMode("start")}
        />
      </main>
    );
  }

  if (mode === "import") {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 pb-16 pt-6">
        <button type="button" onClick={() => setMode("start")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-rbc hover:underline">
          <Icon.ArrowLeft size={18} /> Home
        </button>
        <div className="mt-6">
          <Importer
            onUse={useImport}
            onReset={() => {
              setMonthly(emptySpend());
              setShares(zeroShares);
              setBanner(null);
            }}
          />
        </div>
      </main>
    );
  }

  const total = sumSpend(monthly);

  return (
    <main className="bg-paper">
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-sm text-muted">Your profile</p>
            <p className="font-semibold text-ink">
              <span className="tabular">{cad(total)}</span> a month <span aria-hidden className="mx-1.5 text-gold">•</span> {feeSummary(prefs)} <span aria-hidden className="mx-1.5 text-gold">•</span> {focusSummary(prefs)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStep(0);
                setMode("quiz");
              }}
            >
              <Icon.Pencil size={16} /> Edit answers
            </Button>
            <Button variant={adjusting ? "primary" : "secondary"} size="sm" aria-expanded={adjusting} data-testid="adjust" onClick={() => setAdjusting((value) => !value)}>
              Adjust numbers <Chevron className={`h-4 w-4 transition-transform duration-300 ${adjusting ? "rotate-180" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              Start over
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-5 py-8">
        {adjusting ? (
          <section className="rise rounded-3xl border border-line bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">Monthly spending by category</h2>
                <p className="mt-1 text-sm text-muted">
                  <span className="tabular">{cad(total)}</span> a month, <span className="tabular">{cad(total * 12)}</span> a year. Results below update as you type.
                </p>
              </div>
              <a href="#results" className="text-sm font-semibold text-rbc hover:underline">
                Jump to results
              </a>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => (
                <NumberCell key={category} label={labels[category]} value={monthly[category]} onChange={(value) => setCategory(category, value)} />
              ))}
            </div>
            <div className="mt-8 border-t border-line pt-8">
              <PreferenceFields preferences={prefs} onPreferences={updatePrefs} />
            </div>
          </section>
        ) : null}

        {errors.length ? (
          <p className="rounded-2xl border border-bad/30 bg-white px-5 py-4 text-sm text-bad" role="alert">
            {errors[0]}
          </p>
        ) : null}

        {result ? <Results result={result} profile={input} banner={banner} onPreferences={updatePrefs} /> : null}
      </div>
    </main>
  );
}

function feeSummary(prefs: Preferences) {
  if (prefs.feeMode === "no_fee") return "no annual fee";
  if (prefs.feeMode === "only_if_worth_more") return "fee only if it pays off";
  return `fee up to ${cad(prefs.maxAnnualFee ?? 0)}`;
}

function focusSummary(prefs: Preferences) {
  return { either: "all card types", cash: "cash back", travel: "travel rewards", everyday: "everyday points" }[prefs.rewardFocus];
}
