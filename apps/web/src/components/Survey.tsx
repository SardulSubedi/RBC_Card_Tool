"use client";

import { cad, sumSpend, type Category, type MonthlySpend, type Preferences, type SpendShares } from "@cardfit/engine";
import { MoneyField } from "./money-field";

const labels: Record<Category, string> = {
  groceries: "Groceries",
  warehouse: "Costco and Walmart",
  dining: "Dining and takeout",
  gas: "Gas",
  ev_charging: "EV charging",
  transit: "Transit",
  rideshare: "Rideshare",
  streaming: "Streaming",
  gaming: "Digital gaming",
  bills: "Other bills",
  travel: "Travel",
  other: "Everything else",
};

export function Survey({
  step,
  monthly,
  shares,
  preferences,
  onMonthly,
  onShares,
  onPreferences,
  onStep,
  onDone,
}: {
  step: number;
  monthly: MonthlySpend;
  shares: SpendShares;
  preferences: Preferences;
  onMonthly: (category: Category, value: number) => void;
  onShares: (shares: SpendShares) => void;
  onPreferences: (partial: Partial<Preferences>) => void;
  onStep: (step: number) => void;
  onDone: () => void;
}) {
  const total = sumSpend(monthly);
  return (
    <div>
      <p className="text-sm font-semibold text-blue">Question {step + 1} of 6</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-navy" style={{ width: `${((step + 1) / 6) * 100}%` }} />
      </div>
      <div className="mt-5">{body(step, monthly, shares, preferences, onMonthly, onShares, onPreferences)}</div>
      <p className="mt-4 text-sm text-muted">
        So far, {cad(total)} a month, about {cad(total * 12)} a year.
      </p>
      <div className="mt-5 flex gap-3">
        <button type="button" className="rounded-full px-4 py-2 font-semibold text-navy" onClick={() => onStep(Math.max(0, step - 1))} disabled={step === 0}>
          Back
        </button>
        {step < 5 ? (
          <button type="button" className="rounded-full bg-navy px-5 py-2 font-semibold text-white" onClick={() => onStep(step + 1)}>
            Next
          </button>
        ) : (
          <button type="button" className="rounded-full bg-navy px-5 py-2 font-semibold text-white" onClick={onDone} data-testid="see-cards">
            See my cards
          </button>
        )}
      </div>
    </div>
  );
}

