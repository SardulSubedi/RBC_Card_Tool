"use client";

import { catalog, demos } from "@cardfit/engine";
import { CardOrbit } from "./CardOrbit";
import { Icon } from "./icons";
import { Button } from "./ui";

export function Landing({
  onQuiz,
  onImport,
  onDemo,
  onManual,
}: {
  onQuiz: () => void;
  onImport: () => void;
  onDemo: (id: string) => void;
  onManual: () => void;
}) {
  const cards = catalog.cards.filter((card) => card.image);
  return (
    <>
      <section className="on-blue bg-[linear-gradient(180deg,#0051a5_0%,#003f87_70%,#003a7d_100%)] pb-10 text-white">
        <div className="mx-auto max-w-6xl px-5 pb-8 pt-12 text-center md:pt-16">
          <h1 className="rise mx-auto max-w-3xl text-[2.4rem] font-semibold leading-[1.05] md:text-[3.5rem]">
            Find the RBC card that pays you back the most.
          </h1>
          <p className="rise mx-auto mt-4 max-w-2xl text-lg leading-7 text-white/85 [animation-delay:80ms]">
            Answer eight quick questions or upload a statement. CardFit estimates a year of value under current RBC personal card terms, and nothing leaves your browser.
          </p>
          <div className="rise mt-7 flex flex-wrap items-center justify-center gap-3 [animation-delay:160ms]">
            <Button variant="inverse" size="lg" onClick={onQuiz}>
              Answer a few questions
            </Button>
            <Button variant="inverse-outline" size="lg" data-testid="open-import" onClick={onImport}>
              Upload a CSV
            </Button>
          </div>
        </div>
        <CardOrbit cards={cards} />
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
        <h2 className="text-center text-2xl font-semibold text-ink md:text-3xl">How it works</h2>
        <ol className="relative mt-10 grid gap-10 md:grid-cols-3 md:gap-6">
          <span aria-hidden className="absolute left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] top-7 hidden h-px bg-line md:block" />
          {[
            { icon: <Icon.Cart size={30} />, title: "Tell us how you spend", text: "Pick a monthly range for groceries, dining, getting around, travel, and bills. Ranges are fine; you can type exact amounts later." },
            { icon: <Icon.Tag size={30} />, title: "Set your comfort with fees", text: "No annual fee, a ceiling, or only when a card still comes out ahead after its fee. Add a credit score if you like." },
            { icon: <Icon.Card size={30} />, title: "See the card that is worth the most", text: "One best match with the dollars behind it, the runners-up, and the published terms every number came from." },
          ].map((item) => (
            <li key={item.title} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-sky text-rbc ring-8 ring-white">{item.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 max-w-xs text-[15px] leading-6 text-muted">{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-sky">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-14 md:grid-cols-[1fr_1.4fr] md:gap-14">
          <div>
            <h2 className="text-2xl font-semibold text-ink md:text-3xl">Not sure where to start?</h2>
            <p className="mt-3 leading-7 text-muted">Load a sample profile and look at a finished result first. Every sample is fictional, and you can change any number afterwards.</p>
            <button type="button" onClick={onManual} className="mt-4 inline-flex items-center gap-2 font-semibold text-rbc hover:underline">
              <Icon.Pencil size={18} /> Type every category yourself instead
            </button>
          </div>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {demos.map((demo) => (
              <li key={demo.id}>
                <button
                  type="button"
                  data-testid={`demo-${demo.id}`}
                  onClick={() => onDemo(demo.id)}
                  className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-sky/60"
                >
                  <span>
                    <span className="block font-semibold text-ink">{demo.label}</span>
                    <span className="mt-0.5 block text-sm leading-5 text-muted">{demo.blurb}</span>
                  </span>
                  <Icon.ChevronRight size={20} className="shrink-0 text-rbc transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-12 md:flex-row md:items-start md:justify-between md:gap-10">
        {[
          { icon: <Icon.Lock size={24} />, title: "Stays in your browser", text: "Your numbers and any CSV you upload live in this tab only. Close it and they are gone." },
          { icon: <Icon.Shield size={24} />, title: "Current terms, dated", text: `Fees, rates, and caps were checked against RBC's pages on ${catalog.retrievedAt}, including the October 1, 2026 cash-back changes.` },
          { icon: <Icon.Scale size={24} />, title: "Independent estimate", text: "Not affiliated with RBC. Value depends on your spending and how you redeem; approval is always the issuer's call." },
        ].map((item) => (
          <div key={item.title} className="flex gap-3 md:max-w-xs">
            <span className="mt-0.5 shrink-0 text-rbc">{item.icon}</span>
            <div>
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{item.text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
