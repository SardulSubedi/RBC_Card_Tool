"use client";

import {
  breakEven,
  cad,
  catalog,
  sensitivity,
  type CardProduct,
  type Preferences,
  type ProfileInput,
  type RankedCard,
  type RecommendationResult,
} from "@cardfit/engine";
import { useState, type ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { assetUrl, cardFacts } from "../lib/card-facts";
import { labels } from "../lib/labels";
import { Icon } from "./icons";
import { Button, Chevron, Disclosure, Panel } from "./ui";

const lineColors = ["#0051a5", "#e3a81b", "#53627a"];

export function Results({
  result,
  profile,
  banner,
  onPreferences,
}: {
  result: RecommendationResult;
  profile: ProfileInput;
  banner?: string | null;
  onPreferences: (partial: Partial<Preferences>) => void;
}) {
  const winner = result.ranked[0];
  const others = result.ranked.slice(1, 4);
  const unrankedCount = result.conditional.length + result.insufficient.length + result.interestOnly.length;

  return (
    <section id="results" className="space-y-8" aria-live="polite">
      {banner ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-sky px-4 py-1.5 text-sm font-semibold text-deep">
          <Icon.Shield size={16} /> {banner}
        </p>
      ) : null}

      {result.emptyReason ? (
        <Panel className="p-6 md:p-8" >
          <div data-testid="empty-state">
            <h2 className="text-2xl font-semibold text-ink">No card fits those limits</h2>
            <p className="mt-2 max-w-xl leading-7 text-muted">{result.emptyReason}</p>
            <Button className="mt-5" onClick={() => onPreferences({ feeMode: "max_fee", maxAnnualFee: 400, rewardFocus: "either" })}>
              Widen the comparison
            </Button>
          </div>
        </Panel>
      ) : null}

      {result.nearTie && winner ? <Notice>These cards are close. A gap under {cad(result.nearTieCad)} a year is treated as a near tie, not a decisive winner.</Notice> : null}
      {result.interestExcludedFromRanking ? <Notice>You carry a balance, but no balance was entered, so interest is left out of the ranking. The low-rate card is listed separately below.</Notice> : null}

      {winner ? <Winner item={winner} nearTie={result.nearTie} /> : null}

      {others.length ? <RunnersUp winner={winner} others={others} /> : null}

      {result.ranked.length ? (
        <div className="space-y-3">
          <WhatIf result={result} profile={profile} />
          <Disclosure title="Compare side by side">
            <Comparison rows={[...result.ranked.slice(0, 6), ...result.interestOnly.slice(0, 1)]} />
          </Disclosure>
          <Disclosure title="How points are valued">
            <PointValue profile={profile} onPreferences={onPreferences} />
          </Disclosure>
          {unrankedCount ? (
            <Disclosure title={`Cards not in the ranking (${unrankedCount})`}>
              <Unranked result={result} />
            </Disclosure>
          ) : null}
        </div>
      ) : result.interestOnly.length ? (
        <Panel className="p-5">
          <Unranked result={result} />
        </Panel>
      ) : null}

      <p className="text-sm leading-6 text-muted">
        Compared as of {result.comparisonDate} with catalog {result.catalogVersion}. Welcome offers stay out of the ranking unless you turned them on.
        {profile.preferences.creditScore != null ? ` You shared a credit score band; RBC does not publish a score cutoff for these cards and CardFit does not predict approval.` : ""}
      </p>
    </section>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-2xl bg-sky px-4 py-3 text-sm leading-6 text-deep">
      <Icon.Question size={20} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function Winner({ item, nearTie }: { item: RankedCard; nearTie: boolean }) {
  const facts = cardFacts(item.card);
  const projection = item.projection;
  const negative = (projection.ongoingNetCad ?? 0) < 0;
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_50px_-30px_rgba(0,45,100,0.45)]" data-testid="winner">
      <div className="flex items-center gap-2 bg-deep px-6 py-2.5 text-sm font-semibold text-white">
        <Icon.Star size={18} className="text-gold" />
        {negative ? "Lowest net cost for your spending" : nearTie ? "Best estimate, in a near tie" : "Best match for your spending"}
      </div>
      <div className="grid gap-6 p-6 md:grid-cols-[260px_1fr] md:gap-8 md:p-8">
        <div>
          <CardPhoto card={item.card} large />
          <p className="mt-3 text-sm text-muted">
            {facts.family} <span aria-hidden className="mx-1 text-gold">•</span> {facts.fee}
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold leading-tight text-ink md:text-[1.75rem]" data-testid="winner-name">
            {item.card.name}
          </h2>
          <p className="mt-3 text-[2.75rem] font-semibold leading-none tabular text-rbc md:text-[3.25rem]" data-testid="winner-value">
            {cad(projection.ongoingNetCad)}
          </p>
          <p className="mt-2 text-[15px] text-muted">
            {negative ? "estimated net cost a year, including" : "estimated value a year, after"} the {cad(projection.applicableFeeCad)} fee
            {projection.interestCad != null ? ` and about ${cad(projection.interestCad)} of interest` : ""}
          </p>

          <ul className="mt-6 space-y-2.5 text-[15px] leading-6 text-ink">
            {item.explanations.map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky px-3 py-1.5 text-sm font-medium text-deep">
            <Icon.Check size={16} className="text-good" />
            {item.requirementDetail}
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5 text-sm">
            <Stat label="Rewards" value={cad(projection.rewardValueCad)} />
            <Stat label="Annual fee" value={`− ${cad(projection.applicableFeeCad)}`} />
            <Stat label={projection.interestCad != null ? "Interest" : "First year"} value={projection.interestCad != null ? `− ${cad(projection.interestCad)}` : cad(projection.firstYearNetCad)} hint={projection.interestCad == null && projection.welcomeCad ? "with welcome offer" : undefined} />
          </dl>
          {projection.pointsEarned ? (
            <p className="mt-3 text-sm text-muted">
              {projection.pointsEarned.toLocaleString("en-CA")} points a year, valued as {projection.valuationLabel.toLowerCase()}.
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a className="inline-flex items-center gap-1.5 font-semibold text-rbc hover:underline" href={item.card.productUrl} target="_blank" rel="noreferrer">
              RBC product page
            </a>
          </div>
        </div>
      </div>
      <details className="group border-t border-line">
        <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-semibold text-ink md:px-8">
          How this was calculated
          <Chevron className="h-5 w-5 text-rbc transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <div className="space-y-4 px-6 pb-6 text-sm md:px-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <caption className="sr-only">Reward contribution by category</caption>
              <thead>
                <tr className="text-muted">
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">A year of spending</th>
                  <th className="py-2 pr-3 font-medium">Rate</th>
                  <th className="py-2 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {projection.categories.map((line) => (
                  <tr key={line.category} className="border-t border-line">
                    <td className="py-2 pr-3">{labels[line.category]}</td>
                    <td className="py-2 pr-3 tabular">{cad(line.annualSpendCad)}</td>
                    <td className="py-2 pr-3">{line.rateLabel}</td>
                    <td className="py-2 text-right font-semibold tabular">{cad(line.rewardCad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-1.5 leading-6 text-muted">
            {projection.assumptions.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {projection.welcomeNotes.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {projection.benefits.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {item.card.rewardsAssumption ? <li>{item.card.rewardsAssumption}</li> : null}
            <li>{projection.valuationLabel}. {projection.restrictions[0]}</li>
          </ul>
          <p className="text-muted">Terms verified {facts.verified}. Additional card fees are shown by the issuer and are not subtracted here.</p>
        </div>
      </details>
    </article>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold tabular text-ink">{value}</dd>
      {hint ? <dd className="text-xs text-muted">{hint}</dd> : null}
    </div>
  );
}

function RunnersUp({ winner, others }: { winner: RankedCard; others: RankedCard[] }) {
  const top = Math.max(1, ...[winner, ...others].map((item) => item.projection.ongoingNetCad ?? 0));
  return (
    <div>
      <h3 className="text-lg font-semibold text-ink">Also worth a look</h3>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
        {others.map((item) => {
          const value = item.projection.ongoingNetCad ?? 0;
          const facts = cardFacts(item.card);
          const gap = (winner.projection.ongoingNetCad ?? 0) - value;
          return (
            <li key={item.card.id} className="flex items-center gap-4 px-4 py-3.5 md:px-5">
              <div className="w-20 shrink-0 md:w-24">
                <CardPhoto card={item.card} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-semibold text-ink">{item.card.name}</p>
                  <p className="shrink-0 font-semibold tabular text-ink">{cad(value)}</p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sky">
                  <div className="h-full rounded-full bg-rbc" style={{ width: `${Math.max(0, Math.min(100, (value / top) * 100))}%` }} />
                </div>
                <p className="mt-1.5 truncate text-sm text-muted">
                  {facts.fee}
                  <span aria-hidden className="mx-1.5 text-gold">•</span>
                  {gap > 0 ? `${cad(gap)} behind a year` : "level with the best match"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WhatIf({ result, profile }: { result: RecommendationResult; profile: ProfileInput }) {
  const [open, setOpen] = useState(false);
  const winner = result.ranked[0];
  const cards = result.ranked.slice(0, 3).map((item) => item.card.id);
  return (
    <div className="rounded-2xl border border-line bg-white open:shadow-sm">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-semibold text-ink">
        <span>What if my spending changes?</span>
        <Chevron className={`h-5 w-5 shrink-0 text-rbc transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <WhatIfBody profile={profile} cards={cards} winner={winner} ranked={result.ranked} /> : null}
    </div>
  );
}

function WhatIfBody({ profile, cards, winner, ranked }: { profile: ProfileInput; cards: string[]; winner: RankedCard; ranked: RankedCard[] }) {
  const scales = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const points = sensitivity(catalog, profile, cards, scales);
  const rows = points.map((point) => ({
    spend: `${Math.round(point.scale * 100)}%`,
    monthly: point.monthlyTotalCad,
    ...Object.fromEntries(cards.map((id) => [nameOf(id), point.values[id]])),
  }));
  const noFee = ranked.find((item) => item.card.id !== winner.card.id && item.projection.applicableFeeCad === 0);
  const rival = winner.projection.applicableFeeCad > 0 ? noFee ?? ranked[1] : ranked[1];
  const crossing = rival ? breakEven(catalog, profile, winner.card.id, rival.card.id) : null;

  return (
    <div className="rise border-t border-line px-5 py-5">
      <p className="text-sm leading-6 text-muted">
        Your category mix and point values stay the same; only the total scales. This is a scenario check, not a confidence interval.
      </p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e4eaf2" vertical={false} />
            <XAxis dataKey="spend" tickLine={false} axisLine={{ stroke: "#d6dfeb" }} tick={{ fill: "#53627a", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#53627a", fontSize: 12 }} tickFormatter={(value: number) => `$${value}`} width={56} />
            <Tooltip
              formatter={(value) => (typeof value === "number" ? cad(value) : String(value))}
              labelFormatter={(label) => `${label} of today's spending`}
              contentStyle={{ borderRadius: 12, borderColor: "#d6dfeb", fontSize: 13 }}
            />
            {cards.map((id, index) => (
              <Line key={id} type="monotone" dataKey={nameOf(id)} stroke={lineColors[index]} strokeWidth={index === 0 ? 3 : 2} dot={false} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {cards.map((id, index) => (
          <li key={id} className="flex items-center gap-2 text-muted">
            <span aria-hidden className="h-0.5 w-5 rounded-full" style={{ background: lineColors[index] }} />
            {nameOf(id)}
          </li>
        ))}
      </ul>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <caption className="sr-only">Ongoing value at different spending levels</caption>
          <thead>
            <tr className="text-muted">
              <th className="py-2 pr-3 font-medium">Spending</th>
              {cards.map((id) => (
                <th key={id} className="py-2 pr-3 text-right font-medium">
                  {nameOf(id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.scale} className={`border-t border-line ${point.scale === 1 ? "bg-sky/60 font-semibold" : ""}`}>
                <td className="py-2 pr-3 tabular">
                  {Math.round(point.scale * 100)}% <span className="font-normal text-muted">({cad(point.monthlyTotalCad)} a month)</span>
                </td>
                {cards.map((id) => (
                  <td key={id} className="py-2 pr-3 text-right tabular">
                    {cad(point.values[id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {crossing && rival ? <p className="mt-4 text-sm leading-6 text-muted">{crossingText(crossing, winner, rival)}</p> : null}
    </div>
  );
}

function Comparison({ rows }: { rows: RankedCard[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="text-muted">
            <th className="py-2 pr-3 font-medium">Card</th>
            {["Ongoing value", "Rewards", "Fee", "Interest", "First year"].map((heading) => (
              <th key={heading} className="py-2 pr-3 text-right font-medium">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={item.card.id} className={`border-t border-line ${index === 0 ? "font-semibold" : ""}`}>
              <td className="py-2.5 pr-3 text-ink">{item.card.name}</td>
              <td className="py-2.5 pr-3 text-right tabular">{cad(item.projection.ongoingNetCad)}</td>
              <td className="py-2.5 pr-3 text-right tabular">{cad(item.projection.rewardValueCad)}</td>
              <td className="py-2.5 pr-3 text-right tabular">{cad(item.projection.applicableFeeCad)}</td>
              <td className="py-2.5 pr-3 text-right tabular">{item.projection.interestCad == null ? "—" : cad(item.projection.interestCad)}</td>
              <td className="py-2.5 pr-3 text-right tabular">{cad(item.projection.firstYearNetCad)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm text-muted">First year adds the modelled welcome offer where RBC publishes one. Ongoing value does not.</p>
    </div>
  );
}

function PointValue({ profile, onPreferences }: { profile: ProfileInput; onPreferences: (partial: Partial<Preferences>) => void }) {
  const custom = profile.preferences.customCentsPerPoint;
  const value = custom ?? 1;
  return (
    <div className="text-sm">
      <p className="leading-6 text-muted">
        Cash back is always face value. Points use the rate RBC publishes or illustrates for each program until you set your own. Avios have no published rate, so that card is not ranked unless you value it yourself.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" aria-pressed={custom == null} className={toggleClass(custom == null)} onClick={() => onPreferences({ customCentsPerPoint: null, applyCustomToUnvalued: false })}>
          Use published rates
        </button>
        <button type="button" aria-pressed={custom != null} className={toggleClass(custom != null)} onClick={() => onPreferences({ customCentsPerPoint: value })}>
          Use my own figure
        </button>
      </div>
      {custom != null ? (
        <div className="mt-4 rounded-2xl border border-line px-4 py-3">
          <div className="flex items-center justify-between">
            <label htmlFor="cents-per-point" className="font-semibold text-ink">
              Cents per point
            </label>
            <span className="font-semibold tabular text-ink">{custom.toFixed(1)}¢</span>
          </div>
          <input
            id="cents-per-point"
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={custom}
            style={{ ["--fill" as string]: `${((custom - 0.5) / 2) * 100}%` }}
            onChange={(event) => onPreferences({ customCentsPerPoint: Number(event.target.value) })}
          />
          <label className="mt-2 flex items-center gap-2.5">
            <input type="checkbox" checked={profile.preferences.applyCustomToUnvalued} onChange={(event) => onPreferences({ applyCustomToUnvalued: event.target.checked })} />
            Also apply it to Avios, so the British Airways card can be ranked
          </label>
        </div>
      ) : null}
    </div>
  );
}

function toggleClass(active: boolean) {
  return `rounded-full border px-3.5 py-1.5 font-semibold transition-colors ${active ? "border-rbc bg-rbc text-white" : "border-line bg-white text-ink hover:border-rbc/50"}`;
}

function Unranked({ result }: { result: RecommendationResult }) {
  return (
    <div className="space-y-5 text-sm leading-6">
      {result.conditional.length ? (
        <div>
          <h4 className="font-semibold text-ink">Income not fully assessed</h4>
          <ul className="mt-2 space-y-2">
            {result.conditional.map((item) => (
              <li key={item.card.id}>
                <span className="font-semibold">{item.card.name}</span> <span className="text-muted">{item.requirementDetail} Estimated ongoing value {cad(item.projection.ongoingNetCad)}.</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.insufficient.length ? (
        <div>
          <h4 className="font-semibold text-ink">Insufficient verified data to rank</h4>
          <ul className="mt-2 space-y-2">
            {result.insufficient.map((item) => (
              <li key={item.card.id}>
                <span className="font-semibold">{item.card.name}</span>{" "}
                <span className="text-muted">
                  {item.excludeReason} {item.projection.pointsEarned ? `${item.projection.pointsEarned.toLocaleString("en-CA")} points are shown without a dollar value.` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.interestOnly.length ? (
        <div>
          <h4 className="font-semibold text-ink">Lower interest, no rewards in the ranking</h4>
          <ul className="mt-2 space-y-2">
            {result.interestOnly.map((item) => (
              <li key={item.card.id}>
                <span className="font-semibold">{item.card.name}</span>{" "}
                <span className="text-muted">
                  {item.card.termVersions.at(-1)?.aprLabel}. Annual fee {cad(item.projection.applicableFeeCad)}.
                  {item.projection.interestCad != null ? ` About ${cad(item.projection.interestCad)} of interest on your balance, for an ongoing figure of ${cad(item.projection.ongoingNetCad)}.` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function CardPhoto({ card, large = false }: { card: CardProduct; large?: boolean }) {
  if (!card.image) {
    return <div className={`flex aspect-[1.586/1] items-center justify-center rounded-xl bg-deep p-3 text-center font-semibold text-white ${large ? "text-base" : "text-[10px]"}`}>{card.name}</div>;
  }
  return <img src={assetUrl(card.image)} alt="" className={`aspect-[1.586/1] w-full rounded-xl object-cover ${large ? "shadow-[0_18px_30px_-18px_rgba(0,0,0,0.6)]" : ""}`} />;
}

function nameOf(id: string) {
  return catalog.cards.find((card) => card.id === id)?.name ?? id;
}

function crossingText(crossing: ReturnType<typeof breakEven>, winner: RankedCard, rival: RankedCard) {
  if (!crossing.crossings.length) return `${winner.card.name} stays ahead of ${rival.card.name} anywhere between zero and three times your current spending.`;
  const first = crossing.crossings[0];
  return `${winner.card.name} and ${rival.card.name} change places near ${cad(first.monthlyTotalCad)} of monthly spending, about ${Math.round(first.scale * 100)}% of today's total.`;
}