function body(
  step: number,
  monthly: MonthlySpend,
  shares: SpendShares,
  preferences: Preferences,
  onMonthly: (category: Category, value: number) => void,
  onShares: (shares: SpendShares) => void,
  onPreferences: (partial: Partial<Preferences>) => void,
) {
  if (step === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-navy">How much do you spend on groceries?</h2>
        <MoneyField label="Grocery stores" hint="A regular supermarket. Costco and Walmart are the next choice, because RBC does not pay the grocery rate there." value={monthly.groceries} onChange={(value) => onMonthly("groceries", value)} />
        <MoneyField label="Costco and Walmart" value={monthly.warehouse} onChange={(value) => onMonthly("warehouse", value)} />
        <p className="text-sm font-semibold text-navy">Where are the groceries?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["Regular store", 0, 0],
            ["Metro, Food Basics, or Super C", 1, 0],
            ["Save-On-Foods or a More Rewards partner", 0, 1],
          ].map(([label, moi, more]) => (
            <button
              key={String(label)}
              type="button"
              aria-pressed={shares.moiGroceryShare === moi && shares.moreGroceryShare === more}
              className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold ${shares.moiGroceryShare === moi && shares.moreGroceryShare === more ? "border-navy bg-navy text-white" : "border-line bg-white text-navy"}`}
              onClick={() => onShares({ ...shares, moiGroceryShare: Number(moi), moreGroceryShare: Number(more) })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-navy">Eating out and takeout</h2>
        <p className="mt-2 text-sm text-muted">Restaurants, coffee, and delivery. Delivery apps only earn a dining bonus when the merchant’s category code matches.</p>
        <div className="mt-4">
          <MoneyField label="Dining and takeout" value={monthly.dining} onChange={(value) => onMonthly("dining", value)} />
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-navy">Getting around</h2>
        <div className="mt-4 grid gap-3">
          {(["gas", "ev_charging", "transit", "rideshare"] as Category[]).map((category) => (
            <MoneyField compact key={category} label={labels[category]} value={monthly[category]} onChange={(value) => onMonthly(category, value)} />
          ))}
        </div>
      </div>
    );
  }
  if (step === 3) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-navy">Travel</h2>
        <div className="mt-4">
          <MoneyField label="Flights, hotels, and vacations" value={monthly.travel} onChange={(value) => onMonthly("travel", value)} />
        </div>
        <p className="mt-4 text-sm font-semibold text-navy">How much of that is WestJet or Sunwing?</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            ["None", 0],
            ["Some", 0.4],
            ["Most", 0.8],
          ].map(([label, share]) => (
            <button
              key={String(label)}
              type="button"
              aria-pressed={shares.westjetTravelShare === share}
              className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${shares.westjetTravelShare === share ? "border-navy bg-navy text-white" : "border-line bg-white"}`}
              onClick={() => onShares({ ...shares, westjetTravelShare: Number(share) })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (step === 4) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-navy">The rest of the month</h2>
        <div className="mt-4 grid gap-3">
          {(["streaming", "gaming", "bills", "other"] as Category[]).map((category) => (
            <MoneyField compact key={category} label={labels[category]} hint={category === "streaming" ? "Keep streaming separate from phone, hydro, and other bills." : undefined} value={monthly[category]} onChange={(value) => onMonthly(category, value)} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-2xl font-semibold text-navy">What should the comparison respect?</h2>
      <PreferenceFields preferences={preferences} onPreferences={onPreferences} />
    </div>
  );
}

export function PreferenceFields({
  preferences,
  onPreferences,
}: {
  preferences: Preferences;
  onPreferences: (partial: Partial<Preferences>) => void;
}) {
  return (
    <div className="mt-4 space-y-5">
      <div>
        <p className="font-semibold text-navy">What do you want back?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            ["either", "Compare all"],
            ["cash", "Cash back"],
            ["everyday", "Everyday points"],
            ["travel", "Travel points"],
          ].map(([id, label]) => (
            <button key={id} type="button" data-testid={`focus-${id}`} aria-pressed={preferences.rewardFocus === id} className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${preferences.rewardFocus === id ? "border-navy bg-navy text-white" : "border-line bg-white"}`} onClick={() => onPreferences({ rewardFocus: id as Preferences["rewardFocus"] })}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="font-semibold text-navy">Annual fee</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" data-testid="fee-none" aria-pressed={preferences.feeMode === "no_fee"} className={chip(preferences.feeMode === "no_fee")} onClick={() => onPreferences({ feeMode: "no_fee", maxAnnualFee: 0 })}>No annual fee</button>
          <button type="button" aria-pressed={preferences.feeMode === "max_fee" && preferences.maxAnnualFee === 50} className={chip(preferences.feeMode === "max_fee" && preferences.maxAnnualFee === 50)} onClick={() => onPreferences({ feeMode: "max_fee", maxAnnualFee: 50 })}>Up to $50</button>
          <button type="button" aria-pressed={preferences.feeMode === "max_fee" && preferences.maxAnnualFee === 150} className={chip(preferences.feeMode === "max_fee" && preferences.maxAnnualFee === 150)} onClick={() => onPreferences({ feeMode: "max_fee", maxAnnualFee: 150 })}>Up to $150</button>
          <button type="button" aria-pressed={preferences.feeMode === "max_fee" && preferences.maxAnnualFee === 400} className={chip(preferences.feeMode === "max_fee" && preferences.maxAnnualFee === 400)} onClick={() => onPreferences({ feeMode: "max_fee", maxAnnualFee: 400 })}>Up to $400</button>
          <button type="button" className={`${chip(preferences.feeMode === "only_if_worth_more")} col-span-2`} aria-pressed={preferences.feeMode === "only_if_worth_more"} onClick={() => onPreferences({ feeMode: "only_if_worth_more", maxAnnualFee: null })}>Only if the card is still ahead after the fee</button>
        </div>
      </div>
      <div>
        <p className="font-semibold text-navy">Do you pay the card off?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className={chip(preferences.paysInFull)} aria-pressed={preferences.paysInFull} onClick={() => onPreferences({ paysInFull: true, averageBalance: null })}>I pay in full</button>
          <button type="button" className={chip(!preferences.paysInFull)} aria-pressed={!preferences.paysInFull} onClick={() => onPreferences({ paysInFull: false })}>I carry a balance</button>
        </div>
        {!preferences.paysInFull ? (
          <label className="mt-3 block text-sm text-muted">
            Average purchase balance, if you know it
            <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" type="number" min={0} placeholder="Leave blank if you are not sure" value={preferences.averageBalance ?? ""} onChange={(event) => onPreferences({ averageBalance: event.target.value === "" ? null : Number(event.target.value) })} />
          </label>
        ) : null}
      </div>
      <details className="rounded-2xl border border-line bg-white p-4">
        <summary className="cursor-pointer font-semibold text-navy">Optional details</summary>
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-muted">Leave income blank if you prefer not to say. Blank is not treated as $0.</p>
          <label className="block">Personal income
            <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" type="number" min={0} value={preferences.personalIncome ?? ""} onChange={(event) => onPreferences({ personalIncome: event.target.value === "" ? null : Number(event.target.value) })} />
          </label>
          <label className="block">Household income
            <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" type="number" min={0} value={preferences.householdIncome ?? ""} onChange={(event) => onPreferences({ householdIncome: event.target.value === "" ? null : Number(event.target.value) })} />
          </label>
          <label className="block">Credit score, optional
            <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" type="number" min={300} max={900} placeholder="Not used to predict approval" value={preferences.creditScore ?? ""} onChange={(event) => onPreferences({ creditScore: event.target.value === "" ? null : Number(event.target.value) })} />
          </label>
          <label className="flex gap-2"><input type="checkbox" checked={preferences.studentOrNewcomer} onChange={(event) => onPreferences({ studentOrNewcomer: event.target.checked })} /> Student or newcomer</label>
          <label className="flex gap-2"><input type="checkbox" checked={preferences.vipBanking} onChange={(event) => onPreferences({ vipBanking: event.target.checked })} /> I have RBC VIP Banking</label>
          <label className="flex gap-2"><input type="checkbox" checked={preferences.includeWelcome} onChange={(event) => onPreferences({ includeWelcome: event.target.checked })} /> Include current welcome offers in the first-year figure</label>
        </div>
      </details>
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-2xl border px-3 py-3 text-sm font-semibold ${active ? "border-navy bg-navy text-white" : "border-line bg-white text-navy"}`;
}

export { labels };
