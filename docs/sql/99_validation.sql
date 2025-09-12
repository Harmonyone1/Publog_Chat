-- PASS/FAIL: parts_canonical exposes FSC_TITLE + item_name
SELECT CASE WHEN count(*)=2 THEN 'PASS' ELSE 'FAIL' END AS has_required_columns
FROM information_schema.columns
WHERE table_schema='publog_silver' AND table_name='parts_canonical'
  AND lower(column_name) IN ('fsc_title','item_name');

-- H-series inclusion (via $path)
SELECT count(*) AS h_rows
FROM publog_silver.raw_user_events_h_scan_v1
WHERE regexp_like("$path", '/H[^/]*$');

-- Non-empty rates (adjust dates)
SELECT
  sum(CASE WHEN item_name IS NULL OR TRIM(item_name)='' THEN 1 ELSE 0 END) AS empty_item_names,
  sum(CASE WHEN FSC_TITLE IS NULL OR TRIM(FSC_TITLE)='' THEN 1 ELSE 0 END) AS empty_fsc_titles,
  count(*) AS total_rows
FROM publog_silver.parts_canonical
WHERE dt BETWEEN '2024-09-01' AND '2024-09-30';

-- Old vs new counts and % formerly empty now filled
WITH p AS (SELECT '2024-09-01' AS from_dt, '2024-09-30' AS to_dt),
old_rows AS (
  SELECT s.event_time, s.user_id, s.session_id, s.event_name, s.item_id,
         NULLIF(TRIM(s.item_name), '') AS item_name_old,
         CASE WHEN s.item_name IS NULL OR TRIM(s.item_name)='' THEN 1 ELSE 0 END AS empty_old
  FROM publog_silver.parts_source_union s, p
  WHERE s.dt BETWEEN p.from_dt AND p.to_dt AND s.event_time IS NOT NULL
),
new_rows AS (
  SELECT c.event_time, c.user_id, c.session_id, c.event_name, c.item_id,
         NULLIF(TRIM(c.item_name), '') AS item_name_new,
         CASE WHEN c.item_name IS NULL OR TRIM(c.item_name)='' THEN 1 ELSE 0 END AS empty_new
  FROM publog_silver.parts_canonical c, p
  WHERE c.dt BETWEEN p.from_dt AND p.to_dt AND c.event_time IS NOT NULL
)
SELECT
  (SELECT count(*) FROM old_rows) AS total_old_rows,
  (SELECT count(*) FROM new_rows) AS total_new_rows,
  (SELECT sum(empty_old) FROM old_rows) AS old_empty_names,
  (SELECT sum(empty_new) FROM new_rows) AS new_empty_names,
  CASE WHEN (SELECT sum(empty_old) FROM old_rows) = 0 THEN 0.0
       ELSE 100.0 * (
         SELECT count(*) FROM (
           SELECT 1
           FROM old_rows o
           LEFT JOIN new_rows n
             ON n.event_time=o.event_time AND n.user_id=o.user_id AND n.session_id=o.session_id AND n.event_name=o.event_name AND n.item_id=o.item_id
           WHERE o.empty_old=1 AND (n.empty_new=0 OR (n.empty_new IS NULL AND n.item_name_new IS NOT NULL))
         ) f
       ) / (SELECT sum(empty_old) FROM old_rows) END AS pct_filled_from_empty;

