param(
  [string]$WorkGroup = "wg_publog_readonly",
  [string]$Region = $env:AWS_REGION -ne $null -and $env:AWS_REGION -ne '' ? $env:AWS_REGION : "us-east-1"
)

function Invoke-AthenaSql([string]$SqlPath) {
  Write-Host "Running: $SqlPath in workgroup $WorkGroup ($Region)" -ForegroundColor Cyan
  $query = Get-Content -Raw -Path $SqlPath
  $start = aws athena start-query-execution --work-group $WorkGroup --query-string $query --region $Region | ConvertFrom-Json
  $id = $start.QueryExecutionId
  if (-not $id) { throw "Failed to start query for $SqlPath" }
  while ($true) {
    Start-Sleep -Seconds 2
    $st = aws athena get-query-execution --query-execution-id $id --region $Region | ConvertFrom-Json
    $state = $st.QueryExecution.Status.State
    if ($state -eq 'SUCCEEDED') {
      $bytes = $st.QueryExecution.Statistics.DataScannedInBytes
      Write-Host "SUCCEEDED: $SqlPath (bytes scanned: $bytes)" -ForegroundColor Green
      break
    }
    if ($state -eq 'FAILED' -or $state -eq 'CANCELLED') {
      $reason = $st.QueryExecution.Status.StateChangeReason
      throw "FAILED: $SqlPath ($reason)"
    }
  }
}

$root = Resolve-Path "$PSScriptRoot/.."
Invoke-AthenaSql "$root/docs/sql/10_raw_sources.sql"
Invoke-AthenaSql "$root/docs/sql/20_union_ctas.sql"
Invoke-AthenaSql "$root/docs/sql/30_parts_canonical_view.sql"
Invoke-AthenaSql "$root/docs/sql/60_prepared_statements.sql"
Invoke-AthenaSql "$root/docs/sql/99_validation.sql"

Write-Host "All queries completed." -ForegroundColor Green

