import { cad, catalog } from "@cardfit/engine";
import Link from "next/link";
import { assetUrl } from "../../lib/card-facts";
import { familyLabels } from "../../lib/labels";

export default function SourcesPage() {
  return (
    <main className="bg-paper">
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <h1 className="text-[2.25rem] font-semibold leading-tight text-ink md:text-[2.75rem]">Sources and method</h1>
          <p className="mt-4 text-lg leading-7 text-muted">
            CardFit compares public RBC product terms. It does not see your accounts, and it does not decide whether RBC will approve an application.
          </p>
          <Link href="/" className="mt-5 inline-block font-semibold text-rbc hover:underline">
            Back to the comparison
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-12 px-5 py-10">
        <section>
          <h2 className="text-2xl font-semibold text-ink">How a result is built</h2>
          <div className="mt-4 space-y-4 leading-7 text-ink">
            <p>Monthly amounts are repeated for 12 months starting on the comparison date. Each month uses the term version in effect that month, so the October 1, 2026 cash-back change is applied only from that date.</p>
            <p>Cash back is eligible spending times the category rate. Points are eligible spending times points per dollar, then converted with a published or illustrated rate. Caps and tiers are counted inside their own month or year. A dollar is counted once, at the highest-priority rule that fits.</p>
            <p>Ongoing value is reward value, minus the annual fee, minus approximate interest if you entered a balance. Welcome offers are off by default. Insurance and lounge access are listed, not priced.</p>
            <p>The ranking is the highest ongoing value among cards that pass your fee and reward choices and meet published income tests. Missing income stays unknown. Cards without a dollar value for their points, such as Avios, are not ranked.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink">Cards in this catalog</h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
            {catalog.cards.map((card) => {
              const version = card.termVersions[card.termVersions.length - 1];
              return (
                <li key={card.id} className="flex gap-4 px-5 py-4">
                  <div className="w-20 shrink-0 sm:w-24">
                    {card.image ? <img src={assetUrl(card.image)} alt="" className="aspect-[1.586/1] w-full rounded-lg object-cover" /> : <div className="aspect-[1.586/1] rounded-lg bg-deep" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink">{card.name}</h3>
                    <p className="mt-0.5 text-sm text-muted">
                      {familyLabels[card.family]} <span aria-hidden className="mx-1 text-gold">•</span> {version.annualFeeCad === 0 ? "No annual fee" : `${cad(version.annualFeeCad)} fee`} <span aria-hidden className="mx-1 text-gold">•</span> {version.aprLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink">{version.eligibility}</p>
                    {card.unrankedReason ? <p className="mt-1 text-sm leading-6 text-muted">{card.unrankedReason}</p> : null}
                    <p className="mt-2 text-sm text-muted">
                      {version.verificationStatus === "verified" ? "Verified" : "Partially verified"} {version.verifiedAt}
                      <span aria-hidden className="mx-1.5 text-gold">•</span>
                      <a className="font-semibold text-rbc hover:underline" href={card.productUrl} target="_blank" rel="noreferrer">
                        Issuer page
                      </a>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink">Pages reviewed on {catalog.retrievedAt}</h2>
          <ul className="mt-4 space-y-4">
            {catalog.sources.map((source) => (
              <li key={source.id} className="rounded-2xl border border-line bg-white px-5 py-4">
                <a className="font-semibold text-rbc hover:underline" href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Retrieved {source.retrievedAt}. {source.applicableEffectiveDate ? `Issuer effective date ${source.applicableEffectiveDate}.` : "The page did not state a rule start date."} {source.notes}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
