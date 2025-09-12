-- Curated Parquet union: archive + explicit H-series branch; aligned columns; dt partition
CREATE TABLE IF NOT EXISTS publog_silver.parts_source_union
WITH (
  format = 'PARQUET',
  write_compression = 'SNAPPY',
  external_location = 's3://publog-silver-user-dev-20250831/parts_source_union/',
  partitioned_by = ARRAY['dt']
) AS
WITH
src_archive AS (
  SELECT
    CAST(try_cast(json_extract_scalar(payload,'$.event_time') AS timestamp) AS timestamp) AS event_time,
    CAST(dt AS varchar)           AS dt,
    CAST(try_cast(json_extract_scalar(payload,'$.user_id') AS varchar) AS varchar)      AS user_id,
    CAST(try_cast(json_extract_scalar(payload,'$.session_id') AS varchar) AS varchar)   AS session_id,
    CAST(try_cast(json_extract_scalar(payload,'$.event_name') AS varchar) AS varchar)   AS event_name,
    CAST(COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.item_id')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_ID')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.part_id')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.PART_ID')), '')
    ) AS varchar) AS item_id,
    CAST(COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAMES')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.NOMENCLATURE')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.NSN_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.PART_NAME')), '')
    ) AS varchar) AS item_name,
    CAST(COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.FSC_TITLE')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.fsc_title')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.FSC_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.fsc_name')), '')
    ) AS varchar) AS fsc_title
  FROM publog_silver.raw_user_events_archive_v1
),
src_h AS (
  SELECT
    CAST(try_cast(json_extract_scalar(payload,'$.event_time') AS timestamp) AS timestamp) AS event_time,
    CAST(date_format(try_cast(json_extract_scalar(payload,'$.event_time') AS timestamp), '%Y-%m-%d') AS varchar) AS dt,
    CAST(try_cast(json_extract_scalar(payload,'$.user_id') AS varchar) AS varchar)      AS user_id,
    CAST(try_cast(json_extract_scalar(payload,'$.session_id') AS varchar) AS varchar)   AS session_id,
    CAST(try_cast(json_extract_scalar(payload,'$.event_name') AS varchar) AS varchar)   AS event_name,
    CAST(COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.item_id')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_ID')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.part_id')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.PART_ID')), '')
    ) AS varchar) AS item_id,
    CAST(COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAMES')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.NOMENCLATURE')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.NSN_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.PART_NAME')), '')
    ) AS varchar) AS item_name,
    CAST(COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.FSC_TITLE')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.fsc_title')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.FSC_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.fsc_name')), '')
    ) AS varchar) AS fsc_title
  FROM publog_silver.raw_user_events_h_scan_v1
  WHERE regexp_like("$path", '/H[^/]*$')
)
SELECT event_time, dt, user_id, session_id, event_name, item_id, item_name, fsc_title
FROM (
  SELECT * FROM src_archive
  UNION ALL
  SELECT * FROM src_h
) u
WHERE event_time IS NOT NULL;

