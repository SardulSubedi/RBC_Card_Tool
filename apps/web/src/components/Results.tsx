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
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { labels } from "./Survey";

const lineColors = ["#002754", "#0051a5", "#a67c2d"];

export function Results({
  result,
  profile,
  example,
  banner,
  onPreferences,
}: {
  result: RecommendationResult;
  profile: ProfileInput;
  example: boolean;
  banner?: string | null;
  onPreferences: (partial: Partial<Preferences>) => void;
}) {
  const winner = result.ranked[0];
  const others = result.ranked.slice(1, 3);
  const scaleCards = result.ranked.slice(0, 3).map((item) => item.card.id);
  const points = sensitivity(catalog, profile, scaleCards, [0.5, 0.75, 1, 1.25, 1.5, 2]);
  const chartRows = points.map((point) => ({
    spend: `${Math.round(point.scale * 100)}%`,
    ...Object.fromEntries(scaleCards.map((id) => [nameOf(id), point.values[id]])),
  }));
  const noFee = result.ranked.find((item) => item.card.id !== winner?.card.id && item.projection.applicableFeeCad === 0);
  const rival = winner && winner.projection.applicableFeeCad > 0 ? noFee ?? result.ranked[1] : result.ranked[1];
  const crossing = winner && rival ? breakEven(catalog, profile, winner.card.id, rival.card.id) : null;

  return (
    <section id="results" className="space-y-4" aria-live="polite">
      {example ? <p className="inline-block rounded-full bg-[#f3e6c8] px-3 py-1 text-sm font-semibold text-navy">Example preview. This is not your spending.</p> : null}
      {banner ? <p className="inline-block rounded-full bg-[#f3e6c8] px-3 py-1 text-sm font-semibold text-navy">{banner}</p> : null}
      <p className="text-sm text-muted">Compared as of {result.comparisonDate}. Catalog {result.catalogVersion}.</p>
      {result.emptyReason ? (
        <div className="rounded-3xl border border-line bg-white p-6" data-testid="empty-state">
          <h2 className="text-2xl font-semibold text-navy">No card fits those limits</h2>
          <p className="mt-2 text-muted">{result.emptyReason}</p>
          <button type="button" className="mt-4 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white" onClick={() => onPreferences({ feeMode: "max_fee", maxAnnualFee: 400, rewardFocus: "either" })}>
            Widen the comparison
          </button>
        </div>
      ) : null}
      {result.nearTie && winner ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-navy">These cards are close. A gap under {cad(result.nearTieCad)} is treated as a near tie, not a decisive winner.</p>
      ) : null}
      {result.interestExcludedFromRanking ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm text-navy">You carry a balance, but no balance was entered. Rankings below leave interest out. The low-rate card is shown separately.</p>
      ) : null}
      {winner ? <WinnerCard item={winner} /> : null}
      <div className="grid gap-3">
        {others.map((item) => (
          <article key={item.card.id} className="flex gap-3 rounded-2xl border border-line bg-white p-3">
            <CardPhoto card={item.card} />
            <div>
              <p className="text-sm text-muted">Also worth a look</p>
              <h3 className="font-semibold text-navy">{item.card.name}</h3>
              <p className="tabular-nums">{cad(item.projection.ongoingNetCad)} a year</p>
            </div>
          </article>
        ))}
      </div>
      {result.conditional.length ? (
        <details className="rounded-2xl bg-white p-4">
          <summary className="cursor-pointer font-semibold text-navy">Income not fully assessed ({result.conditional.length})</summary>
          <ul className="mt-3 space-y-2 text-sm">
            {result.conditional.map((item) => (
              <li key={item.card.id}><span className="font-semibold">{item.card.name}</span> — {item.requirementDetail} Estimated ongoing value {cad(item.projection.ongoingNetCad)}.</li>
            ))}
          </ul>
        </details>
      ) : null}
      {result.insufficient.length ? (
        <details className="rounded-2xl bg-white p-4">
          <summary className="cursor-pointer font-semibold text-navy">Insufficient verified data to rank</summary>
          <ul className="mt-3 space-y-2 text-sm">
            {result.insufficient.map((item) => (
              <li key={item.card.id}><span className="font-semibold">{item.card.name}</span> — {item.excludeReason} {item.projection.pointsEarned ? `${item.projection.pointsEarned.toLocaleString("en-CA")} points are shown without a dollar value.` : ""}</li>
            ))}
          </ul>
        </details>
      ) : null}
      {result.interestOnly.length ? (
        <div className="rounded-2xl bg-white p-4 text-sm">
          <h3 className="font-semibold text-navy">Lower interest, rewards not included in the ranking</h3>
          <ul className="mt-2 space-y-1">
            {result.interestOnly.map((item) => (
              <li key={item.card.id}>{item.card.name}: {item.card.termVersions.at(-1)?.aprLabel}. Annual fee {cad(item.projection.applicableFeeCad)}.</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.ranked.length ? <Comparison rows={[...result.ranked.slice(0, 5), ...result.interestOnly.slice(0, 1)]} /> : null}
      {scaleCards.length ? (
        <div className="rounded-3xl bg-white p-4">
          <h3 className="font-semibold text-navy">If your spending changes</h3>
          <p className="mt-1 text-sm text-muted">Holding your category mix and point valuation constant. This is a scenario check, not a confidence interval.</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows}>
                <CartesianGrid stroke="#d5deea" />
                <XAxis dataKey="spend" />
                <YAxis />
                <Tooltip />
                <Legend />
                {scaleCards.map((id, index) => (
                  <Line key={id} type="monotone" dataKey={nameOf(id)} stroke={lineColors[index]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Ongoing value at different spending levels</caption>
            <thead><tr>{["Spending", ...scaleCards.map(nameOf)].map((heading) => <th key={heading} className="py-1 pr-2">{heading}</th>)}</tr></thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.scale} className="border-t border-line">
                  <td className="py-1">{Math.round(point.scale * 100)}%</td>
                  {scaleCards.map((id) => <td key={id}>{cad(point.values[id])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {crossing ? <p className="mt-3 text-sm text-muted">{crossingText(crossing, winner!, rival!)}</p> : null}
        </div>
      ) : null}
      <PointValue profile={profile} onPreferences={onPreferences} />
      {profile.preferences.creditScore != null ? <p className="text-sm text-muted">You entered a credit score of {profile.preferences.creditScore}. RBC does not publish a score cutoff for these cards. CardFit does not predict approval.</p> : null}
    </section>
  );
}

function WinnerCard({ item }: { item: RankedCard }) {
  const value = item.projection.ongoingNetCad;
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm" data-testid="winner">
      <div className="h-1.5 bg-gold" />
      <div className="grid gap-4 p-5 md:grid-cols-[220px_1fr]">
        <CardPhoto card={item.card} />
        <div>
          <p className="text-sm font-semibold text-blue">Best ongoing value</p>
          <h2 className="text-2xl font-semibold text-navy" data-testid="winner-name">{item.card.name}</h2>
          <p className="mt-1 text-4xl font-semibold tabular-nums text-ink" data-testid="winner-value">{cad(value)}</p>
          <p className="text-sm text-muted">estimated a year, after the {cad(item.projection.applicableFeeCad)} fee</p>
          <ul className="mt-4 space-y-2 text-sm leading-6">
            {item.explanations.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <p className="mt-3 text-sm text-muted">{item.requirementDetail}</p>
          <p className="mt-2 text-sm">Rewards {cad(item.projection.rewardValueCad)} · Fee {cad(item.projection.applicableFeeCad)}{item.projection.interestCad != null ? ` · Approximate interest ${cad(item.projection.interestCad)}` : ""}</p>
          <p className="mt-1 text-sm text-muted">{item.projection.valuationLabel}. {item.projection.restrictions[0]}</p>
          {item.projection.pointsEarned ? <p className="text-sm">{item.projection.pointsEarned.toLocaleString("en-CA")} points, then converted with the valuation above.</p> : null}
          {item.projection.welcomeCad ? <p className="text-sm">First-year figure, with the welcome offer: {cad(item.projection.firstYearNetCad)}. Ongoing ranking does not include it unless you ask.</p> : null}
          <a className="mt-3 inline-block text-sm font-semibold text-blue" href={item.card.productUrl}>Product page</a>
        </div>
      </div>
      <details className="border-t border-line px-5 py-3">
        <summary className="cursor-pointer font-semibold text-navy">How this was calculated</summary>
        <div className="mt-3 space-y-3 text-sm">
          <table className="w-full text-left">
            <caption className="sr-only">Reward contribution by category</caption>
            <thead><tr><th>Category</th><th>Year of spending</th><th>Rate</th><th>Value</th></tr></thead>
            <tbody>
              {item.projection.categories.map((line) => (
                <tr key={line.category} className="border-t border-line">
                  <td className="py-1">{labels[line.category]}</td>
                  <td>{cad(line.annualSpendCad)}</td>
                  <td>{line.rateLabel}</td>
                  <td>{cad(line.rewardCad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            {item.projection.assumptions.map((line) => <li key={line}>{line}</li>)}
            {item.projection.welcomeNotes.map((line) => <li key={line}>{line}</li>)}
            {item.projection.benefits.map((line) => <li key={line}>{line}</li>)}
            {item.card.rewardsAssumption ? <li>{item.card.rewardsAssumption}</li> : null}
          </ul>
          <p className="text-muted">Verified {item.card.termVersions.at(-1)?.verifiedAt}. Additional card fees are shown by the issuer and are not subtracted here.</p>
        </div>
      </details>
    </article>
  );
}

function Comparison({ rows }: { rows: RankedCard[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-white p-4">
      <h3 className="font-semibold text-navy">Side by side</h3>
      <table className="mt-3 w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="text-muted">
            {["Card", "Ongoing value", "Rewards", "Fee", "Interest", "First year"].map((heading) => <th key={heading} className="py-2 pr-3">{heading}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.card.id} className="border-t border-line">
              <td className="py-2 pr-3 font-semibold text-navy">{item.card.name}</td>
              <td>{cad(item.projection.ongoingNetCad)}</td>
              <td>{cad(item.projection.rewardValueCad)}</td>
              <td>{cad(item.projection.applicableFeeCad)}</td>
              <td>{item.projection.interestCad == null ? "—" : cad(item.projection.interestCad)}</td>
              <td>{cad(item.projection.firstYearNetCad)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PointValue({ profile, onPreferences }: { profile: ProfileInput; onPreferences: (partial: Partial<Preferences>) => void }) {
  const custom = profile.preferences.customCentsPerPoint;
  return (
    <div className="rounded-3xl bg-white p-4 text-sm">
      <h3 className="font-semibold text-navy">Point value</h3>
      <p className="mt-1 text-muted">Published rates stay in place until you enter your own. Cash back is always face value.</p>
      <label className="mt-3 block">
        Your cents per point
        <input className="mt-1 w-full" type="range" min={0.5} max={2.5} step={0.1} value={custom ?? 1} disabled={custom == null} onChange={(event) => onPreferences({ customCentsPerPoint: Number(event.target.value) })} />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="rounded-full border border-line px-3 py-1 font-semibold" onClick={() => onPreferences({ customCentsPerPoint: null, applyCustomToUnvalued: false })}>Use published rates</button>
        <button type="button" className="rounded-full border border-line px-3 py-1 font-semibold" onClick={() => onPreferences({ customCentsPerPoint: custom ?? 1 })}>Use my figure{custom != null ? ` (${custom.toFixed(1)}¢)` : ""}</button>
        <label className="flex items-center gap-2"><input type="checkbox" checked={profile.preferences.applyCustomToUnvalued} onChange={(event) => onPreferences({ applyCustomToUnvalued: event.target.checked })} /> Also apply it to Avios</label>
      </div>
    </div>
  );
}

function CardPhoto({ card }: { card: CardProduct }) {
  if (!card.image) return <div className="flex aspect-[1.586/1] items-center rounded-xl bg-navy p-3 text-sm font-semibold text-white">{card.name}</div>;
  const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return <img src={`${assetBase}${card.image}`} alt={`${card.name}`} className="aspect-[1.586/1] w-full rounded-xl bg-paper object-contain" />;
}

function nameOf(id: string) {
  return catalog.cards.find((card) => card.id === id)?.name ?? id;
}

function crossingText(
  crossing: ReturnType<typeof breakEven>,
  winner: RankedCard,
  rival: RankedCard,
) {
  if (!crossing.crossings.length) return `${winner.card.name} and ${rival.card.name}: ${crossing.note}`;
  const first = crossing.crossings[0];
  return `${crossing.note} One change in order is near ${cad(first.monthlyTotalCad)} of monthly spending, between ${winner.card.name} and ${rival.card.name}.`;
}
