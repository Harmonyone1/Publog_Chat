-- Build NIIN → latest item_name, FSC_TITLE mapping directly from raw payloads

CREATE TABLE IF NOT EXISTS publog_gold.niin_dim_latest_v1
WITH (
  format='PARQUET',
  write_compression='ZSTD',
  external_location='s3://publog-gold-user-dev-20250831/niin_dim_latest_v1/'
) AS
WITH src AS (
  SELECT
    -- normalize NIIN: prefer explicit, else last 9 digits from NSN
    CAST(
      lpad(
        regexp_extract(
          COALESCE(
            json_extract_scalar(payload,'$.NIIN'),
            json_extract_scalar(payload,'$.niin'),
            regexp_extract(COALESCE(json_extract_scalar(payload,'$.NSN'), json_extract_scalar(payload,'$.nsn')), '(\\d{9})$', 1)
          ),
          '(\\d{9})', 1
        ), 9, '0'
      ) AS varchar
    ) AS NIIN,
    try_cast(json_extract_scalar(payload,'$.event_time') AS timestamp) AS event_time,
    -- canonical item_name
    COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAMES')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.NOMENCLATURE')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.NSN_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.PART_NAME')), '')
    ) AS item_name,
    -- canonical FSC title
    COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.FSC_TITLE')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.fsc_title')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.FSC_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.fsc_name')), '')
    ) AS fsc_title
  FROM publog_silver.raw_user_events_archive_v1
  UNION ALL
  SELECT
    CAST(
      lpad(
        regexp_extract(
          COALESCE(
            json_extract_scalar(payload,'$.NIIN'),
            json_extract_scalar(payload,'$.niin'),
            regexp_extract(COALESCE(json_extract_scalar(payload,'$.NSN'), json_extract_scalar(payload,'$.nsn')), '(\\d{9})$', 1)
          ),
          '(\\d{9})', 1
        ), 9, '0'
      ) AS varchar
    ) AS NIIN,
    try_cast(json_extract_scalar(payload,'$.event_time') AS timestamp) AS event_time,
    COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAMES')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.NOMENCLATURE')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.NSN_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.PART_NAME')), '')
    ) AS item_name,
    COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.FSC_TITLE')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.fsc_title')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.FSC_NAME')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.fsc_name')), '')
    ) AS fsc_title
  FROM publog_silver.raw_user_events_h_scan_v1
  WHERE regexp_like("$path", '/H[^/]*$')
)
SELECT
  NIIN,
  max_by(item_name, event_time) AS item_name,
  max_by(fsc_title, event_time) AS fsc_title
FROM src
WHERE NIIN IS NOT NULL AND event_time IS NOT NULL
GROUP BY NIIN;

