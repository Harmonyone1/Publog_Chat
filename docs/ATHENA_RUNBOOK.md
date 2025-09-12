Athena/Glue runbook for Publog (dev)

Scope
- Non-destructive, additive objects: externals, CTAS union, canonical VIEW, prepared statements.
- Assumes databases: publog_silver, publog_gold; workgroup: wg_publog_readonly (adjust if different).

Order
1) Externals (raw metadata only)
2) CTAS union to Parquet (partitioned by dt)
3) Canonical VIEW (FSC_TITLE + item_name)
4) Prepared statements (canonical-only)
5) Validation queries

Execute
- Console: paste each SQL block into Athena (Engine 3), Workgroup = wg_publog_readonly.
- One-shot scripts (require AWS CLI configured):
  - PowerShell (Windows): scripts/athena-run-dev.ps1 -WorkGroup wg_publog_readonly -Region us-east-1
  - Bash (macOS/Linux):   scripts/athena-run-dev.sh wg_publog_readonly
- CLI example (single file):
  aws athena start-query-execution \
    --work-group wg_publog_readonly \
    --query-string "$(Get-Content -Raw docs/sql/20_union_ctas.sql)" \
    --region us-east-1

Files
- docs/sql/10_raw_sources.sql
- docs/sql/20_union_ctas.sql
- docs/sql/30_parts_canonical_view.sql
- docs/sql/60_prepared_statements.sql
- docs/sql/99_validation.sql
