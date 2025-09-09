-- Baseline KPI Views by FSC/INC/NIIN per quarter
-- Purpose: revenue, lines, suppliers per quarter
-- Source: publog_gold.fact_procurement_curated

CREATE OR REPLACE VIEW publog_gold.kpi_quarterly_fsc AS
SELECT
  date_trunc('quarter', award_date) AS award_quarter,
  fsc,
  SUM(amount) AS revenue,
  COUNT(*) AS lines,
  COUNT(DISTINCT seller_cage) AS suppliers
FROM publog_gold.fact_procurement_curated
GROUP BY 1,2;

CREATE OR REPLACE VIEW publog_gold.kpi_quarterly_inc AS
SELECT
  date_trunc('quarter', fp.award_date) AS award_quarter,
  im.inc,
  SUM(fp.amount) AS revenue,
  COUNT(*) AS lines,
  COUNT(DISTINCT fp.seller_cage) AS suppliers
FROM publog_gold.fact_procurement_curated fp
JOIN publog_gold.item_master_curated im ON im.niin = fp.niin
GROUP BY 1,2;

CREATE OR REPLACE VIEW publog_gold.kpi_quarterly_niin AS
SELECT
  date_trunc('quarter', award_date) AS award_quarter,
  niin,
  SUM(amount) AS revenue,
  COUNT(*) AS lines,
  COUNT(DISTINCT seller_cage) AS suppliers
FROM publog_gold.fact_procurement_curated
GROUP BY 1,2;

