-- Daily Top-N aggregates (Gold)

CREATE TABLE IF NOT EXISTS publog_gold.top_items_daily
WITH (
  format='PARQUET',
  write_compression='ZSTD',
  external_location='s3://publog-gold-user-dev-20250831/top_items_daily/',
  partitioned_by=ARRAY['dt']
) AS
SELECT
  c.dt,
  COALESCE(d.item_name, c.item_name) AS item_name,
  count(*) AS c
FROM publog_silver.parts_canonical c
LEFT JOIN publog_gold.item_dim_latest_v1 d ON d.item_id = c.item_id
GROUP BY c.dt, COALESCE(d.item_name, c.item_name);

CREATE TABLE IF NOT EXISTS publog_gold.top_fsc_daily
WITH (
  format='PARQUET',
  write_compression='ZSTD',
  external_location='s3://publog-gold-user-dev-20250831/top_fsc_daily/',
  partitioned_by=ARRAY['dt']
) AS
SELECT
  c.dt,
  COALESCE(c.FSC_TITLE, '(unknown)') AS FSC_TITLE,
  count(*) AS c
FROM publog_silver.parts_canonical c
GROUP BY c.dt, COALESCE(c.FSC_TITLE, '(unknown)');

-- Optional: prepared statements to read from Gold
-- CREATE PREPARED STATEMENT ps_top_items_daily
-- FROM
-- SELECT item_name, sum(c) AS c
-- FROM publog_gold.top_items_daily
-- WHERE dt BETWEEN ? AND ?
-- GROUP BY 1
-- ORDER BY 2 DESC
-- LIMIT ?;

-- CREATE PREPARED STATEMENT ps_top_fsc_daily
-- FROM
-- SELECT FSC_TITLE, sum(c) AS c
-- FROM publog_gold.top_fsc_daily
-- WHERE dt BETWEEN ? AND ?
-- GROUP BY 1
-- ORDER BY 2 DESC
-- LIMIT ?;

