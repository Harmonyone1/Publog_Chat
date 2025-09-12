-- Optional v2 union with ZSTD compression
CREATE TABLE IF NOT EXISTS publog_silver.parts_source_union_v2
WITH (
  format = 'PARQUET',
  write_compression = 'ZSTD',
  external_location = 's3://publog-silver-user-dev-20250831/parts_source_union_v2/',
  partitioned_by = ARRAY['dt']
) AS
SELECT * FROM publog_silver.parts_source_union;

CREATE EXTERNAL TABLE IF NOT EXISTS publog_silver.parts_source_union_v2_projected (
  event_time timestamp,
  user_id    varchar,
  session_id varchar,
  event_name varchar,
  item_id    varchar,
  item_name  varchar,
  fsc_title  varchar
)
PARTITIONED BY (dt string)
STORED AS PARQUET
LOCATION 's3://publog-silver-user-dev-20250831/parts_source_union_v2/'
TBLPROPERTIES (
  'projection.enabled'='true',
  'projection.dt.type'='date',
  'projection.dt.format'='yyyy-MM-dd',
  'projection.dt.range'='2022-01-01,NOW',
  'storage.location.template'='s3://publog-silver-user-dev-20250831/parts_source_union_v2/dt=${dt}/'
);

