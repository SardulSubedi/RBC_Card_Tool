# CardFit — RBC Card Explorer

CardFit estimates which current RBC personal credit card is worth more for a spending profile, and shows the fee, the rewards, and the reason.

It is an independent portfolio prototype for a University of Waterloo Computer Science and Finance student, built after an RBC Personal Banking Data Analyst interview. It is not an RBC product, not a credit application, and not a prediction of approval.

The question it answers:

**Which RBC personal credit card offers the best estimated value for this spending profile, and why?**

## What a reviewer can do

1. Answer six short questions about monthly spending, the annual fee they will consider, and whether they pay the balance in full.
2. Or upload a CSV. The file stays in the browser tab. It is not uploaded or stored.
3. Or open a fictional demo: student, grocery household, frequent traveller, or someone carrying a balance.
4. Read the top cards, the category breakdown, the comparison, and how the number was built.
5. Move spending up or down, or replace a point value, and see the ranking recalculate.

Optional credit score is accepted and then ignored. RBC does not publish a score cutoff on these pages, and this tool does not estimate approval.

## Why there is no stored backend

The hosted app has to run without an account and without keeping anyone’s transactions. Spending, CSV rows, and recommendation requests stay in browser memory and disappear when the tab closes. Product terms are a versioned catalog shipped with the site. The same calculation module powers the screen, the unit tests, and the Python demo report.

Python is used for catalog validation, the SQLite seed, the SQL example, and a pandas comparison of the four demos. It calls the TypeScript engine rather than keeping a second copy of the formulas.

## Run it locally

Requirements: Node.js 20 or newer, and Python 3.12 if you want the analyst scripts. No API keys.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000.

```bash
npm test
npm run typecheck
npm run build
```

`npm run build` writes a static site to `apps/web/out`.

Analyst scripts, from the repository root:

```bash
python -m venv .venv
.venv\Scripts\python -m pip install -r analysis/requirements.txt
.venv\Scripts\python analysis/validate_catalog.py
.venv\Scripts\python analysis/seed_catalog.py
.venv\Scripts\python analysis/demo_profiles.py
.venv\Scripts\python -m pytest tests/python
```

On macOS or Linux, use `.venv/bin/python` instead of `.venv\Scripts\python`.

The browser end-to-end checks:

```bash
npx playwright install chromium
npm run test:e2e --workspace web
```

## Catalog and refresh

`data/catalog/catalog.json` is generated from `packages/engine/src/catalog-data.ts`:

```bash
npx tsx packages/engine/src/cli.ts emit-catalog
npx tsx packages/engine/src/cli.ts validate
```

To refresh terms, re-read the issuer pages listed in [docs/source-audit.md](docs/source-audit.md), change the catalog, set a new `catalogVersion`, and keep retrieval dates separate from rule effective dates. Do not copy a fee forward just because a page was open on a given day.

The October 1, 2026 cash-back change is modelled as its own term version. Comparisons that start on that date use the new unlimited rates and the $120 Preferred fee. Earlier months in a projection still use the previous caps.

## Assumptions a customer should see

- Results are a 12-month projection, not rewards already earned.
- Cash back is face value. Points use the published or illustrated conversion named on the card, unless the person enters their own cents per point.
- Avios are not given a dollar value unless the person supplies one.
- Insurance, lounge access, and DashPass are not priced.
- A carried balance with no dollar estimate does not produce an after-interest winner.
- Income left blank is not treated as zero.
- Merchant descriptions are estimates. They are not confirmed merchant category codes.

The formulas and ranking rules are in [docs/methodology.md](docs/methodology.md).

## Sample transactions

`data/synthetic/grocery-household.csv` is fictional spending for the grocery demo, plus a payment, interest, a fee, a cash advance, a refund, a duplicate id, two identical rideshare rows, and one unknown merchant. Column notes are in [data/synthetic/FORMAT.md](data/synthetic/FORMAT.md).

Purchases in that file are positive. The app asks before it assumes a sign.

## Hosting

The production build is a static export. Any host that serves files works: Cloudflare Pages, GitHub Pages, Netlify, or Vercel. Point the host at `apps/web/out` after `npm run build`. No database and no server process are required.

Do not put real transaction files in the repository or in hosting logs. The app does not send them anywhere.

## What this demonstrates

Personal banking analytics is mostly careful product data, messy inputs, and a number someone can check.

- **Product modelling.** Fees, APRs, earn rates, caps, income tests, and welcome offers are separate fields with sources and effective dates, including the October 1, 2026 cash-back change.
- **Messy data.** The CSV path reconciles raw amounts to eligible purchases, keeps refunds, flags duplicate ids, and does not treat a repeated Uber trip as an automatic duplicate.
- **Segmentation.** The demos are a student, a grocery household, a traveller, and a balance carrier. The same engine shows that the useful card changes with the profile.
- **Cost and reward.** Ongoing value is rewards minus the fee, and minus approximate interest only when a balance was actually entered.
- **Communication.** The screen leads with a dollar figure and two or three sentences built from the calculation, with sources one click away.

## Layout

```text
apps/web/            Next.js interface
packages/engine/     Calculation engine, catalog, CSV review, tests
data/catalog/        Versioned catalog JSON and generated SQLite
data/synthetic/      Sample transactions
analysis/            Catalog validation, SQLite seed, pandas demo report
docs/                Methodology, source audit, SQL, walkthrough
tests/               Python checks and browser journeys
```

## Limits

Card images were supplied for the prototype. They are product illustrations, not an RBC website. One blue Visa face does not print “Low Rate”; it is used only for the Visa Classic Low Rate Option and the audit says so. RateAdvantage is omitted because the live page failed and the rate is a range disclosed at application. Several welcome offers are headlines only. Terms change. Check the issuer page before applying.
