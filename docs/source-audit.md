# Source audit

Retrieved October 1, 2026. Rule effective dates are recorded only when an issuer page states them. A retrieval date is not treated as an effective date.

Catalog version `2026-10-01.1`. Field-level source ids live in `data/catalog/catalog.json`.

## Resolved conflict: cash back on October 1, 2026

The live Cash Back Mastercard page, the live Cash Back Preferred World Elite page, the cash-back comparison page, and the cardholder update notice agree:

- No-fee card: $0, purchase APR 21.99%, unlimited 2% groceries, 1% gas, EV charging, transit, and rideshare, 0.5% everything else.
- Preferred: $120, additional card $50, purchase APR 21.99%, unlimited 3% on groceries, dining, gas, EV charging, transit, rideshare, streaming, and digital gaming, 1% otherwise.
- Personal income of $80,000 or household income of $150,000 for Preferred.
- Annual earning caps removed.
- Costco and Walmart earn the non-grocery rate.
- New accounts from October 1, 2026 are charged the $120 Preferred fee.

A Preferred benefits PDF and some older snippets still describe a $99 fee, a 20.99% APR, and 1.5% on the first $25,000. Those documents describe the schedule that ended September 30, 2026. They are stored as the prior term version and are not used for a comparison that starts on October 1, 2026.

The update notice says the new purchase APR hits existing accounts on the first statement period beginning on or after October 1, 2026. The model changes earn rates and APR on the month boundary. That is disclosed as an approximation.

## Welcome offers checked against the comparison date

| Card | Offer used in the optional first-year figure | Apply by |
| --- | --- | --- |
| Cash Back Mastercard | 5% extra on the first $2,000 within 6 months, on top of ordinary rates | February 2, 2027 |
| Cash Back Preferred | 15% extra on the first $2,000 within 3 months, on top of ordinary rates | February 2, 2027 |
| ION Visa | 7,000 points on approval and 7,000 after $500 in 3 months | November 4, 2026 |
| ION+ Visa | 7,000 on approval and 14,000 after $1,500 in 6 months. The 7,000 anniversary points are excluded | November 4, 2026 |
| Avion Visa Infinite | 35,000 on approval and 20,000 after $5,000 in 6 months. The 15,000 anniversary points are excluded | November 25, 2026 |
| Visa Classic Low Rate | First-year fee waiver and 0.99% balance-transfer offer | Dates found were June 15, 2026 and September 30, 2026, so it is expired |

Avion Platinum, Avion Infinite Privilege, WestJet, moi, and More Rewards welcome headlines are shown and not added. Their component splits were not on the page used for the earn rates.

## Point values

- ION gift card: 1,400 Avion points = $10, on the ION Visa page. The same ratio matches the ION welcome illustrations of $100 and $200.
- Avion Visa travel pay-with-points: 100 points = $1, on the Avion Visa Infinite page. The flight chart is not a flat rate.
- Moi: 500 points = $4, on the rewards comparison page.
- WestJet: 15,000 points illustrated as up to $150, and 70,000 as up to $700. Stored as an illustrated travel credit.
- More Rewards: 20,000 points illustrated as $30 in groceries. Stored as an illustration, not a cash rate.
- Avios: no published CAD rate. The British Airways card is not dollar-ranked.

The 100 points = $1 rate is not applied to ION. The ION page does not state it.

## Partial items

- ION+ earns 3 points on groceries, gas, dining, food delivery, rideshare, and streaming by name. EV charging, transit, and digital gaming are included because the page says “and more” and the ION Visa page lists those in the everyday group. The card is marked partial.
- Avion Platinum earn rate, fee, and APR come from the travel comparison table. Its welcome split was not copied from Infinite.
- Avion Infinite Privilege’s 1.25 point everyday rate, $399 fee, and $200,000 income test come from the travel comparison table. Lounge passes and higher business-class redemption are not priced.
- More Rewards Visa Infinite rates come from the no-fee comparison table. That page’s cash-back column was stale relative to the October 1 product pages, so this card is marked partial.
- Visa Classic Low Rate uses the published $20 fee and 12.99% purchase APR. No rewards earn rate was published, so rewards are zero and the card says so. The blue card image does not print the Low Rate name.
- British Airways purchase APR of 20.50% is the figure on the travel comparison table.

## Not ranked

- RBC RateAdvantage Visa. The marketing page returned an error on retrieval. The co-applicant form still describes Prime + 4.99% to Prime + 8.99%. RBC prime was 4.450% on the mortgage rates page, last changed 2025-10-30. Because the applicant spread is disclosed only at application, the card is omitted rather than given a guessed rate.
- RBC Visa Platinum, the no-fee benefits card, appears on the no-fee navigation. An earn rate was not verified, so it is not in the catalog. Its image is kept in `apps/web/public/cards/visa-platinum-nofee.png` and is not shown as another product.
- The gold eagle Avion image is not attached to a current product because the face does not match one verified name.

## Redemption timing

From October 1 through December 1, 2026, cash back phone redemption has a $25 minimum. From December 2, 2026, the minimum becomes $1 and auto-redemption in January ends. Earning is still modelled at face value. The minimum changes when the credit can be requested, not the earn rate.

DashPass length disagrees between a Preferred marketing module (6 months) and the update notice’s Elite Benefit list (12 months). It is not given a dollar value.
