-- Databases
CREATE DATABASE IF NOT EXISTS publog_silver;
CREATE DATABASE IF NOT EXISTS publog_gold;

-- Raw archive (partitioned by dt)
CREATE EXTERNAL TABLE IF NOT EXISTS publog_silver.raw_user_events_archive_v1 (
  payload string
)
PARTITIONED BY (dt string)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
LOCATION 's3://publog-raw-user-dev-20250831/archive/';

-- Root H-series scan (non-partitioned; filtered by "$path" downstream)
CREATE EXTERNAL TABLE IF NOT EXISTS publog_silver.raw_user_events_h_scan_v1 (
  payload string
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
LOCATION 's3://publog-raw-user-dev-20250831/';

-- Register archive partitions (optional if crawler registers them)
-- MSCK REPAIR TABLE publog_silver.raw_user_events_archive_v1;

