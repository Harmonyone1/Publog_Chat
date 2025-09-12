-- Prepared statements reading from the enriched NIIN summary

CREATE PREPARED STATEMENT ps_top_niin_enriched
FROM
SELECT niin, item_name, FSC_TITLE, SUM(total_revenue) AS total_revenue
FROM publog_gold.procurement_niin_summary_enriched_v1
WHERE dt BETWEEN ? AND ?
GROUP BY niin, item_name, FSC_TITLE
ORDER BY total_revenue DESC
LIMIT ?;

CREATE PREPARED STATEMENT ps_niin_breakdown_enriched
FROM
SELECT dt, niin, item_name, FSC_TITLE,
       contracts, total_quantity, total_revenue, line_items
FROM publog_gold.procurement_niin_summary_enriched_v1
WHERE dt BETWEEN ? AND ?
  AND niin = ?
ORDER BY dt ASC
LIMIT ?;

