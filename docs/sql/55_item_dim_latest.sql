-- Optional: curated attributes + gold dimension for latest names

-- Curated attributes (latest non-empty per item_id)
CREATE TABLE IF NOT EXISTS publog_silver.item_name_attributes_curated_v1
WITH (
  format='PARQUET',
  write_compression='ZSTD',
  external_location='s3://publog-silver-user-dev-20250831/item_name_attributes_curated_v1/'
) AS
WITH base AS (
  SELECT
    try_cast(json_extract_scalar(payload,'$.event_time') AS timestamp) AS event_time,
    COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.item_id')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_ID')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.part_id')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.PART_ID')), '')
    ) AS item_id,
    NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAME')), '')    AS ITEM_NAME_raw,
    NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAMES')), '')   AS ITEM_NAMES_raw,
    NULLIF(TRIM(json_extract_scalar(payload,'$.NOMENCLATURE')), '') AS NOMENCLATURE_raw,
    NULLIF(TRIM(json_extract_scalar(payload,'$.NSN_NAME')), '')     AS NSN_NAME_raw,
    NULLIF(TRIM(json_extract_scalar(payload,'$.PART_NAME')), '')    AS PART_NAME_raw
  FROM publog_silver.raw_user_events_archive_v1
  UNION ALL
  SELECT
    try_cast(json_extract_scalar(payload,'$.event_time') AS timestamp),
    COALESCE(
      NULLIF(TRIM(json_extract_scalar(payload,'$.item_id')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_ID')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.part_id')), ''),
      NULLIF(TRIM(json_extract_scalar(payload,'$.PART_ID')), '')
    ),
    NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAME')), ''),
    NULLIF(TRIM(json_extract_scalar(payload,'$.ITEM_NAMES')), ''),
    NULLIF(TRIM(json_extract_scalar(payload,'$.NOMENCLATURE')), ''),
    NULLIF(TRIM(json_extract_scalar(payload,'$.NSN_NAME')), ''),
    NULLIF(TRIM(json_extract_scalar(payload,'$.PART_NAME')), '')
  FROM publog_silver.raw_user_events_h_scan_v1
  WHERE regexp_like("$path", '/H[^/]*$')
)
SELECT
  item_id,
  max_by(ITEM_NAME_raw,    event_time) AS ITEM_NAME,
  max_by(ITEM_NAMES_raw,   event_time) AS ITEM_NAMES,
  max_by(NOMENCLATURE_raw, event_time) AS NOMENCLATURE,
  max_by(NSN_NAME_raw,     event_time) AS NSN_NAME,
  max_by(PART_NAME_raw,    event_time) AS PART_NAME
FROM base
WHERE item_id IS NOT NULL
GROUP BY item_id;

-- Gold dimension: latest non-empty item_name and fsc_title
CREATE TABLE IF NOT EXISTS publog_gold.item_dim_latest_v1
WITH (
  format='PARQUET',
  write_compression='ZSTD',
  external_location='s3://publog-gold-user-dev-20250831/item_dim_latest_v1/'
) AS
SELECT
  e.item_id,
  max_by(e.item_name, e.event_time) AS item_name,
  max_by(e.fsc_title, e.event_time) AS fsc_title
FROM publog_silver.parts_source_union_projected e
WHERE e.item_id IS NOT NULL AND e.event_time IS NOT NULL
GROUP BY e.item_id;

