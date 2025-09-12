#!/usr/bin/env bash
set -euo pipefail

WG=${1:-wg_publog_readonly}
REGION=${AWS_REGION:-us-east-1}

run() {
  local sql="$1"
  echo "Running: $sql in workgroup $WG ($REGION)" >&2
  local qid
  qid=$(aws athena start-query-execution --work-group "$WG" --query-string "$(cat "$sql")" --region "$REGION" --query QueryExecutionId --output text)
  if [[ -z "$qid" ]]; then echo "Failed to start $sql" >&2; exit 1; fi
  while true; do
    sleep 2
    state=$(aws athena get-query-execution --query-execution-id "$qid" --region "$REGION" --query 'QueryExecution.Status.State' --output text)
    if [[ "$state" == "SUCCEEDED" ]]; then
      bytes=$(aws athena get-query-execution --query-execution-id "$qid" --region "$REGION" --query 'QueryExecution.Statistics.DataScannedInBytes' --output text)
      echo "SUCCEEDED: $sql (bytes scanned: $bytes)" >&2
      break
    fi
    if [[ "$state" == "FAILED" || "$state" == "CANCELLED" ]]; then
      reason=$(aws athena get-query-execution --query-execution-id "$qid" --region "$REGION" --query 'QueryExecution.Status.StateChangeReason' --output text)
      echo "FAILED: $sql ($reason)" >&2
      exit 1
    fi
  done
}

ROOT=$(cd "$(dirname "$0")/.." && pwd)
run "$ROOT/docs/sql/10_raw_sources.sql"
run "$ROOT/docs/sql/20_union_ctas.sql"
run "$ROOT/docs/sql/30_parts_canonical_view.sql"
run "$ROOT/docs/sql/60_prepared_statements.sql"
run "$ROOT/docs/sql/99_validation.sql"
echo "All queries completed." >&2

