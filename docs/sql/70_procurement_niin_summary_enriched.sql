-- Enriched NIIN summary view (join to NIIN dimension for names/titles)
-- NOTE: Adjust source columns if your fact schema differs.

CREATE OR REPLACE VIEW publog_gold.procurement_niin_summary_enriched_v1 AS
SELECT
  a.niin,
  COALESCE(d.item_name, '(unknown)') AS item_name,
  COALESCE(d.fsc_title, '(unknown)') AS FSC_TITLE,
  CAST(a.dt AS date)                 AS dt,
  COUNT(DISTINCT a.contract_id)      AS contracts,
  SUM(a.quantity)                    AS total_quantity,
  SUM(a.extended_amount)             AS total_revenue,
  COUNT(*)                           AS line_items
FROM publog_gold.fact_procurement_curated a
LEFT JOIN publog_gold.niin_dim_latest_v1 d
  ON d.niin = a.niin
GROUP BY a.niin, COALESCE(d.item_name, '(unknown)'), COALESCE(d.fsc_title, '(unknown)'), CAST(a.dt AS date);

