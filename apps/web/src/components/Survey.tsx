"use client";

import { cad, sumSpend, type Category, type MonthlySpend, type Preferences, type SpendShares } from "@cardfit/engine";
import type { ReactNode } from "react";
import { labels } from "../lib/labels";
import { Icon } from "./icons";
import { BandPicker, SliderRow, type Band } from "./money-field";
import { Button, Chip, OptionTile } from "./ui";

export const QUIZ_STEPS = 8;

const groceryBands: Band[] = [
  { label: "None", value: 0 },
  { label: "Under $200", value: 120 },
  { label: "$200 to $400", value: 300 },
  { label: "$400 to $700", value: 550 },
  { label: "$700 to $1,000", value: 850 },
  { label: "Over $1,000", value: 1200 },
];

const diningBands: Band[] = [
  { label: "None", value: 0 },
  { label: "Under $100", value: 60 },
  { label: "$100 to $250", value: 175 },
  { label: "$250 to $450", value: 350 },
  { label: "$450 to $700", value: 575 },
  { label: "Over $700", value: 900 },
];

const travelBands: Band[] = [
  { label: "None", value: 0 },
  { label: "Under $100", value: 50 },
  { label: "$100 to $250", value: 175 },
  { label: "$250 to $500", value: 375 },
  { label: "$500 to $1,000", value: 750 },
  { label: "Over $1,000", value: 1300 },
];

interface QuizProps {
  step: number;
  monthly: MonthlySpend;
  shares: SpendShares;
  preferences: Preferences;
  onMonthly: (category: Category, value: number) => void;
  onShares: (shares: SpendShares) => void;
  onPreferences: (partial: Partial<Preferences>) => void;
  onStep: (step: number) => void;
  onDone: () => void;
  onExit: () => void;
}

