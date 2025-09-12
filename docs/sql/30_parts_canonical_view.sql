-- Canonical VIEW: exposes stable schema and fill chains; enforces types
CREATE OR REPLACE VIEW publog_silver.parts_canonical AS
WITH canon_inputs AS (
  SELECT
    CAST(s.event_time AS timestamp) AS event_time,
    CAST(s.dt AS varchar)           AS dt,
    CAST(s.user_id AS varchar)      AS user_id,
    CAST(s.session_id AS varchar)   AS session_id,
    CAST(s.event_name AS varchar)   AS event_name,
    CAST(s.item_id AS varchar)      AS item_id,
    NULLIF(TRIM(s.item_name), '')   AS item_name_u,
    NULLIF(TRIM(s.fsc_title), '')   AS fsc_title_u
  FROM publog_silver.parts_source_union s
  WHERE s.event_time IS NOT NULL
),
joined AS (
  SELECT
    i.*,
    NULLIF(TRIM(a.ITEM_NAME), '')     AS item_name_a1,
    NULLIF(TRIM(a.ITEM_NAMES), '')    AS item_name_a2,
    NULLIF(TRIM(a.NOMENCLATURE), '')  AS item_name_a3,
    NULLIF(TRIM(a.NSN_NAME), '')      AS item_name_a4,
    NULLIF(TRIM(a.PART_NAME), '')     AS item_name_a5,
    NULLIF(TRIM(r.item_name_ref), '') AS item_name_ref
  FROM canon_inputs i
  LEFT JOIN publog_silver.item_name_attributes_v1 a ON a.item_id = i.item_id
  LEFT JOIN publog_gold.item_name_reference_v1  r ON r.item_id = i.item_id
)
SELECT
  event_time,
  dt,
  user_id,
  session_id,
  event_name,
  item_id,
  CAST(COALESCE(item_name_a1, item_name_a2, item_name_a3, item_name_a4, item_name_a5, item_name_ref, item_name_u) AS varchar) AS item_name,
  CAST(COALESCE(fsc_title_u, '(unknown)') AS varchar) AS FSC_TITLE
FROM joined;

