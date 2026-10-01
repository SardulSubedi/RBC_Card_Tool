# Sample transaction file

`grocery-household.csv` is fictional. It is the grocery-household demo, spread across October 2025 through September 2026, plus rows a real export would also contain.

| Column | Meaning |
| --- | --- |
| Date | Posting date, `YYYY-MM-DD` |
| Description | Merchant text. Classification is an estimate, not a merchant category code |
| Amount | Purchases are positive in this file. Refunds and the payment are negative. Other banks use the opposite sign; CardFit asks before it decides |
| TransactionId | Stable id when the export has one. A repeated id is treated as a duplicate. A blank id with the same date, merchant, and amount is only flagged |
| Currency | `CAD` |
| Status | `posted` |

The file also contains:

- `PAYMENT THANK YOU`, excluded
- `INTEREST CHARGE`, excluded
- `ANNUAL FEE`, excluded
- `CASH ADVANCE`, excluded
- a Loblaws refund in March, offset by a larger purchase so the grocery net still matches the demo
- a second `AMZ-1` row, excluded as a duplicate id
- two Uber rows on the same day for the same amount and no id, kept and flagged
- `SQ *CORNER STORE`, left out until someone assigns a category

Monthly estimates divide by all 12 calendar months in the selected period, not only months that contain a purchase.
