# Methodology

CardFit answers one question: which current RBC personal credit card has the highest estimated ongoing value for a stated spending profile, and why.

The comparison date in the app defaults to October 1, 2026. Monthly amounts repeat for the next 12 months unless a sourced term version changes during that year. Cash-back cards have two versions. Purchases before October 1, 2026 use the previous capped schedules. Purchases from that date use the unlimited category rates.

## Rewards

Cash back:

```text
cash_back_cad = eligible_spend_cad × cash_back_fraction
```

Points:

```text
points_earned = eligible_spend_cad × points_per_cad
estimated_value_cad = points_earned × published_cad / published_points
```

A dollar of spending is assigned to one rule. Rules run from highest priority to lowest. Tiers and shared caps are tracked inside the cap’s own period. A monthly cap resets each month. An annual cap is not applied to a single annual total and then forgotten; the engine walks month by month.

Negative category totals reduce rewards at that category’s rate. They are not clamped to zero, and they do not refill a cap.

## Value, fees, and interest

For someone who pays in full:

```text
ongoing_net_value = estimated_reward_value − applicable_annual_fee
```

For a constant average interest-bearing purchase balance:

```text
approximate_annual_interest = average_balance × purchase_apr
ongoing_net_value = estimated_reward_value − applicable_annual_fee − approximate_annual_interest
```

The interest line is an approximation. It does not model daily balances, grace periods, payment allocation, compounding, or the rate RBC actually quotes on an application. If a balance is carried but no amount is entered, interest is left out of the ranking and the low-rate card is shown beside it.

A VIP Banking rebate is applied only to the Cash Back Preferred card, and only when the person says they have that relationship. The published rebate is up to $120.

## Points are not one number

| Program | Baseline used | What it is |
| --- | --- | --- |
| Cash back | Face value | One dollar of cash back is one dollar |
| ION Avion points | 1,400 points = $10 | Published gift-card example |
| Avion Visa cards | 100 points = $1 | Published travel pay-with-points rate |
| WestJet points | 15,000 points = up to $150 | Illustrated travel credit, not cash |
| Moi points | 500 points = $4 | Published store value |
| More Rewards | 20,000 points = $30 | Welcome-offer grocery illustration |
| Avios | None | Not ranked unless the person enters a value |

The fixed Avion flight chart is not treated as a flat cash rate. A person can replace the published point value with their own cents-per-point figure. That replacement is labelled as their assumption.

## Welcome offers

Welcome offers are off in the ongoing ranking. When they are turned on, only the parts with a published split are added, and only inside the apply-by window, spend cap, and qualifying months. Ordinary rewards are not added twice. Anniversary points are shown and kept out of the 12-month total. Headlines without a verified split, including several travel offers, stay outside the total.

## Eligibility and ranking

Published income tests are personal **or** household minimums. Blank income is not zero. If one figure fails and the other was not provided, the card is “requirements not fully assessed,” not rejected. Student or newcomer status does not replace an income test. A credit score is stored only so the screen can say it was not used.

The default sort is ongoing net value among cards that pass the fee limit and reward style and meet the assessed requirements. A gap under $25 is called a near tie. Up to three cards are shown. Negative values stay negative.

## What is left out

Insurance, lounge access, DashPass, and companion or certificate benefits have no dollar value here. Additional-card fees are displayed from the issuer and are not subtracted. Foreign-exchange markup is not modelled. Merchant names and survey categories are not merchant category codes. Bill payments are treated as eligible purchases, which can overstate rewards.
