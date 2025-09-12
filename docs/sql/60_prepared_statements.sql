-- Canonical-only prepared statements (safe for the app)
CREATE PREPARED STATEMENT ps_top_items_canon
FROM
SELECT item_name, count(*) AS c
FROM publog_silver.parts_canonical
WHERE dt BETWEEN ? AND ?
  AND item_name IS NOT NULL AND TRIM(item_name) <> ''
GROUP BY 1
ORDER BY 2 DESC
LIMIT ?;

CREATE PREPARED STATEMENT ps_top_fsc_canon
FROM
SELECT FSC_TITLE, count(*) AS c
FROM publog_silver.parts_canonical
WHERE dt BETWEEN ? AND ?
  AND FSC_TITLE IS NOT NULL AND TRIM(FSC_TITLE) <> ''
GROUP BY 1
ORDER BY 2 DESC
LIMIT ?;

