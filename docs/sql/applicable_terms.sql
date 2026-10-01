-- Applicable term version and reward rules for one card on a comparison date.
-- Example:
--   sqlite3 data/catalog/cardfit.sqlite
--   .parameter set :slug rbc-cash-back-mastercard
--   .parameter set :as_of 2026-10-01
--   .read docs/sql/applicable_terms.sql

SELECT
  c.name,
  v.id AS term_version_id,
  v.effective_from,
  v.effective_to,
  v.annual_fee_cad,
  v.purchase_apr,
  r.category,
  r.earn_unit,
  r.earn_rate,
  r.tier_lower_cad,
  r.tier_upper_cad,
  r.cap_group_id,
  r.reset_period,
  r.priority
FROM cards c
JOIN card_term_versions v ON v.card_id = c.id
JOIN reward_rules r ON r.term_version_id = v.id
WHERE c.slug = :slug
  AND (v.effective_from IS NULL OR v.effective_from <= :as_of)
  AND (v.effective_to IS NULL OR v.effective_to >= :as_of)
ORDER BY r.priority DESC, r.category;
