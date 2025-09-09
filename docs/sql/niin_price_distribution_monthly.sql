-- NIIN Price Distribution (Monthly)
-- Purpose: p10/p50/p90 price ranges per NIIN by month
-- Source: publog_gold.fact_procurement_curated

CREATE OR REPLACE VIEW publog_gold.niin_price_distribution_monthly AS
SELECT
  date_trunc('month', award_date) AS award_month,
  niin,
  approx_percentile(unit_price, 0.1) AS p10_price,
  approx_percentile(unit_price, 0.5) AS p50_price,
  approx_percentile(unit_price, 0.9) AS p90_price,
  COUNT(*) AS lines,
  COUNT(DISTINCT seller_cage) AS suppliers
FROM publog_gold.fact_procurement_curated
GROUP BY 1,2;