export function Survey(props: QuizProps) {
  const { step, monthly, onStep, onDone, onExit } = props;
  const total = sumSpend(monthly);
  const last = step === QUIZ_STEPS - 1;
  const screen = screens[step];

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-16 pt-6">
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={() => (step === 0 ? onExit() : onStep(step - 1))} className="inline-flex items-center gap-1.5 font-semibold text-rbc hover:underline">
          <Icon.ArrowLeft size={18} /> {step === 0 ? "Home" : "Back"}
        </button>
        <span className="font-medium text-muted">
          Step {step + 1} of {QUIZ_STEPS}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={QUIZ_STEPS} aria-valuenow={step + 1} aria-label="Quiz progress">
        <div className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out" style={{ width: `${((step + 1) / QUIZ_STEPS) * 100}%` }} />
      </div>

      <div key={step} className="rise mt-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky text-rbc">{screen.icon}</span>
        <h1 className="mt-5 text-[1.75rem] font-semibold leading-tight text-ink md:text-[2.125rem]">{screen.title}</h1>
        {screen.help ? <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">{screen.help}</p> : null}
        <div className="mt-7">{screen.body(props)}</div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="text-sm text-muted">
          {step < 5 ? (
            <>
              So far <span className="font-semibold text-ink tabular">{cad(total)}</span> a month
            </>
          ) : (
            <>
              <span className="font-semibold text-ink tabular">{cad(total)}</span> a month, about <span className="tabular">{cad(total * 12)}</span> a year
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          {last ? (
            <Button size="lg" onClick={onDone} data-testid="see-cards">
              See my cards
            </Button>
          ) : (
            <Button size="lg" onClick={() => onStep(step + 1)}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface Screen {
  icon: ReactNode;
  title: string;
  help?: string;
  body: (props: QuizProps) => ReactNode;
}

const screens: Screen[] = [
  {
    icon: <Icon.Cart size={26} />,
    title: "How much do you spend on groceries in a typical month?",
    help: "Supermarkets only. Costco and Walmart are counted separately below, because RBC does not pay the grocery rate there.",
    body: ({ monthly, shares, onMonthly, onShares }) => (
      <div className="space-y-8">
        <BandPicker name="Groceries" bands={groceryBands} value={monthly.groceries} onChange={(value) => onMonthly("groceries", value)} />
        <div>
          <p className="font-semibold text-ink">Where do you usually shop?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["A regular supermarket", 0, 0],
              ["Metro, Food Basics, or Super C", 1, 0],
              ["Save-On-Foods or a More Rewards partner", 0, 1],
            ].map(([label, moi, more]) => (
              <Chip
                key={String(label)}
                active={shares.moiGroceryShare === moi && shares.moreGroceryShare === more}
                onClick={() => onShares({ ...shares, moiGroceryShare: Number(moi), moreGroceryShare: Number(more) })}
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>
        <SliderRow label="Costco and Walmart" hint="Counted separately from groceries" icon={<Icon.Warehouse size={22} />} value={monthly.warehouse} max={1000} step={10} onChange={(value) => onMonthly("warehouse", value)} />
      </div>
    ),
  },
  {
    icon: <Icon.Dining size={26} />,
    title: "And on eating out, coffee, and takeout?",
    help: "Restaurants, cafés, and delivery. Delivery apps only earn a dining rate when the merchant is coded as a restaurant.",
    body: ({ monthly, onMonthly }) => <BandPicker name="Dining" bands={diningBands} value={monthly.dining} onChange={(value) => onMonthly("dining", value)} />,
  },
  {
    icon: <Icon.Car size={26} />,
    title: "How do you get around?",
    help: "Slide each one to a typical month. Leave anything you do not use at zero.",
    body: ({ monthly, onMonthly }) => (
      <div className="grid gap-3">
        <SliderRow label={labels.gas} icon={<Icon.Fuel size={22} />} value={monthly.gas} max={600} onChange={(value) => onMonthly("gas", value)} />
        <SliderRow label={labels.ev_charging} icon={<Icon.Plug size={22} />} value={monthly.ev_charging} max={300} onChange={(value) => onMonthly("ev_charging", value)} />
        <SliderRow label={labels.transit} icon={<Icon.Transit size={22} />} value={monthly.transit} max={300} onChange={(value) => onMonthly("transit", value)} />
        <SliderRow label={labels.rideshare} icon={<Icon.Car size={22} />} value={monthly.rideshare} max={400} onChange={(value) => onMonthly("rideshare", value)} />
      </div>
    ),
  },
  {
    icon: <Icon.Plane size={26} />,
    title: "How much goes to travel, averaged over a month?",
    help: "Flights, hotels, and packages. Think of a whole year and divide by twelve.",
    body: ({ monthly, shares, onMonthly, onShares }) => (
      <div className="space-y-8">
        <BandPicker name="Travel" bands={travelBands} value={monthly.travel} onChange={(value) => onMonthly("travel", value)} />
        {monthly.travel > 0 ? (
          <div>
            <p className="font-semibold text-ink">How much of that is WestJet or Sunwing?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["None", 0],
                ["Some", 0.4],
                ["Most", 0.8],
              ].map(([label, share]) => (
                <Chip key={String(label)} active={shares.westjetTravelShare === share} onClick={() => onShares({ ...shares, westjetTravelShare: Number(share) })}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    ),
  },
  {
    icon: <Icon.Receipt size={26} />,
    title: "What about subscriptions, bills, and everything else?",
    help: "Keep streaming separate from phone, hydro, and other bills; some cards pay a higher rate on it.",
    body: ({ monthly, onMonthly }) => (
      <div className="grid gap-3">
        <SliderRow label={labels.streaming} icon={<Icon.Screen size={22} />} value={monthly.streaming} max={150} onChange={(value) => onMonthly("streaming", value)} />
        <SliderRow label={labels.gaming} icon={<Icon.Gamepad size={22} />} value={monthly.gaming} max={200} onChange={(value) => onMonthly("gaming", value)} />
        <SliderRow label={labels.bills} hint="Phone, internet, utilities, insurance" icon={<Icon.Receipt size={22} />} value={monthly.bills} max={800} step={10} onChange={(value) => onMonthly("bills", value)} />
        <SliderRow label={labels.other} hint="Shopping, pharmacy, everything not listed" icon={<Icon.Bag size={22} />} value={monthly.other} max={1500} step={10} onChange={(value) => onMonthly("other", value)} />
      </div>
    ),
  },
  {
    icon: <Icon.Tag size={26} />,
    title: "How do you feel about an annual fee?",
    help: "Fee cards often earn more. The last option keeps them in only when they still come out ahead after the fee.",
    body: ({ preferences, onPreferences }) => <FeeTiles preferences={preferences} onPreferences={onPreferences} />,
  },
  {
    icon: <Icon.Coins size={26} />,
    title: "What would you rather get back?",
    body: ({ preferences, onPreferences }) => (
      <div className="space-y-8">
        <FocusTiles preferences={preferences} onPreferences={onPreferences} />
        <BalanceQuestion preferences={preferences} onPreferences={onPreferences} />
      </div>
    ),
  },
  {
    icon: <Icon.Question size={26} />,
    title: "Last one, and all of it is optional.",
    help: "Some premium cards publish an income minimum. Blank means unknown, never zero, and a credit score is only echoed back; CardFit does not predict approval.",
    body: ({ preferences, onPreferences }) => <AboutYou preferences={preferences} onPreferences={onPreferences} />,
  },
];

function FeeTiles({ preferences, onPreferences }: { preferences: Preferences; onPreferences: (partial: Partial<Preferences>) => void }) {
  const is = (mode: Preferences["feeMode"], max?: number) => preferences.feeMode === mode && (max === undefined || preferences.maxAnnualFee === max);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <OptionTile testId="fee-none" active={is("no_fee")} title="No annual fee" caption="Only cards with a $0 fee" onClick={() => onPreferences({ feeMode: "no_fee", maxAnnualFee: 0 })} />
      <OptionTile active={is("max_fee", 150)} title="Up to $150 a year" caption="Most mid-tier cards" onClick={() => onPreferences({ feeMode: "max_fee", maxAnnualFee: 150 })} />
      <OptionTile active={is("max_fee", 400)} title="Up to $400 a year" caption="Includes the premium cards" onClick={() => onPreferences({ feeMode: "max_fee", maxAnnualFee: 400 })} />
      <OptionTile
        active={is("only_if_worth_more")}
        title="Only if it earns more than it costs"
        caption="Fee cards stay in when they are still ahead after the fee"
        onClick={() => onPreferences({ feeMode: "only_if_worth_more", maxAnnualFee: null })}
      />
    </div>
  );
}

function FocusTiles({ preferences, onPreferences }: { preferences: Preferences; onPreferences: (partial: Partial<Preferences>) => void }) {
  const options: { id: Preferences["rewardFocus"]; title: string; caption: string; icon: ReactNode }[] = [
    { id: "either", title: "Show me everything", caption: "Rank every card by estimated value", icon: <Icon.Star size={26} /> },
    { id: "cash", title: "Cash back", caption: "Money off the statement", icon: <Icon.Coins size={26} /> },
    { id: "travel", title: "Travel rewards", caption: "Avion, WestJet, Avios", icon: <Icon.Plane size={26} /> },
    { id: "everyday", title: "Everyday points", caption: "ION, Moi, More Rewards", icon: <Icon.Bag size={26} /> },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <OptionTile
          key={option.id}
          testId={`focus-${option.id}`}
          active={preferences.rewardFocus === option.id}
          icon={option.icon}
          title={option.title}
          caption={option.caption}
          onClick={() => onPreferences({ rewardFocus: option.id })}
        />
      ))}
    </div>
  );
}

function BalanceQuestion({ preferences, onPreferences }: { preferences: Preferences; onPreferences: (partial: Partial<Preferences>) => void }) {
  return (
    <div>
      <p className="font-semibold text-ink">Do you usually pay the balance in full?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={preferences.paysInFull} onClick={() => onPreferences({ paysInFull: true, averageBalance: null })}>
          Yes, every month
        </Chip>
        <Chip active={!preferences.paysInFull} onClick={() => onPreferences({ paysInFull: false })}>
          No, I carry a balance
        </Chip>
      </div>
      {!preferences.paysInFull ? (
        <div className="mt-4">
          <SliderRow
            label="Average balance carried"
            hint="Leave at zero if you are not sure; interest is then left out of the ranking"
            icon={<Icon.Wallet size={22} />}
            value={preferences.averageBalance ?? 0}
            max={10000}
            step={100}
            onChange={(value) => onPreferences({ averageBalance: value === 0 ? null : value })}
          />
        </div>
      ) : null}
    </div>
  );
}

const scoreBands: { label: string; value: number | null }[] = [
  { label: "Prefer not to say", value: null },
  { label: "Under 660", value: 640 },
  { label: "660 to 724", value: 690 },
  { label: "725 to 759", value: 740 },
  { label: "760 or higher", value: 780 },
];

function AboutYou({ preferences, onPreferences }: { preferences: Preferences; onPreferences: (partial: Partial<Preferences>) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-semibold text-ink">Credit score</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {scoreBands.map((band) => (
            <Chip key={band.label} active={preferences.creditScore === band.value} onClick={() => onPreferences({ creditScore: band.value })}>
              {band.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyInput label="Personal income a year" value={preferences.personalIncome} onChange={(value) => onPreferences({ personalIncome: value })} />
        <MoneyInput label="Household income a year" value={preferences.householdIncome} onChange={(value) => onPreferences({ householdIncome: value })} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Toggle checked={preferences.studentOrNewcomer} onChange={(value) => onPreferences({ studentOrNewcomer: value })} label="Student or newcomer" />
        <Toggle checked={preferences.vipBanking} onChange={(value) => onPreferences({ vipBanking: value })} label="I have RBC VIP Banking" />
        <Toggle checked={preferences.includeWelcome} onChange={(value) => onPreferences({ includeWelcome: value })} label="Count welcome offers in the first-year figure" />
      </div>
    </div>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <span className="relative mt-1.5 block">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
        <input
          className="w-full pl-7 tabular"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Optional"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        />
      </span>
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${checked ? "border-rbc bg-sky" : "border-line bg-white hover:border-rbc/50"}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/** Compact preference controls used by the full editor. */
export function PreferenceFields({ preferences, onPreferences }: { preferences: Preferences; onPreferences: (partial: Partial<Preferences>) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-semibold text-ink">What would you rather get back?</p>
        <div className="mt-3">
          <FocusTiles preferences={preferences} onPreferences={onPreferences} />
        </div>
      </div>
      <div>
        <p className="font-semibold text-ink">Annual fee</p>
        <div className="mt-3">
          <FeeTiles preferences={preferences} onPreferences={onPreferences} />
        </div>
      </div>
      <BalanceQuestion preferences={preferences} onPreferences={onPreferences} />
      <div>
        <p className="font-semibold text-ink">About you, optional</p>
        <div className="mt-3">
          <AboutYou preferences={preferences} onPreferences={onPreferences} />
        </div>
      </div>
    </div>
  );
}

export { labels };
