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
- docs/sql/25_union_ctas_v2_zstd.sql (optional)
- docs/sql/30_parts_canonical_view.sql
- docs/sql/40_projection_table.sql (recommended)
- docs/sql/57_nsn_NIIN?name enrichment)
- docs/sql/55_item_dim_latest.sql (optional, recommended for joins)
- docs/sql/60_prepared_statements.sql
- docs/sql/65_gold_aggregates.sql (optional, recommended for Top-N)
- docs/sql/99_validation.sql


- docs/sql/70_procurement_niin_summary_enriched.sql (recommended for Lambda)

- docs/sql/75_prepared_from_enriched.sql (optional prepared statements over enriched summary)


Recommendations for NL?SQL Lambda

- Prefer selecting from publog_gold.procurement_niin_summary_enriched_v1 when producing NIIN-level summaries; it includes item_name and FSC_TITLE already.

- If generating ad-hoc SQL, always LEFT JOIN publog_gold.niin_dim_latest_v1 d ON d.niin = a.niin to enrich names.

- Keep WHERE dt BETWEEN ... to leverage partition pruning on curated/aggregates.
