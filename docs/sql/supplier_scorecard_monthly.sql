-- Supplier Scorecard (Monthly)
-- Purpose: Track supplier share, HHI, and revenue by month within FSC
-- Source: publog_gold.fact_procurement_enriched (curated)

CREATE OR REPLACE VIEW publog_gold.supplier_scorecard_monthly AS
SELECT
  date_trunc('month', award_date) AS award_month,
  fp.fsc,
  fp.seller_cage AS cage,
  COUNT(*) AS lines,
  SUM(fp.quantity) AS total_qty,
  SUM(fp.amount) AS revenue,
  COUNT(DISTINCT fp.contract_number) AS contracts,
  -- share within FSC for the month
  SUM(fp.amount) / NULLIF(SUM(SUM(fp.amount)) OVER (PARTITION BY date_trunc('month', award_date), fp.fsc), 0) AS share,
  -- distinct suppliers per fsc-month
  COUNT(DISTINCT fp.seller_cage) OVER (PARTITION BY date_trunc('month', award_date), fp.fsc) AS suppliers_in_fsc_month,
  -- HHI per fsc-month (Revenue share squared)
  SUM(
    POWER(
      SUM(fp.amount) / NULLIF(SUM(SUM(fp.amount)) OVER (PARTITION BY date_trunc('month', award_date), fp.fsc), 0),
      2
    )
  ) OVER (PARTITION BY date_trunc('month', award_date), fp.fsc) AS hhi
FROM publog_gold.fact_procurement_enriched fp
GROUP BY 1,2,3;
