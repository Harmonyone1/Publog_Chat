# API Contract: `/ask` (POST)

The chat UI sends:
```json
{ "question": "Top 10 NIINs by revenue in 2022?" }
```

Expected response:
```json
{
  "answer": "Your natural-language answer paragraph here.",
  "sql": "SELECT ...",
  "columns": ["colA","colB"],
  "rows": [["v1","v2"], ["v3","v4"]],
  "citations": [{"title":"...", "url":"..."}],
  "timing_ms": 812,
  "workgroup": "wg_publog_readonly"
}
```

Error example:
```json
{ "answer": "", "error": "Athena error: ... (details)" }
```
or an HTTP 500/400 with `{ "message": "..." }`.

Notes:
- `rows` should be a 2D array of strings (or nulls). The UI previews the first ~10 rows.
- Keep CORS open to your UI, or configure Vercel domain specifically.
