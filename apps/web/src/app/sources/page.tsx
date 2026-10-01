import { catalog } from "@cardfit/engine";
import Link from "next/link";

export default function SourcesPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-4xl font-semibold text-navy">Sources and method</h1>
        <p className="mt-3 text-lg leading-7 text-muted">
          CardFit compares public RBC product terms. It does not see your accounts, and it does not decide whether RBC will approve an application.
        </p>
        <Link href="/" className="mt-4 inline-block font-semibold text-blue">Back to the comparison</Link>
      </div>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-navy">How a result is built</h2>
        <p>Monthly amounts are repeated for 12 months starting on the comparison date. Each month uses the term version in effect that month, so the October 1, 2026 cash-back change is applied only from that date.</p>
        <p>Cash back is eligible spending times the category rate. Points are eligible spending times points per dollar, then converted with a published or illustrated rate. Caps and tiers are counted inside their own month or year. A dollar is counted once, at the highest-priority rule that fits.</p>
        <p>Ongoing value is reward value, minus the annual fee, minus approximate interest if you entered a balance. Welcome offers are off by default. Insurance and lounge access are listed, not priced.</p>
        <p>The ranking is the highest ongoing value among cards that pass your fee and reward choices and meet published income tests. Missing income stays unknown. Cards without a dollar value for their points, such as Avios, are not ranked.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-navy">Cards in this catalog</h2>
        {catalog.cards.map((card) => {
          const version = card.termVersions[card.termVersions.length - 1];
          return (
            <article key={card.id} className="rounded-2xl border border-line bg-white p-4">
              <h3 className="text-xl font-semibold text-navy">{card.name}</h3>
              <p className="text-sm text-muted">{version.verificationStatus === "verified" ? "Verified" : "Partial"} · checked {version.verifiedAt} · fee {version.annualFeeCad.toLocaleString("en-CA", { style: "currency", currency: "CAD" })} · {version.aprLabel}</p>
              <p className="mt-2 text-sm">{version.eligibility}</p>
              {card.unrankedReason ? <p className="mt-2 text-sm">{card.unrankedReason}</p> : null}
              <a className="mt-2 inline-block text-sm font-semibold text-blue" href={card.productUrl}>Issuer page</a>
            </article>
          );
        })}
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-navy">Pages reviewed on October 1, 2026</h2>
        <ul className="space-y-3">
          {catalog.sources.map((source) => (
            <li key={source.id}>
              <a className="font-semibold text-blue" href={source.url}>{source.title}</a>
              <p className="text-sm text-muted">Retrieved {source.retrievedAt}. {source.applicableEffectiveDate ? `Issuer effective date ${source.applicableEffectiveDate}.` : "The page did not state a rule start date."} {source.notes}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
